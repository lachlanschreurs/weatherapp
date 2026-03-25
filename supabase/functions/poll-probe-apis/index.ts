import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProbeApiEndpoint {
  id: string;
  user_id: string;
  api_url: string;
  auth_type: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_token: string;
  response_mapping: Record<string, string>;
}

function getNestedValue(obj: any, path: string): any {
  if (path.startsWith('$.')) {
    path = path.substring(2);
  }

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }

  return value;
}

async function fetchProbeData(endpoint: ProbeApiEndpoint): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (endpoint.auth_type === 'bearer' && endpoint.auth_token) {
    headers['Authorization'] = `Bearer ${endpoint.auth_token}`;
  } else if (endpoint.auth_type === 'api_key' && endpoint.auth_token) {
    headers['X-API-Key'] = endpoint.auth_token;
  } else if (endpoint.auth_type === 'basic' && endpoint.auth_token) {
    headers['Authorization'] = `Basic ${endpoint.auth_token}`;
  }

  const response = await fetch(endpoint.api_url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

function mapResponseToReading(data: any, mapping: Record<string, string>): any {
  const reading: any = {};

  for (const [targetField, sourcePath] of Object.entries(mapping)) {
    const value = getNestedValue(data, sourcePath);
    if (value !== null && value !== undefined) {
      reading[targetField] = value;
    }
  }

  return reading;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const endpointId = url.searchParams.get('endpoint_id');

    if (endpointId) {
      const { data: endpoint, error: endpointError } = await supabase
        .from('probe_api_endpoints')
        .select('*')
        .eq('id', endpointId)
        .eq('active', true)
        .maybeSingle();

      if (endpointError || !endpoint) {
        return new Response(
          JSON.stringify({ error: 'Endpoint not found or inactive' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        const apiData = await fetchProbeData(endpoint);
        const mappedData = mapResponseToReading(apiData, endpoint.response_mapping);

        if (!mappedData.probe_id) {
          throw new Error('probe_id not found in response mapping');
        }

        const { data: probe, error: probeError } = await supabase
          .from('moisture_probes')
          .select('id')
          .eq('id', mappedData.probe_id)
          .eq('user_id', endpoint.user_id)
          .maybeSingle();

        if (probeError || !probe) {
          throw new Error('Probe not found or does not belong to endpoint owner');
        }

        const readingData = {
          probe_id: mappedData.probe_id,
          moisture_percentage: parseFloat(mappedData.moisture_percentage) || 0,
          temperature_c: mappedData.temperature_c ? parseFloat(mappedData.temperature_c) : null,
          battery_percentage: mappedData.battery_percentage ? parseFloat(mappedData.battery_percentage) : null,
          reading_timestamp: mappedData.reading_timestamp || new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('moisture_readings')
          .insert(readingData);

        if (insertError) {
          throw new Error(`Failed to insert reading: ${insertError.message}`);
        }

        await supabase
          .from('probe_api_endpoints')
          .update({
            last_poll_at: new Date().toISOString(),
            last_error: '',
          })
          .eq('id', endpoint.id);

        return new Response(
          JSON.stringify({ success: true, reading: readingData }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await supabase
          .from('probe_api_endpoints')
          .update({
            last_error: errorMessage,
          })
          .eq('id', endpoint.id);

        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const now = new Date();
    const { data: endpoints, error: listError } = await supabase
      .from('probe_api_endpoints')
      .select('*')
      .eq('active', true);

    if (listError) {
      throw new Error(listError.message);
    }

    const results = [];
    for (const endpoint of endpoints || []) {
      const lastPoll = endpoint.last_poll_at ? new Date(endpoint.last_poll_at) : null;
      const minutesSinceLastPoll = lastPoll
        ? (now.getTime() - lastPoll.getTime()) / 1000 / 60
        : Infinity;

      if (minutesSinceLastPoll >= endpoint.poll_interval_minutes) {
        try {
          const apiData = await fetchProbeData(endpoint);
          const mappedData = mapResponseToReading(apiData, endpoint.response_mapping);

          if (mappedData.probe_id) {
            const readingData = {
              probe_id: mappedData.probe_id,
              moisture_percentage: parseFloat(mappedData.moisture_percentage) || 0,
              temperature_c: mappedData.temperature_c ? parseFloat(mappedData.temperature_c) : null,
              battery_percentage: mappedData.battery_percentage ? parseFloat(mappedData.battery_percentage) : null,
              reading_timestamp: mappedData.reading_timestamp || new Date().toISOString(),
            };

            await supabase.from('moisture_readings').insert(readingData);

            await supabase
              .from('probe_api_endpoints')
              .update({
                last_poll_at: new Date().toISOString(),
                last_error: '',
              })
              .eq('id', endpoint.id);

            results.push({ endpoint_id: endpoint.id, status: 'success' });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          await supabase
            .from('probe_api_endpoints')
            .update({ last_error: errorMessage })
            .eq('id', endpoint.id);

          results.push({ endpoint_id: endpoint.id, status: 'error', error: errorMessage });
        }
      } else {
        results.push({ endpoint_id: endpoint.id, status: 'skipped', reason: 'Not due for polling' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
