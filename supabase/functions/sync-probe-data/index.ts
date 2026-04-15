import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PROBE_TIMEOUT_MS = 12000;
const OVERALL_TIMEOUT_MS = 25000;

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
  station_name: string | null;
  measured_at: string;
}

async function hmacSign(privateKey: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(privateKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchFieldClimateLatest(connection: ProbeConnection): Promise<NormalizedReading> {
  const { api_key: publicKey, api_secret: privateKey, station_id: stationId, sensor_mapping } = connection;

  const route = `/data/${stationId}/raw/last/1h`;
  const dateHeader = new Date().toUTCString();
  const stringToSign = `GET${route}${dateHeader}${publicKey}`;
  const hmacHex = await hmacSign(privateKey, stringToSign);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`https://api.fieldclimate.com${route}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `hmac ${publicKey}:${hmacHex}`,
        'Date': dateHeader,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 401) throw new Error('Authentication failed (401) — check HMAC keys');
    if (response.status === 404) throw new Error(`Station ${stationId} not found (404)`);
    if (response.status === 403) throw new Error('Access forbidden (403)');
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 120)}`);
  }

  const data = await response.json();

  const result: NormalizedReading = {
    moisture_percent: null,
    soil_temp_c: null,
    rainfall_mm: null,
    battery_level: null,
    air_temp_c: null,
    humidity_percent: null,
    moisture_depths: { depths: [] },
    soil_temp_depths: { depths: [] },
    station_name: data?.station?.name_custom || data?.station?.name || null,
    measured_at: new Date().toISOString(),
  };

  const dataRows: any[] = Array.isArray(data?.data) ? data.data : [];
  if (dataRows.length === 0) return result;

  const latest = dataRows[dataRows.length - 1];
  result.measured_at = latest.date || new Date().toISOString();

  const num = (v: any): number | null => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  if (sensor_mapping?.moisture) result.moisture_percent = num(latest[sensor_mapping.moisture]);
  if (sensor_mapping?.soil_temp) result.soil_temp_c = num(latest[sensor_mapping.soil_temp]);
  if (sensor_mapping?.rainfall) result.rainfall_mm = num(latest[sensor_mapping.rainfall]);
  if (sensor_mapping?.battery) result.battery_level = num(latest[sensor_mapping.battery]);
  if (sensor_mapping?.air_temp) result.air_temp_c = num(latest[sensor_mapping.air_temp]);
  if (sensor_mapping?.humidity) result.humidity_percent = num(latest[sensor_mapping.humidity]);

  const sensors: any[] = Array.isArray(data?.sensors) ? data.sensors : [];
  const serialKey = Object.keys(latest).find(k => k.includes('33809'));
  const serialNum = serialKey ? latest[serialKey] : null;

  if (serialNum) {
    sensors
      .filter((s: any) => s.code === 34944)
      .forEach((sensor: any, index: number) => {
        const v = num(latest[`${sensor.ch}_X_${serialNum}_34944_avg`]);
        if (v !== null) result.moisture_depths.depths.push({ depth_cm: (index + 1) * 10, value: v, channel: sensor.ch });
      });

    sensors
      .filter((s: any) => s.code === 34946)
      .forEach((sensor: any, index: number) => {
        const v = num(latest[`${sensor.ch}_X_${serialNum}_34946_avg`]);
        if (v !== null) result.soil_temp_depths.depths.push({ depth_cm: (index + 1) * 10, value: v, channel: sensor.ch });
      });
  }

  return result;
}

async function syncOneConnection(
  supabaseClient: any,
  connection: ProbeConnection
): Promise<{ connection_id: string; station_id: string; success: boolean; error?: string }> {
  try {
    const reading = await fetchFieldClimateLatest(connection);

    const { error: upsertError } = await supabaseClient
      .from('probe_readings_latest')
      .upsert({
        user_id: connection.user_id,
        connection_id: connection.id,
        provider: connection.provider,
        station_id: connection.station_id,
        device_id: connection.device_id,
        moisture_percent: reading.moisture_percent,
        soil_temp_c: reading.soil_temp_c,
        rainfall_mm: reading.rainfall_mm,
        battery_level: reading.battery_level,
        air_temp_c: reading.air_temp_c,
        humidity_percent: reading.humidity_percent,
        moisture_depths: reading.moisture_depths,
        soil_temp_depths: reading.soil_temp_depths,
        raw_payload: { station_name: reading.station_name },
        measured_at: reading.measured_at,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'user_id,connection_id' });

    await supabaseClient
      .from('probe_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: upsertError ? upsertError.message : null,
      })
      .eq('id', connection.id);

    if (upsertError) throw upsertError;

    return { connection_id: connection.id, station_id: connection.station_id, success: true };
  } catch (err: any) {
    const msg = err?.name === 'AbortError'
      ? 'Probe timed out — station may be offline'
      : (err?.message || 'Unknown error');

    await supabaseClient
      .from('probe_connections')
      .update({ last_error: msg })
      .eq('id', connection.id)
      .catch(() => {});

    return { connection_id: connection.id, station_id: connection.station_id, success: false, error: msg };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase configuration');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const connectionId = url.searchParams.get('connection_id');
    const syncAll = url.searchParams.get('sync_all') === 'true';

    let userId: string | null = null;

    if (!syncAll) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !userData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = userData.user.id;
    }

    let connectionsQuery = supabaseClient
      .from('probe_connections')
      .select('id, user_id, provider, api_key, api_secret, station_id, device_id, sensor_mapping')
      .eq('is_active', true);

    if (connectionId) {
      connectionsQuery = connectionsQuery.eq('id', connectionId);
      if (userId) connectionsQuery = connectionsQuery.eq('user_id', userId);
    } else if (userId) {
      connectionsQuery = connectionsQuery.eq('user_id', userId);
    }

    const { data: connections, error: fetchError } = await connectionsQuery;
    if (fetchError) throw fetchError;

    const allConnections: ProbeConnection[] = connections || [];

    if (allConnections.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], readings: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const overallTimer = new Promise<null>(resolve => setTimeout(() => resolve(null), OVERALL_TIMEOUT_MS));

    const syncPromises = Promise.all(
      allConnections.map(conn => syncOneConnection(supabaseClient, conn))
    );

    const raceResult = await Promise.race([syncPromises, overallTimer]);

    let results: any[];
    let timedOut = false;

    if (raceResult === null) {
      timedOut = true;
      results = allConnections.map(conn => ({
        connection_id: conn.id,
        station_id: conn.station_id,
        success: false,
        error: 'Overall sync timed out',
      }));
    } else {
      results = raceResult as any[];
    }

    const anySuccess = results.some(r => r.success);

    let readingsQuery = supabaseClient.from('probe_readings_latest').select('*');
    if (userId) readingsQuery = readingsQuery.eq('user_id', userId);
    const { data: readings } = await readingsQuery;

    return new Response(
      JSON.stringify({
        success: anySuccess || allConnections.length === 0,
        timed_out: timedOut,
        results,
        readings,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('sync-probe-data error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
