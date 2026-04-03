import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProbeConnection {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  api_secret: string;
  station_id: string;
  device_id: string | null;
  sensor_mapping: Record<string, string>;
}

interface NormalizedReading {
  moisture_percent: number | null;
  soil_temp_c: number | null;
  rainfall_mm: number | null;
  battery_level: number | null;
  measured_at: string;
  raw_payload: any;
}

class ProbeProviderAdapter {
  static async fetchData(connection: ProbeConnection): Promise<any> {
    const provider = connection.provider.toLowerCase();

    if (provider === 'fieldclimate') {
      return await this.fetchFieldClimateData(connection);
    }

    throw new Error(`Unsupported provider: ${connection.provider}`);
  }

  static async fetchFieldClimateData(connection: ProbeConnection): Promise<any> {
    const authString = `${connection.api_key}:${connection.api_secret}`;
    const base64Auth = btoa(authString);

    const url = `https://api.fieldclimate.com/v2/data/${connection.station_id}/last`;

    console.log(`Fetching FieldClimate data for station: ${connection.station_id}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FieldClimate API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  static normalizeData(
    provider: string,
    rawData: any,
    sensorMapping: Record<string, string>
  ): NormalizedReading {
    const providerLower = provider.toLowerCase();

    if (providerLower === 'fieldclimate') {
      return this.normalizeFieldClimateData(rawData, sensorMapping);
    }

    throw new Error(`Unsupported provider for normalization: ${provider}`);
  }

  static normalizeFieldClimateData(
    rawData: any,
    sensorMapping: Record<string, string>
  ): NormalizedReading {
    const result: NormalizedReading = {
      moisture_percent: null,
      soil_temp_c: null,
      rainfall_mm: null,
      battery_level: null,
      measured_at: new Date().toISOString(),
      raw_payload: rawData,
    };

    if (!rawData || !rawData.data) {
      console.warn('No data field in FieldClimate response');
      return result;
    }

    const sensors = rawData.data;

    result.measured_at = rawData.date_time || new Date().toISOString();

    for (const [sensorCode, sensorData] of Object.entries(sensors)) {
      if (!sensorData || typeof sensorData !== 'object') continue;

      const data = sensorData as any;

      if (sensorMapping.moisture && sensorCode === sensorMapping.moisture) {
        result.moisture_percent = this.extractNumericValue(data);
      } else if (sensorMapping.soil_temp && sensorCode === sensorMapping.soil_temp) {
        result.soil_temp_c = this.extractNumericValue(data);
      } else if (sensorMapping.rainfall && sensorCode === sensorMapping.rainfall) {
        result.rainfall_mm = this.extractNumericValue(data);
      } else if (sensorMapping.battery && sensorCode === sensorMapping.battery) {
        result.battery_level = this.extractNumericValue(data);
      } else {
        const sensorName = (data.name || '').toLowerCase();
        const sensorCodeLower = sensorCode.toLowerCase();

        if (!result.moisture_percent && (
          sensorName.includes('moisture') ||
          sensorName.includes('water content') ||
          sensorCodeLower.includes('sm') ||
          sensorCodeLower.includes('vwc')
        )) {
          result.moisture_percent = this.extractNumericValue(data);
        }

        else if (!result.soil_temp_c && (
          sensorName.includes('soil') && sensorName.includes('temp') ||
          sensorCodeLower.includes('st') ||
          sensorCodeLower.includes('soil_temp')
        )) {
          result.soil_temp_c = this.extractNumericValue(data);
        }

        else if (!result.rainfall_mm && (
          sensorName.includes('rain') ||
          sensorName.includes('precipitation') ||
          sensorCodeLower.includes('rain') ||
          sensorCodeLower.includes('precip')
        )) {
          result.rainfall_mm = this.extractNumericValue(data);
        }

        else if (!result.battery_level && (
          sensorName.includes('battery') ||
          sensorCodeLower.includes('bat') ||
          sensorCodeLower.includes('battery')
        )) {
          result.battery_level = this.extractNumericValue(data);
        }
      }
    }

    console.log('Normalized data:', {
      moisture: result.moisture_percent,
      soil_temp: result.soil_temp_c,
      rainfall: result.rainfall_mm,
      battery: result.battery_level,
    });

    return result;
  }

  static extractNumericValue(sensorData: any): number | null {
    if (sensorData.values && Array.isArray(sensorData.values) && sensorData.values.length > 0) {
      const lastValue = sensorData.values[sensorData.values.length - 1];
      if (lastValue && typeof lastValue.value === 'number') {
        return lastValue.value;
      }
    }

    if (typeof sensorData.value === 'number') {
      return sensorData.value;
    }

    if (sensorData.val !== undefined && typeof sensorData.val === 'number') {
      return sensorData.val;
    }

    return null;
  }
}

async function syncProbeData(
  supabase: any,
  connection: ProbeConnection
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Syncing probe data for connection ${connection.id}, station ${connection.station_id}`);

    const rawData = await ProbeProviderAdapter.fetchData(connection);

    const normalizedData = ProbeProviderAdapter.normalizeData(
      connection.provider,
      rawData,
      connection.sensor_mapping || {}
    );

    const { error: upsertError } = await supabase
      .from('probe_readings_latest')
      .upsert({
        user_id: connection.user_id,
        connection_id: connection.id,
        provider: connection.provider,
        station_id: connection.station_id,
        device_id: connection.device_id,
        moisture_percent: normalizedData.moisture_percent,
        soil_temp_c: normalizedData.soil_temp_c,
        rainfall_mm: normalizedData.rainfall_mm,
        battery_level: normalizedData.battery_level,
        raw_payload: normalizedData.raw_payload,
        measured_at: normalizedData.measured_at,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,connection_id'
      });

    if (upsertError) {
      throw upsertError;
    }

    await supabase
      .from('probe_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', connection.id);

    console.log(`Successfully synced probe data for connection ${connection.id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`Error syncing probe data for connection ${connection.id}:`, error);

    const errorMessage = error.message || 'Unknown error';

    await supabase
      .from('probe_connections')
      .update({
        last_error: errorMessage,
      })
      .eq('id', connection.id);

    return { success: false, error: errorMessage };
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
    const connectionId = url.searchParams.get('connection_id');
    const syncAll = url.searchParams.get('sync_all') === 'true';

    if (syncAll) {
      const { data: connections, error: fetchError } = await supabaseClient
        .from('probe_connections')
        .select('*')
        .eq('is_active', true);

      if (fetchError) {
        throw fetchError;
      }

      const results = [];
      for (const connection of connections || []) {
        const result = await syncProbeData(supabaseClient, connection);
        results.push({
          connection_id: connection.id,
          station_id: connection.station_id,
          ...result,
        });
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (connectionId) {
      const { data: connection, error: fetchError } = await supabaseClient
        .from('probe_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!connection) {
        return new Response(
          JSON.stringify({ error: 'Probe connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await syncProbeData(supabaseClient, connection);

      if (result.success) {
        const { data: reading } = await supabaseClient
          .from('probe_readings_latest')
          .select('*')
          .eq('connection_id', connectionId)
          .maybeSingle();

        return new Response(
          JSON.stringify({ success: true, reading }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: connections, error: fetchError } = await supabaseClient
      .from('probe_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (fetchError) {
      throw fetchError;
    }

    const results = [];
    for (const connection of connections || []) {
      const result = await syncProbeData(supabaseClient, connection);
      results.push({
        connection_id: connection.id,
        station_id: connection.station_id,
        ...result,
      });
    }

    const { data: readings } = await supabaseClient
      .from('probe_readings_latest')
      .select('*')
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ success: true, results, readings }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-probe-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
