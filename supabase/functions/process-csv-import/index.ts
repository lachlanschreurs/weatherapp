import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CSVImport {
  id: string;
  user_id: string;
  connection_id: string;
  filename: string;
  column_mapping: Record<string, string>;
  raw_data: string;
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const cells: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    cells.push(currentCell.trim());
    return cells;
  });
}

function parseTimestamp(value: string): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;

  const cleaned = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

async function processCSVImport(supabase: any, csvImport: CSVImport) {
  try {
    console.log(`Processing CSV import ${csvImport.id} for connection ${csvImport.connection_id}`);

    const rows = parseCSV(csvImport.raw_data);

    if (rows.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const mapping = csvImport.column_mapping;

    const timestampIdx = headers.indexOf(mapping.timestamp || '');
    const moistureIdx = headers.indexOf(mapping.moisture || '');
    const soilTempIdx = mapping.soil_temp ? headers.indexOf(mapping.soil_temp) : -1;
    const rainfallIdx = mapping.rainfall ? headers.indexOf(mapping.rainfall) : -1;
    const batteryIdx = mapping.battery ? headers.indexOf(mapping.battery) : -1;

    if (timestampIdx === -1) {
      throw new Error('Timestamp column not found in CSV');
    }
    if (moistureIdx === -1) {
      throw new Error('Moisture column not found in CSV');
    }

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    let latestReading: any = null;
    let latestTimestamp = new Date(0);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      if (row.length < headers.length) {
        errorCount++;
        errors.push(`Row ${i + 2}: Insufficient columns`);
        continue;
      }

      try {
        const timestamp = parseTimestamp(row[timestampIdx]);
        const moisture = parseNumber(row[moistureIdx]);

        if (moisture === null) {
          errorCount++;
          errors.push(`Row ${i + 2}: Invalid moisture value`);
          continue;
        }

        const reading = {
          user_id: csvImport.user_id,
          connection_id: csvImport.connection_id,
          provider: 'csv_import',
          station_id: csvImport.connection_id,
          device_id: null,
          moisture_percent: moisture,
          soil_temp_c: soilTempIdx >= 0 ? parseNumber(row[soilTempIdx]) : null,
          rainfall_mm: rainfallIdx >= 0 ? parseNumber(row[rainfallIdx]) : null,
          battery_level: batteryIdx >= 0 ? parseNumber(row[batteryIdx]) : null,
          measured_at: timestamp,
          raw_payload: { row: row, headers: headers },
          synced_at: new Date().toISOString(),
        };

        const readingTimestamp = new Date(timestamp);
        if (readingTimestamp > latestTimestamp) {
          latestTimestamp = readingTimestamp;
          latestReading = reading;
        }

        processedCount++;

      } catch (err: any) {
        errorCount++;
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    if (latestReading) {
      const { error: upsertError } = await supabase
        .from('probe_readings_latest')
        .upsert(latestReading, {
          onConflict: 'user_id,connection_id'
        });

      if (upsertError) {
        console.error('Error upserting latest reading:', upsertError);
        throw upsertError;
      }
    }

    const finalStatus = errorCount > 0 && processedCount === 0 ? 'failed' :
                        errorCount > 0 ? 'partial' : 'completed';

    await supabase
      .from('probe_csv_imports')
      .update({
        status: finalStatus,
        row_count: dataRows.length,
        processed_count: processedCount,
        error_count: errorCount,
        processing_errors: errors.length > 0 ? errors.slice(0, 50) : null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', csvImport.id);

    await supabase
      .from('probe_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: finalStatus === 'failed' ? 'CSV processing failed' : null,
      })
      .eq('id', csvImport.connection_id);

    console.log(`CSV import ${csvImport.id} processed: ${processedCount} rows succeeded, ${errorCount} failed`);

    return {
      success: true,
      processed_count: processedCount,
      error_count: errorCount,
      errors: errors.slice(0, 10),
    };

  } catch (error: any) {
    console.error(`Error processing CSV import ${csvImport.id}:`, error);

    await supabase
      .from('probe_csv_imports')
      .update({
        status: 'failed',
        processing_errors: [error.message],
        processed_at: new Date().toISOString(),
      })
      .eq('id', csvImport.id);

    await supabase
      .from('probe_connections')
      .update({
        last_error: `CSV processing error: ${error.message}`,
      })
      .eq('id', csvImport.connection_id);

    return {
      success: false,
      error: error.message,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const importId = url.searchParams.get('import_id');
    const processAll = url.searchParams.get('process_all') === 'true';

    if (processAll) {
      const { data: imports, error: fetchError } = await supabaseClient
        .from('probe_csv_imports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (fetchError) throw fetchError;

      const results = [];
      for (const csvImport of imports || []) {
        const result = await processCSVImport(supabaseClient, csvImport);
        results.push({
          import_id: csvImport.id,
          filename: csvImport.filename,
          ...result,
        });
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (importId) {
      const { data: csvImport, error: fetchError } = await supabaseClient
        .from('probe_csv_imports')
        .select('*')
        .eq('id', importId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!csvImport) {
        return new Response(
          JSON.stringify({ error: 'CSV import not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await processCSVImport(supabaseClient, csvImport);

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Missing import_id parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-csv-import function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
