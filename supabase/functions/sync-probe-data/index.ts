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
  air_temp_c: number | null;
  humidity_percent: number | null;
  moisture_depths: { depths: Array<{ depth_cm: number; value: number; channel: number }> };
  soil_temp_depths: { depths: Array<{ depth_cm: number; value: number; channel: number }> };
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
    const publicKey = connection.api_key;
    const privateKey = connection.api_secret;
    const stationId = connection.station_id;

    console.log('=== FIELDCLIMATE API DEBUG START ===');
    console.log('Station ID:', stationId);
    console.log('Public Key:', publicKey);
    console.log('Private Key (length):', privateKey.length);

    const route = `/data/${stationId}/raw/last/1h`;
    const method = 'GET';

    const now = new Date();
    const dateHeader = now.toUTCString();

    const stringToSign = method + route + dateHeader + publicKey;

    console.log('\n=== SIGNATURE GENERATION ===');
    console.log('Method:', method);
    console.log('Route:', route);
    console.log('Date Header:', dateHeader);
    console.log('Public Key:', publicKey);
    console.log('String to Sign:', stringToSign);
    console.log('String to Sign (length):', stringToSign.length);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey);
    const messageData = encoder.encode(stringToSign);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hmacHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Generated Signature:', hmacHex);

    const authHeader = `hmac ${publicKey}:${hmacHex}`;
    console.log('Authorization Header:', authHeader);

    const url = `https://api.fieldclimate.com${route}`;
    console.log('\n=== REQUEST ===');
    console.log('URL:', url);

    const headers = {
      'Accept': 'application/json',
      'Authorization': authHeader,
      'Date': dateHeader,
    };

    console.log('Headers:', JSON.stringify(headers, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('FieldClimate API request timed out after 30 seconds. The station may be offline or experiencing connectivity issues.');
      }
      throw error;
    }

    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('Body (length):', responseText.length);
    console.log('Body:', responseText);

    if (!response.ok) {
      console.error('❌ REQUEST FAILED');

      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(responseText);
        console.log('Error JSON:', JSON.stringify(errorJson, null, 2));
        errorDetail = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        errorDetail = responseText || errorDetail;
      }

      if (response.status === 401) {
        throw new Error('Authentication failed (401). The HMAC signature is being rejected by FieldClimate. Verify your HMAC Public Key and Private Key are correct.');
      } else if (response.status === 404) {
        throw new Error(`Station ${stationId} not found (404). Verify the station ID is correct.`);
      } else if (response.status === 403) {
        throw new Error('Access forbidden (403). Check that your API keys have permission for this station.');
      }

      throw new Error(errorDetail);
    }

    console.log('✓ SUCCESS');

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Response Structure:', Object.keys(data));
      console.log('Full Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('ERROR: Failed to parse JSON');
      throw new Error('Invalid JSON response from FieldClimate API');
    }

    console.log('=== FIELDCLIMATE API DEBUG END ===\n');
    return data;
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
      air_temp_c: null,
      humidity_percent: null,
      moisture_depths: { depths: [] },
      soil_temp_depths: { depths: [] },
      measured_at: new Date().toISOString(),
      raw_payload: rawData,
    };

    if (!rawData) {
      console.warn('No data in FieldClimate response');
      return result;
    }

    if (rawData.data && Array.isArray(rawData.data) && rawData.data.length > 0) {
      const latestReading = rawData.data[rawData.data.length - 1];

      result.measured_at = latestReading.date || new Date().toISOString();

      if (sensorMapping.moisture && latestReading[sensorMapping.moisture]) {
        result.moisture_percent = parseFloat(latestReading[sensorMapping.moisture]);
      }
      if (sensorMapping.soil_temp && latestReading[sensorMapping.soil_temp]) {
        result.soil_temp_c = parseFloat(latestReading[sensorMapping.soil_temp]);
      }
      if (sensorMapping.rainfall && latestReading[sensorMapping.rainfall]) {
        result.rainfall_mm = parseFloat(latestReading[sensorMapping.rainfall]);
      }
      if (sensorMapping.battery && latestReading[sensorMapping.battery]) {
        result.battery_level = parseFloat(latestReading[sensorMapping.battery]);
      }
      if (sensorMapping.air_temp && latestReading[sensorMapping.air_temp]) {
        result.air_temp_c = parseFloat(latestReading[sensorMapping.air_temp]);
      }
      if (sensorMapping.humidity && latestReading[sensorMapping.humidity]) {
        result.humidity_percent = parseFloat(latestReading[sensorMapping.humidity]);
      }

      if (rawData.sensors && Array.isArray(rawData.sensors)) {
        const moistureSensors = rawData.sensors.filter((s: any) => s.code === 34944);
        const tempSensors = rawData.sensors.filter((s: any) => s.code === 34946);

        const serialKey = Object.keys(latestReading).find(k => k.includes('33809'));
        const serialNum = latestReading[serialKey];

        moistureSensors.forEach((sensor: any, index: number) => {
          const key = `${sensor.ch}_X_${serialNum}_34944_avg`;
          const value = latestReading[key];
          if (value !== undefined && value !== null) {
            result.moisture_depths.depths.push({
              depth_cm: (index + 1) * 10,
              value: parseFloat(value),
              channel: sensor.ch
            });
          }
        });

        tempSensors.forEach((sensor: any, index: number) => {
          const key = `${sensor.ch}_X_${serialNum}_34946_avg`;
          const value = latestReading[key];
          if (value !== undefined && value !== null) {
            result.soil_temp_depths.depths.push({
              depth_cm: (index + 1) * 10,
              value: parseFloat(value),
              channel: sensor.ch
            });
          }
        });
      }

      console.log('Normalized data:', {
        moisture: result.moisture_percent,
        soil_temp: result.soil_temp_c,
        rainfall: result.rainfall_mm,
        battery: result.battery_level,
        air_temp: result.air_temp_c,
        humidity: result.humidity_percent,
        moisture_depths: result.moisture_depths.depths.length,
        temp_depths: result.soil_temp_depths.depths.length,
      });

      return result;
    }

    result.measured_at = rawData.date_time || rawData.dateTime || rawData.timestamp || new Date().toISOString();

    const sensors = rawData.data || rawData.sensors || rawData;

    if (sensorMapping.moisture) {
      result.moisture_percent = this.findSensorValue(sensors, sensorMapping.moisture);
    }
    if (sensorMapping.soil_temp) {
      result.soil_temp_c = this.findSensorValue(sensors, sensorMapping.soil_temp);
    }
    if (sensorMapping.rainfall) {
      result.rainfall_mm = this.findSensorValue(sensors, sensorMapping.rainfall);
    }
    if (sensorMapping.battery) {
      result.battery_level = this.findSensorValue(sensors, sensorMapping.battery);
    }

    if (!result.moisture_percent) {
      result.moisture_percent = this.findValueByAliases(sensors, [
        'moisture',
        'soil_moisture',
        'soilmoisture',
        'vwc',
        'volumetric_water_content',
        'water_content',
        'watercontent',
        'sm',
        'soil_water',
      ]);
    }

    if (!result.soil_temp_c) {
      result.soil_temp_c = this.findValueByAliases(sensors, [
        'soil_temp',
        'soil_temperature',
        'soiltemp',
        'soiltemperature',
        'temp_soil',
        'temperature_soil',
        'st',
        'ground_temp',
        'ground_temperature',
      ]);
    }

    if (!result.rainfall_mm) {
      result.rainfall_mm = this.findValueByAliases(sensors, [
        'rain',
        'rainfall',
        'precipitation',
        'precip',
        'rain_1h',
        'rain_24h',
        'rain_total',
      ]);
    }

    if (!result.battery_level) {
      result.battery_level = this.findValueByAliases(sensors, [
        'battery',
        'battery_level',
        'batterylevel',
        'bat',
        'voltage',
        'battery_voltage',
      ]);
    }

    console.log('Normalized data:', {
      moisture: result.moisture_percent,
      soil_temp: result.soil_temp_c,
      rainfall: result.rainfall_mm,
      battery: result.battery_level,
    });

    return result;
  }

  static findSensorValue(data: any, sensorCode: string): number | null {
    try {
      if (!data || typeof data !== 'object') return null;

      if (data[sensorCode]) {
        return this.extractNumericValue(data[sensorCode]);
      }

      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase() === sensorCode.toLowerCase()) {
          return this.extractNumericValue(value);
        }
      }

      return null;
    } catch (error) {
      console.error(`Error finding sensor value for ${sensorCode}:`, error);
      return null;
    }
  }

  static findValueByAliases(data: any, aliases: string[]): number | null {
    try {
      if (!data || typeof data !== 'object') return null;

      const candidates: Array<{ key: string; value: number; score: number }> = [];

      const scanObject = (obj: any, path: string = '') => {
        if (!obj || typeof obj !== 'object') return;

        for (const [key, value] of Object.entries(obj)) {
          const fullPath = path ? `${path}.${key}` : key;
          const keyLower = key.toLowerCase();

          for (let i = 0; i < aliases.length; i++) {
            const alias = aliases[i].toLowerCase();

            if (keyLower === alias) {
              const numValue = this.extractNumericValue(value);
              if (numValue !== null) {
                candidates.push({
                  key: fullPath,
                  value: numValue,
                  score: 100 - i,
                });
              }
            } else if (keyLower.includes(alias)) {
              const numValue = this.extractNumericValue(value);
              if (numValue !== null) {
                candidates.push({
                  key: fullPath,
                  value: numValue,
                  score: 50 - i,
                });
              }
            } else if (alias.includes(keyLower)) {
              const numValue = this.extractNumericValue(value);
              if (numValue !== null) {
                candidates.push({
                  key: fullPath,
                  value: numValue,
                  score: 25 - i,
                });
              }
            }
          }

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nameField = (value as any).name;
            if (nameField && typeof nameField === 'string') {
              const nameLower = nameField.toLowerCase();
              for (let i = 0; i < aliases.length; i++) {
                const alias = aliases[i].toLowerCase();
                if (nameLower.includes(alias) || alias.includes(nameLower)) {
                  const numValue = this.extractNumericValue(value);
                  if (numValue !== null) {
                    candidates.push({
                      key: fullPath,
                      value: numValue,
                      score: 75 - i,
                    });
                  }
                }
              }
            }
          }

          if (typeof value === 'object' && value !== null && Object.keys(value).length < 10) {
            scanObject(value, fullPath);
          }
        }
      };

      scanObject(data);

      if (candidates.length === 0) return null;

      candidates.sort((a, b) => b.score - a.score);

      console.log(`Found ${candidates.length} candidates, best match: ${candidates[0].key} = ${candidates[0].value} (score: ${candidates[0].score})`);

      return candidates[0].value;
    } catch (error) {
      console.error('Error finding value by aliases:', error);
      return null;
    }
  }

  static extractNumericValue(sensorData: any): number | null {
    try {
      if (sensorData === null || sensorData === undefined) return null;

      if (typeof sensorData === 'number') {
        return sensorData;
      }

      if (typeof sensorData !== 'object') return null;

      if (sensorData.values && Array.isArray(sensorData.values) && sensorData.values.length > 0) {
        const lastValue = sensorData.values[sensorData.values.length - 1];
        if (lastValue !== null && lastValue !== undefined) {
          if (typeof lastValue === 'number') return lastValue;
          if (typeof lastValue === 'object' && typeof lastValue.value === 'number') {
            return lastValue.value;
          }
          if (typeof lastValue === 'object' && typeof lastValue.val === 'number') {
            return lastValue.val;
          }
        }
      }

      if (typeof sensorData.value === 'number') {
        return sensorData.value;
      }

      if (typeof sensorData.val === 'number') {
        return sensorData.val;
      }

      if (typeof sensorData.data === 'number') {
        return sensorData.data;
      }

      if (typeof sensorData.reading === 'number') {
        return sensorData.reading;
      }

      if (typeof sensorData.measurement === 'number') {
        return sensorData.measurement;
      }

      if (Array.isArray(sensorData) && sensorData.length > 0) {
        const lastItem = sensorData[sensorData.length - 1];
        return this.extractNumericValue(lastItem);
      }

      return null;
    } catch (error) {
      console.error('Error extracting numeric value:', error);
      return null;
    }
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
        air_temp_c: normalizedData.air_temp_c,
        humidity_percent: normalizedData.humidity_percent,
        moisture_depths: normalizedData.moisture_depths,
        soil_temp_depths: normalizedData.soil_temp_depths,
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

    const url = new URL(req.url);
    const connectionId = url.searchParams.get('connection_id');
    const syncAll = url.searchParams.get('sync_all') === 'true';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let user = null;

    if (syncAll) {
      console.log('sync_all=true: Processing all active connections with service role');
    } else {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !userData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      user = userData.user;
    }

    if (syncAll) {
      const { data: connections, error: fetchError } = await supabaseClient
        .from('probe_connections')
        .select('*')
        .eq('is_active', true);

      if (fetchError) {
        throw fetchError;
      }

      const allConnections: ProbeConnection[] = connections || [];

      // Group connections by provider+station_id so each physical station is only
      // fetched once from the API, then the result is written to all connections
      // that share that station (different users pointing at the same probe).
      const stationGroups: Record<string, ProbeConnection[]> = {};
      for (const conn of allConnections) {
        const key = `${conn.provider.toLowerCase()}::${conn.station_id}`;
        if (!stationGroups[key]) stationGroups[key] = [];
        stationGroups[key].push(conn);
      }

      const results = [];

      for (const [stationKey, group] of Object.entries(stationGroups)) {
        // Try each connection in the group until one succeeds (in case some have bad credentials)
        let normalizedData: NormalizedReading | null = null;
        let primaryConnection: ProbeConnection | null = null;

        for (const conn of group) {
          try {
            console.log(`Fetching station ${conn.station_id} via connection ${conn.id}`);
            const rawData = await ProbeProviderAdapter.fetchData(conn);
            normalizedData = ProbeProviderAdapter.normalizeData(
              conn.provider,
              rawData,
              conn.sensor_mapping || {}
            );
            primaryConnection = conn;
            console.log(`Successfully fetched data for station ${conn.station_id}`);
            break;
          } catch (err: any) {
            console.warn(`Connection ${conn.id} failed for station ${conn.station_id}: ${err.message}`);
            await supabaseClient
              .from('probe_connections')
              .update({ last_error: err.message })
              .eq('id', conn.id);
          }
        }

        if (!normalizedData || !primaryConnection) {
          for (const conn of group) {
            results.push({ connection_id: conn.id, station_id: conn.station_id, success: false, error: 'All credentials failed for this station' });
          }
          continue;
        }

        // Write the fetched data to every connection in the group
        for (const conn of group) {
          try {
            const { error: upsertError } = await supabaseClient
              .from('probe_readings_latest')
              .upsert({
                user_id: conn.user_id,
                connection_id: conn.id,
                provider: conn.provider,
                station_id: conn.station_id,
                device_id: conn.device_id,
                moisture_percent: normalizedData.moisture_percent,
                soil_temp_c: normalizedData.soil_temp_c,
                rainfall_mm: normalizedData.rainfall_mm,
                battery_level: normalizedData.battery_level,
                air_temp_c: normalizedData.air_temp_c,
                humidity_percent: normalizedData.humidity_percent,
                moisture_depths: normalizedData.moisture_depths,
                soil_temp_depths: normalizedData.soil_temp_depths,
                raw_payload: normalizedData.raw_payload,
                measured_at: normalizedData.measured_at,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'user_id,connection_id' });

            if (upsertError) throw upsertError;

            await supabaseClient
              .from('probe_connections')
              .update({ last_sync_at: new Date().toISOString(), last_error: null })
              .eq('id', conn.id);

            results.push({ connection_id: conn.id, station_id: conn.station_id, success: true });
          } catch (writeErr: any) {
            results.push({ connection_id: conn.id, station_id: conn.station_id, success: false, error: writeErr.message });
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (connectionId) {
      let query = supabaseClient
        .from('probe_connections')
        .select('*')
        .eq('id', connectionId);

      if (user) {
        query = query.eq('user_id', user.id);
      }

      const { data: connection, error: fetchError } = await query.maybeSingle();

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

    let query = supabaseClient
      .from('probe_connections')
      .select('*')
      .eq('is_active', true);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data: connections, error: fetchError } = await query;

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

    let readingsQuery = supabaseClient
      .from('probe_readings_latest')
      .select('*');

    if (user) {
      readingsQuery = readingsQuery.eq('user_id', user.id);
    }

    const { data: readings } = await readingsQuery;

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
