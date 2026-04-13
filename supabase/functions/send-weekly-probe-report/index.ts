import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, probe_report_subscription_started_at, farmer_joe_subscription_status, trial_end_date')
      .not('probe_report_subscription_started_at', 'is', null);

    if (subError) throw subError;

    const eligibleSubscribers = (subscribers ?? []).filter((profile: any) => {
      const now = new Date();
      const startedAt = new Date(profile.probe_report_subscription_started_at);
      const freeEndDate = new Date(startedAt);
      freeEndDate.setMonth(freeEndDate.getMonth() + 3);
      if (now < freeEndDate) return true;
      if (profile.farmer_joe_subscription_status === 'active') return true;
      return false;
    }).map((profile: any) => ({ user_id: profile.id, email: profile.email }));

    if (eligibleSubscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No eligible subscribers found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    let emailsSent = 0;

    for (const subscriber of eligibleSubscribers) {
      try {
        const { data: connections, error: connError } = await supabaseAdmin
          .from('probe_connections')
          .select('id, station_id, friendly_name, provider, api_key, api_secret, sensor_mapping, device_id')
          .eq('user_id', subscriber.user_id)
          .eq('is_active', true);

        if (connError) {
          console.error(`Error fetching connections for ${subscriber.email}:`, connError);
          continue;
        }

        if (!connections || connections.length === 0) {
          console.log(`No active probe connections for ${subscriber.email}`);
          continue;
        }

        const { data: latestReadings } = await supabaseAdmin
          .from('probe_readings_latest')
          .select('*')
          .eq('user_id', subscriber.user_id);

        const latestByConnection: Record<string, any> = {};
        for (const r of (latestReadings ?? [])) {
          latestByConnection[r.connection_id] = r;
        }

        const probeHistories: ProbeHistory[] = [];

        for (const conn of connections) {
          const latest = latestByConnection[conn.id];
          let dailyData: DailyData[] = [];

          const provider = (conn.provider ?? '').toLowerCase();
          if (provider === 'fieldclimate' && conn.api_key && conn.api_secret && conn.station_id) {
            try {
              dailyData = await fetchFieldClimateDailyHistory(
                conn.api_key,
                conn.api_secret,
                conn.station_id,
                conn.sensor_mapping,
              );
            } catch (err) {
              console.error(`Failed to fetch history for ${conn.friendly_name}:`, err);
            }
          }

          probeHistories.push({
            id: conn.id,
            name: conn.friendly_name || conn.station_id || 'Unknown Station',
            station_id: conn.station_id,
            provider: conn.provider,
            latest,
            dailyData,
          });
        }

        if (probeHistories.length === 0) {
          console.log(`No probe data for ${subscriber.email}`);
          continue;
        }

        let aiInterpretation = '';
        try {
          aiInterpretation = await generateAIInterpretation(probeHistories);
        } catch (aiErr) {
          console.error(`AI interpretation failed for ${subscriber.email}:`, aiErr);
        }

        const emailHtml = buildWeeklyEmail(probeHistories, aiInterpretation);
        const emailText = buildWeeklyEmailText(probeHistories, aiInterpretation);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'FarmCast <support@mail.farmcastweather.com>',
            to: subscriber.email,
            subject: 'Weekly Soil Health Report',
            html: emailHtml,
            text: emailText,
          }),
        });

        if (emailResponse.ok) {
          emailsSent++;
          console.log(`Sent weekly report to ${subscriber.email}`);
        } else {
          const errText = await emailResponse.text();
          console.error(`Failed to send to ${subscriber.email}:`, errText);
        }
      } catch (err) {
        console.error(`Error processing ${subscriber.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully sent ${emailsSent} weekly reports`, total: eligibleSubscribers.length, sent: emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-weekly-probe-report:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface DailyData {
  date: string;
  label: string;
  moisture_avg: number | null;
  soil_temp_avg: number | null;
  rainfall_total: number | null;
}

interface ProbeHistory {
  id: string;
  name: string;
  station_id: string;
  provider: string;
  latest: any;
  dailyData: DailyData[];
}

async function fetchFieldClimateDailyHistory(
  apiKey: string,
  apiSecret: string,
  stationId: string,
  sensorMapping: any,
): Promise<DailyData[]> {
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 24 * 3600;

  const path = `/data/${stationId}/raw/from/${sevenDaysAgo}/to/${now}`;
  const method = 'GET';
  const date = new Date().toUTCString();

  const msgToSign = method + path + date + apiKey;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msgToSign));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  const response = await fetch(`https://api.fieldclimate.com${path}`, {
    headers: {
      'Authorization': `hmac ${apiKey}:${sigHex}`,
      'Date': date,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`FieldClimate API error: ${response.status}`);
  }

  const payload = await response.json();
  const rawData: any[] = payload.data ?? [];

  const moistureKey = sensorMapping?.moisture ?? null;
  const soilTempKey = sensorMapping?.soil_temp ?? null;
  const rainfallKey = sensorMapping?.rainfall ?? null;

  const byDay: Record<string, { moisture: number[]; soilTemp: number[]; rainfall: number[] }> = {};

  for (const row of rawData) {
    const dateStr = row.date?.substring(0, 10);
    if (!dateStr) continue;
    if (!byDay[dateStr]) byDay[dateStr] = { moisture: [], soilTemp: [], rainfall: [] };

    if (moistureKey && row[moistureKey] != null) {
      const v = parseFloat(row[moistureKey]);
      if (!isNaN(v)) byDay[dateStr].moisture.push(v);
    }
    if (soilTempKey && row[soilTempKey] != null) {
      const v = parseFloat(row[soilTempKey]);
      if (!isNaN(v)) byDay[dateStr].soilTemp.push(v);
    }
    if (rainfallKey && row[rainfallKey] != null) {
      const v = parseFloat(row[rainfallKey]);
      if (!isNaN(v)) byDay[dateStr].rainfall.push(v);
    }
  }

  const days: DailyData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const label = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    const bucket = byDay[dateStr];
    days.push({
      date: dateStr,
      label,
      moisture_avg: bucket && bucket.moisture.length > 0 ? avg(bucket.moisture) : null,
      soil_temp_avg: bucket && bucket.soilTemp.length > 0 ? avg(bucket.soilTemp) : null,
      rainfall_total: bucket && bucket.rainfall.length > 0 ? sum(bucket.rainfall) : null,
    });
  }

  return days;
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

async function generateAIInterpretation(probeHistories: ProbeHistory[]): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) return '';

  const summaryText = probeHistories.map((probe) => {
    let text = `${probe.name} (Station ${probe.station_id}):\n`;
    if (probe.dailyData.length > 0) {
      text += `  7-day daily averages:\n`;
      for (const d of probe.dailyData) {
        text += `    ${d.label}: moisture=${d.moisture_avg != null ? d.moisture_avg.toFixed(1) + '%' : 'N/A'}, soil temp=${d.soil_temp_avg != null ? d.soil_temp_avg.toFixed(1) + '°C' : 'N/A'}, rainfall=${d.rainfall_total != null ? d.rainfall_total.toFixed(1) + 'mm' : 'N/A'}\n`;
      }
    } else if (probe.latest) {
      if (probe.latest.moisture_percent != null) text += `  Soil Moisture: ${parseFloat(probe.latest.moisture_percent).toFixed(1)}%\n`;
      if (probe.latest.soil_temp_c != null) text += `  Soil Temperature: ${parseFloat(probe.latest.soil_temp_c).toFixed(1)}°C\n`;
    }
    return text;
  }).join('\n');

  const prompt = `You are Farmer Joe, an experienced agricultural advisor. Analyze this week's soil probe data trends and provide a concise, actionable interpretation in 3-5 sentences. Focus on moisture trends, temperature changes, rainfall impacts, and specific recommendations for the coming week.\n\nData:\n${summaryText}\n\nProvide a friendly, professional analysis focused on what the trends mean for the farmer.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Farmer Joe, an experienced agricultural advisor who provides concise, actionable advice to farmers based on soil probe data trends.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch {
    return '';
  }
}

function getMoistureColor(m: number): string {
  if (m < 30) return '#D32F2F';
  if (m < 40) return '#F57C00';
  if (m < 60) return '#2E7D32';
  if (m < 70) return '#1565C0';
  return '#0277BD';
}

function getMoistureRecommendation(m: number): string {
  if (m < 30) return 'Very Dry - Irrigation Recommended';
  if (m < 40) return 'Dry - Monitor Closely';
  if (m < 60) return 'Optimal Moisture Range';
  if (m < 70) return 'Moist - Good Conditions';
  return 'Very Wet - Check Drainage';
}

function buildBarChart(
  days: DailyData[],
  getValue: (d: DailyData) => number | null,
  color: string,
  unit: string,
  maxValue?: number,
): string {
  const values = days.map(d => getValue(d) ?? 0);
  const maxVal = maxValue ?? Math.max(...values.filter(v => v > 0), 1);

  const bars = days.map((d, i) => {
    const val = getValue(d);
    const barHeight = val != null ? Math.round((val / maxVal) * 80) : 0;
    const label = d.label.split(' ').slice(0, 2).join(' ');
    const displayVal = val != null ? val.toFixed(1) : '-';
    const isToday = i === days.length - 1;

    return `
      <td style="text-align:center; vertical-align:bottom; padding: 0 3px; width:${Math.floor(100/7)}%;">
        <div style="font-size:10px; color:#374151; margin-bottom:3px; font-weight:${isToday ? '700' : '400'};">${displayVal}${val != null ? unit : ''}</div>
        <div style="background:#e5e7eb; border-radius:4px 4px 0 0; height:80px; display:flex; align-items:flex-end; justify-content:center;">
          <div style="background:${isToday ? color : color + 'cc'}; border-radius:4px 4px 0 0; width:100%; height:${barHeight}px; min-height:${val != null && val > 0 ? 2 : 0}px; transition:height 0.3s;"></div>
        </div>
        <div style="font-size:9px; color:#6b7280; margin-top:4px; line-height:1.2;">${label}</div>
      </td>`;
  }).join('');

  return `
    <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #d1d5db;">
      <tr style="vertical-align:bottom;">${bars}</tr>
    </table>`;
}

function buildProbeSection(probe: ProbeHistory): string {
  const latest = probe.latest;
  const moisture = latest?.moisture_percent != null ? parseFloat(latest.moisture_percent) : null;
  const soilTemp = latest?.soil_temp_c != null ? parseFloat(latest.soil_temp_c) : null;
  const rainfall = latest?.rainfall_mm != null ? parseFloat(latest.rainfall_mm) : null;

  const measuredDate = latest?.measured_at
    ? new Date(latest.measured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Unknown';

  const hasDailyData = probe.dailyData.length > 0 && probe.dailyData.some(d => d.moisture_avg != null || d.soil_temp_avg != null);

  let weeklyChange = '';
  if (hasDailyData) {
    const firstMoisture = probe.dailyData.find(d => d.moisture_avg != null)?.moisture_avg;
    const lastMoisture = [...probe.dailyData].reverse().find(d => d.moisture_avg != null)?.moisture_avg;
    if (firstMoisture != null && lastMoisture != null) {
      const diff = lastMoisture - firstMoisture;
      const arrow = diff > 0 ? '&#9650;' : diff < 0 ? '&#9660;' : '&#9654;';
      const diffColor = diff > 0 ? '#1565C0' : diff < 0 ? '#D32F2F' : '#6b7280';
      weeklyChange = `<span style="color:${diffColor}; font-size:13px; margin-left:10px;">${arrow} ${Math.abs(diff).toFixed(1)}% over 7 days</span>`;
    }
  }

  const totalRainfall7d = probe.dailyData.reduce((acc, d) => acc + (d.rainfall_total ?? 0), 0);

  let chartsHtml = '';
  if (hasDailyData) {
    const moistureChart = probe.dailyData.some(d => d.moisture_avg != null)
      ? `<div style="margin-bottom:20px;">
          <h4 style="margin:0 0 8px 0; color:#374151; font-size:13px; text-transform:uppercase; letter-spacing:0.05em;">Soil Moisture % - Daily Average</h4>
          ${buildBarChart(probe.dailyData, d => d.moisture_avg, '#1565C0', '%', 100)}
        </div>`
      : '';

    const tempChart = probe.dailyData.some(d => d.soil_temp_avg != null)
      ? `<div style="margin-bottom:20px;">
          <h4 style="margin:0 0 8px 0; color:#374151; font-size:13px; text-transform:uppercase; letter-spacing:0.05em;">Soil Temperature &#176;C - Daily Average</h4>
          ${buildBarChart(probe.dailyData, d => d.soil_temp_avg, '#059669', '&#176;C')}
        </div>`
      : '';

    const rainfallChart = probe.dailyData.some(d => d.rainfall_total != null && d.rainfall_total > 0)
      ? `<div style="margin-bottom:20px;">
          <h4 style="margin:0 0 8px 0; color:#374151; font-size:13px; text-transform:uppercase; letter-spacing:0.05em;">Rainfall mm - Daily Total</h4>
          ${buildBarChart(probe.dailyData, d => d.rainfall_total, '#0284c7', 'mm')}
        </div>`
      : '';

    chartsHtml = `
      <div style="margin-top:20px; padding:16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
        <h4 style="margin:0 0 16px 0; color:#111827; font-size:14px;">7-Day Trend Charts <span style="font-weight:400; color:#6b7280; font-size:12px;">(darkest bar = today)</span></h4>
        ${moistureChart}
        ${tempChart}
        ${rainfallChart}
      </div>`;
  }

  let depthRows = '';
  const depthMoisture: Array<{ depth_cm: number; value: number }> = latest?.moisture_depths?.depths ?? [];
  if (depthMoisture.length > 0) {
    depthRows = `
      <div style="margin-top:16px;">
        <h4 style="margin-bottom:8px; color:#374151; font-size:13px; text-transform:uppercase; letter-spacing:0.05em;">Current Moisture by Depth</h4>
        <table style="width:100%; border-collapse:collapse;">
          ${depthMoisture.map((d: any) => `
            <tr>
              <td style="padding:6px 10px; border-bottom:1px solid #f3f4f6; color:#6b7280; font-size:13px;">${d.depth_cm}cm</td>
              <td style="padding:6px 10px; border-bottom:1px solid #f3f4f6; font-weight:bold; color:#1565C0; font-size:13px;">${d.value.toFixed(1)}%</td>
              <td style="padding:6px 10px; border-bottom:1px solid #f3f4f6; width:40%;">
                <div style="background:#e5e7eb; border-radius:4px; height:8px;">
                  <div style="background:#1565C0; border-radius:4px; height:8px; width:${Math.min(d.value, 100)}%;"></div>
                </div>
              </td>
            </tr>`).join('')}
        </table>
      </div>`;
  }

  return `
    <div style="background:white; padding:20px; margin:15px 0; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:4px solid #059669;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 4px 0; color:#111827; font-size:18px;">${probe.name}</h3>
          <p style="color:#6b7280; font-size:12px; margin:0;">Station: ${probe.station_id} &nbsp;|&nbsp; Last reading: ${measuredDate}</p>
        </div>
      </div>

      <div style="display:flex; gap:16px; margin-top:16px; flex-wrap:wrap;">
        ${moisture != null ? `
        <div style="flex:1; min-width:120px; background:#eff6ff; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Current Moisture</div>
          <div style="font-size:26px; font-weight:700; color:${getMoistureColor(moisture)};">${moisture.toFixed(1)}%</div>
          <div style="font-size:11px; color:${getMoistureColor(moisture)}; font-weight:600; margin-top:4px;">${getMoistureRecommendation(moisture)}</div>
          ${weeklyChange ? `<div style="margin-top:6px; font-size:11px;">${weeklyChange}</div>` : ''}
        </div>` : ''}

        ${soilTemp != null ? `
        <div style="flex:1; min-width:120px; background:#f0fdf4; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Current Soil Temp</div>
          <div style="font-size:26px; font-weight:700; color:#059669;">${soilTemp.toFixed(1)}&#176;C</div>
        </div>` : ''}

        ${totalRainfall7d > 0 ? `
        <div style="flex:1; min-width:120px; background:#f0f9ff; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">7-Day Rainfall</div>
          <div style="font-size:26px; font-weight:700; color:#0284c7;">${totalRainfall7d.toFixed(1)}mm</div>
        </div>` : rainfall != null ? `
        <div style="flex:1; min-width:120px; background:#f0f9ff; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Latest Rainfall</div>
          <div style="font-size:26px; font-weight:700; color:#0284c7;">${rainfall.toFixed(1)}mm</div>
        </div>` : ''}
      </div>

      ${chartsHtml}
      ${depthRows}

      ${latest?.battery_level != null ? `
      <p style="margin:12px 0 0 0; font-size:12px; color:#9ca3af;">Battery: ${parseFloat(latest.battery_level).toFixed(0)} mV</p>
      ` : ''}
    </div>`;
}

function buildWeeklyEmail(probeHistories: ProbeHistory[], aiInterpretation: string): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const dateLabel = `${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const probeSections = probeHistories.map(buildProbeSection).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height:1.6; color:#333; margin:0; padding:0; background:#f3f4f6; }
  .container { max-width:620px; margin:20px auto; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
</style>
</head>
<body>
<div class="container">
  <div style="background:linear-gradient(135deg,#166534 0%,#14532d 100%); color:white; padding:32px 30px; text-align:center;">
    <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.1em; opacity:0.8; margin-bottom:6px;">FarmCast</div>
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:700;">Weekly Soil Health Report</h1>
    <p style="margin:0; opacity:0.85; font-size:14px;">${dateLabel}</p>
  </div>

  <div style="background:#f9fafb; padding:24px 20px;">

    <div style="background:white; padding:16px 20px; margin-bottom:16px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.07);">
      <span style="font-size:14px; color:#374151;"><strong>Active Probes:</strong> ${probeHistories.length}</span>
    </div>

    ${probeSections}

    ${aiInterpretation ? `
    <div style="background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%); padding:20px; margin:16px 0; border-radius:10px; border-left:4px solid #2563eb;">
      <h2 style="margin-top:0; color:#1e40af; font-size:17px;">Farmer Joe's Weekly Analysis</h2>
      <p style="margin-bottom:0; font-size:14px; line-height:1.75; color:#1e3a8a;">${aiInterpretation}</p>
    </div>
    ` : ''}

    <div style="margin-top:20px; padding:14px 16px; background:#ecfdf5; border-radius:8px; font-size:13px; color:#065f46; border:1px solid #a7f3d0;">
      <strong>Tip:</strong> Regular monitoring of soil conditions helps optimise irrigation, fertilisation, and crop health. Check your FarmCast dashboard for real-time updates.
    </div>
  </div>

  <div style="background:#1f2937; color:#9ca3af; padding:20px; text-align:center; font-size:12px;">
    <p style="margin:0 0 8px 0; font-weight:600; color:#d1d5db;">FarmCast Weather</p>
    <p style="margin:0 0 8px 0;">You're receiving weekly soil health reports as part of your subscription.</p>
    <p style="margin:0;">
      <a href="https://farmcastweather.com/settings" style="color:#60a5fa;">Manage Preferences</a> &nbsp;|&nbsp;
      <a href="https://farmcastweather.com/unsubscribe" style="color:#60a5fa;">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`.trim();
}

function buildWeeklyEmailText(probeHistories: ProbeHistory[], aiInterpretation: string): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  let text = `WEEKLY SOIL HEALTH REPORT\n`;
  text += `${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

  if (aiInterpretation) {
    text += `FARMER JOE'S WEEKLY ANALYSIS:\n${aiInterpretation}\n\n`;
  }

  text += `ACTIVE PROBES: ${probeHistories.length}\n\n`;

  for (const probe of probeHistories) {
    text += `${probe.name} (Station ${probe.station_id})\n`;
    text += `${'='.repeat(40)}\n`;

    if (probe.latest) {
      const m = probe.latest.moisture_percent != null ? parseFloat(probe.latest.moisture_percent) : null;
      const t = probe.latest.soil_temp_c != null ? parseFloat(probe.latest.soil_temp_c) : null;
      const r = probe.latest.rainfall_mm != null ? parseFloat(probe.latest.rainfall_mm) : null;
      if (m != null) text += `Current Moisture: ${m.toFixed(1)}% (${getMoistureRecommendation(m)})\n`;
      if (t != null) text += `Current Soil Temp: ${t.toFixed(1)}C\n`;
      if (r != null) text += `Latest Rainfall: ${r.toFixed(1)}mm\n`;
    }

    if (probe.dailyData.length > 0) {
      text += `\n7-Day Daily Summary:\n`;
      for (const d of probe.dailyData) {
        text += `  ${d.label}: `;
        const parts: string[] = [];
        if (d.moisture_avg != null) parts.push(`moisture ${d.moisture_avg.toFixed(1)}%`);
        if (d.soil_temp_avg != null) parts.push(`soil temp ${d.soil_temp_avg.toFixed(1)}C`);
        if (d.rainfall_total != null && d.rainfall_total > 0) parts.push(`rain ${d.rainfall_total.toFixed(1)}mm`);
        text += parts.join(', ') || 'No data';
        text += '\n';
      }
    }
    text += '\n';
  }

  text += `Visit dashboard: https://farmcastweather.com\nManage preferences: https://farmcastweather.com/settings\n`;
  return text;
}
