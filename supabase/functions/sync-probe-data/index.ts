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
