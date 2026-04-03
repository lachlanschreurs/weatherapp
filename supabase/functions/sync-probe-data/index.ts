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
    const publicKey = connection.api_key;
    const privateKey = connection.api_secret;
    const stationId = connection.station_id;

    console.log('=== FIELDCLIMATE API DEBUG START ===');
    console.log('Station ID:', stationId);
    console.log('Public Key (first 12 chars):', publicKey.substring(0, 12) + '...');
    console.log('Private Key (first 12 chars):', privateKey.substring(0, 12) + '...');

    const now = new Date();
    const timestampUnix = Math.floor(now.getTime() / 1000);

    const endpoints = [
      {
        route: `/v2/data/${stationId}/raw/last/${timestampUnix}`,
        name: 'raw/last with timestamp'
      },
      {
        route: `/v2/data/${stationId}/last/${timestampUnix}`,
        name: 'last with timestamp'
      },
      {
        route: `/v2/data/${stationId}/raw/last`,
        name: 'raw/last without timestamp'
      },
      {
        route: `/v2/data/${stationId}/last`,
        name: 'last without timestamp'
      },
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`\n--- Testing endpoint: ${endpoint.name} ---`);
        console.log('Route:', endpoint.route);

        const method = 'GET';

        const dateHeader = now.toUTCString();

        const stringToSign = `${method}${endpoint.route}${dateHeader}${publicKey}`;

        console.log('Authentication Details:');
        console.log('  Method:', method);
        console.log('  Route:', endpoint.route);
        console.log('  Date Header:', dateHeader);
        console.log('  Public Key:', publicKey);
        console.log('  String to sign:', `"${stringToSign}"`);
        console.log('  String length:', stringToSign.length);
        console.log('  String bytes:', new TextEncoder().encode(stringToSign).length);

        const encoder = new TextEncoder();
        const keyData = encoder.encode(privateKey);
        const messageData = encoder.encode(stringToSign);

        console.log('  Private key length:', privateKey.length);
        console.log('  Private key bytes:', keyData.length);

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

        console.log('  HMAC Signature:', hmacHex);

        const authHeader = `hmac ${publicKey}:${hmacHex}`;
        console.log('  Authorization Header:', authHeader);

        const url = `https://api.fieldclimate.com${endpoint.route}`;
        console.log('  Full URL:', url);

        const headers = {
          'Accept': 'application/json',
          'Authorization': authHeader,
          'Date': dateHeader,
        };

        console.log('\nSending Request...');

        const response = await fetch(url, {
          method: method,
          headers: headers,
        });

        console.log('\nResponse Received:');
        console.log('  Status:', response.status, response.statusText);

        const responseHeaders = Object.fromEntries(response.headers.entries());
        console.log('  Response Headers:', JSON.stringify(responseHeaders, null, 2));

        const responseText = await response.text();
        console.log('  Body Length:', responseText.length);

        if (responseText.length > 0) {
          console.log('  Body (first 1000 chars):', responseText.substring(0, 1000));
        }

        if (!response.ok) {
          console.error('  ❌ REQUEST FAILED');

          let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorJson = JSON.parse(responseText);
            console.log('  Error JSON:', JSON.stringify(errorJson, null, 2));

            if (errorJson.message) {
              errorDetail = errorJson.message;
            } else if (errorJson.error) {
              errorDetail = errorJson.error;
            } else if (errorJson.errors) {
              errorDetail = JSON.stringify(errorJson.errors);
            } else {
              errorDetail = JSON.stringify(errorJson);
            }
          } catch (e) {
            console.log('  Error body is not JSON');
            if (responseText.length > 0) {
              errorDetail = responseText.substring(0, 300);
            }
          }

          lastError = {
            endpoint: endpoint.name,
            route: endpoint.route,
            status: response.status,
            statusText: response.statusText,
            error: errorDetail,
            body: responseText,
          };

          console.log('  Trying next endpoint...\n');
          continue;
        }

        console.log('  ✓ SUCCESS');

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('  Response Structure:');
          console.log('    Top-level keys:', Object.keys(data));

          if (data.data) {
            console.log('    data keys:', Object.keys(data.data));
          }
          if (data.devices) {
            console.log('    devices count:', data.devices.length);
            if (data.devices.length > 0) {
              console.log('    first device keys:', Object.keys(data.devices[0]));
            }
          }

          console.log('  Full Response:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.error('  ERROR: Failed to parse JSON');
          throw new Error('Invalid JSON response from FieldClimate API');
        }

        console.log('=== FIELDCLIMATE API DEBUG END (SUCCESS) ===\n');
        return data;

      } catch (error: any) {
        console.error(`  Exception: ${error.message}`);
        lastError = {
          endpoint: endpoint.name,
          route: endpoint.route,
          error: error.message,
        };
      }
    }

    console.log('=== FIELDCLIMATE API DEBUG END (ALL ENDPOINTS FAILED) ===\n');
    console.log('Final Error:', JSON.stringify(lastError, null, 2));

    if (lastError) {
      let errorMessage = 'FieldClimate API Error: ';

      if (lastError.status === 401) {
        errorMessage += 'Authentication failed. Please verify:\n';
        errorMessage += '- HMAC Public Key is correct\n';
        errorMessage += '- HMAC Private Key is correct\n';
        errorMessage += '- Keys have not expired';
      } else if (lastError.status === 404) {
        errorMessage += `Station ${stationId} not found. Verify the station ID is correct.`;
      } else if (lastError.status === 403) {
        errorMessage += 'Access forbidden. Check that your API keys have permission for this station.';
      } else if (lastError.error) {
        errorMessage += lastError.error;
      } else {
        errorMessage += `Request failed (${lastError.status || 'unknown error'})`;
      }

      throw new Error(errorMessage);
    }

    throw new Error('FieldClimate API: All endpoints failed with unknown errors');
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

    if (!rawData) {
      console.warn('No data in FieldClimate response');
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
