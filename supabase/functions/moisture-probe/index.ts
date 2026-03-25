import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProbeReading {
  probe_id: string;
  moisture_percentage: number;
  temperature_c?: number;
  battery_percentage?: number;
  reading_timestamp?: string;
}

interface RegisterProbeRequest {
  user_id: string;
  name: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  depth_cm: number;
  soil_type?: string;
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
    const path = url.pathname.split('/moisture-probe')[1] || '/';

    if (path === '/reading' && req.method === 'POST') {
      const reading: ProbeReading = await req.json();

      if (!reading.probe_id || reading.moisture_percentage === undefined) {
        return new Response(
          JSON.stringify({ error: 'probe_id and moisture_percentage are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: probe, error: probeError } = await supabase
        .from('moisture_probes')
        .select('id, active')
        .eq('id', reading.probe_id)
        .maybeSingle();

      if (probeError || !probe) {
        return new Response(
          JSON.stringify({ error: 'Probe not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!probe.active) {
        return new Response(
          JSON.stringify({ error: 'Probe is inactive' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('moisture_readings')
        .insert({
          probe_id: reading.probe_id,
          moisture_percentage: reading.moisture_percentage,
          temperature_c: reading.temperature_c,
          battery_percentage: reading.battery_percentage,
          reading_timestamp: reading.reading_timestamp || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path === '/register' && req.method === 'POST') {
      const probeData: RegisterProbeRequest = await req.json();

      if (!probeData.user_id || !probeData.name || !probeData.location_name || !probeData.depth_cm) {
        return new Response(
          JSON.stringify({ error: 'user_id, name, location_name, and depth_cm are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('moisture_probes')
        .insert({
          user_id: probeData.user_id,
          name: probeData.name,
          location_name: probeData.location_name,
          latitude: probeData.latitude,
          longitude: probeData.longitude,
          depth_cm: probeData.depth_cm,
          soil_type: probeData.soil_type || '',
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
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
