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
        // Fetch user's active probe connections joined with their latest readings
        const { data: readings, error: connError } = await supabaseAdmin
          .from('probe_readings_latest')
          .select(`
            moisture_percent,
            soil_temp_c,
            rainfall_mm,
            battery_level,
            air_temp_c,
            humidity_percent,
            moisture_depths,
            soil_temp_depths,
            measured_at,
            synced_at,
            connection_id,
            station_id,
            probe_connections!inner (
              station_id,
              friendly_name,
              provider,
              device_id,
              is_active
            )
          `)
          .eq('user_id', subscriber.user_id)
          .eq('probe_connections.is_active', true);

        if (connError) {
          console.error(`Error fetching readings for ${subscriber.email}:`, connError);
          continue;
        }

        if (!readings || readings.length === 0) {
          console.log(`No active probe readings for ${subscriber.email}`);
          continue;
        }

        // Normalize shape to match buildReportData expectations
        const connectionsWithData = readings.map((r: any) => ({
          id: r.connection_id,
          station_id: r.station_id,
          friendly_name: (r.probe_connections as any)?.friendly_name,
          provider: (r.probe_connections as any)?.provider,
          device_id: (r.probe_connections as any)?.device_id,
          probe_readings_latest: r,
        }));

        if (connectionsWithData.length === 0) {
          console.log(`No probe readings found for ${subscriber.email}`);
          continue;
        }

        const reportData = buildReportData(connectionsWithData);

        let aiInterpretation = '';
        try {
          aiInterpretation = await generateAIInterpretation(reportData);
        } catch (aiErr) {
          console.error(`AI interpretation failed for ${subscriber.email}:`, aiErr);
        }

        const emailHtml = buildWeeklyProbeReportEmail(reportData, aiInterpretation);
        const emailText = buildWeeklyProbeReportEmailText(reportData, aiInterpretation);

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

function buildReportData(connections: any[]) {
  const probeStats = connections.map((conn: any) => {
    const reading = conn.probe_readings_latest;
    const name = conn.friendly_name || conn.station_id || 'Unknown Station';

    const depthMoisture: Array<{ depth_cm: number; value: number }> =
      reading.moisture_depths?.depths ?? [];
    const depthTemp: Array<{ depth_cm: number; value: number }> =
      reading.soil_temp_depths?.depths ?? [];

    return {
      name,
      station_id: conn.station_id,
      provider: conn.provider,
      measured_at: reading.measured_at,
      moisture_percent: reading.moisture_percent != null ? parseFloat(reading.moisture_percent) : null,
      soil_temp_c: reading.soil_temp_c != null ? parseFloat(reading.soil_temp_c) : null,
      rainfall_mm: reading.rainfall_mm != null ? parseFloat(reading.rainfall_mm) : null,
      battery_level: reading.battery_level != null ? parseFloat(reading.battery_level) : null,
      air_temp_c: reading.air_temp_c != null ? parseFloat(reading.air_temp_c) : null,
      humidity_percent: reading.humidity_percent != null ? parseFloat(reading.humidity_percent) : null,
      depthMoisture,
      depthTemp,
    };
  });

  return {
    probeCount: connections.length,
    probeStats,
  };
}

async function generateAIInterpretation(reportData: any): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) return '';

  const summaryText = reportData.probeStats.map((probe: any) => {
    let text = `${probe.name} (Station ${probe.station_id}):\n`;
    if (probe.moisture_percent != null) text += `  Soil Moisture: ${probe.moisture_percent.toFixed(1)}%\n`;
    if (probe.soil_temp_c != null) text += `  Soil Temperature: ${probe.soil_temp_c.toFixed(1)}°C\n`;
    if (probe.rainfall_mm != null) text += `  Rainfall: ${probe.rainfall_mm.toFixed(1)}mm\n`;
    if (probe.depthMoisture.length > 0) {
      probe.depthMoisture.forEach((d: any) => {
        text += `  Moisture at ${d.depth_cm}cm: ${d.value.toFixed(1)}%\n`;
      });
    }
    return text;
  }).join('\n');

  const prompt = `You are Farmer Joe, an experienced agricultural advisor. Analyze this week's soil probe data and provide a concise, actionable interpretation in 3-4 sentences. Focus on overall soil health, any concerning patterns, and specific recommendations.\n\nData:\n${summaryText}\n\nProvide a friendly, professional analysis.`;

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
          { role: 'system', content: 'You are Farmer Joe, an experienced agricultural advisor who provides concise, actionable advice to farmers based on soil probe data.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch {
    return '';
  }
}

function getMoistureStatus(m: number): string {
  if (m < 20) return 'status-alert';
  if (m > 80) return 'status-warning';
  return 'status-good';
}

function getMoistureRecommendation(m: number): string {
  if (m < 30) return 'Very Dry - Irrigation Recommended';
  if (m < 40) return 'Dry - Monitor Closely';
  if (m < 60) return 'Optimal Moisture Range';
  if (m < 70) return 'Moist - Good Conditions';
  return 'Very Wet - Check Drainage';
}

function getMoistureColor(m: number): string {
  if (m < 30) return '#D32F2F';
  if (m < 40) return '#F57C00';
  if (m < 60) return '#388E3C';
  if (m < 70) return '#1976D2';
  return '#0277BD';
}

function buildWeeklyProbeReportEmail(reportData: any, aiInterpretation: string): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const dateLabel = `${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const probeCardsHtml = reportData.probeStats.map((probe: any) => {
    const measuredDate = probe.measured_at
      ? new Date(probe.measured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Unknown';

    let depthRows = '';
    if (probe.depthMoisture.length > 0) {
      depthRows = `
        <div style="margin-top: 15px;">
          <h4 style="margin-bottom: 10px; color: #374151;">Moisture by Depth</h4>
          <table style="width:100%; border-collapse: collapse;">
            ${probe.depthMoisture.map((d: any) => `
              <tr>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${d.depth_cm}cm depth</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #2563eb;">${d.value.toFixed(1)}%</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6;">
                  <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100%; max-width: 120px;">
                    <div style="background: #2563eb; border-radius: 4px; height: 8px; width: ${Math.min(d.value, 100)}%;"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    let depthTempRows = '';
    if (probe.depthTemp.length > 0) {
      depthTempRows = `
        <div style="margin-top: 15px;">
          <h4 style="margin-bottom: 10px; color: #374151;">Temperature by Depth</h4>
          <table style="width:100%; border-collapse: collapse;">
            ${probe.depthTemp.map((d: any) => `
              <tr>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${d.depth_cm}cm depth</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #059669;">${d.value.toFixed(1)}°C</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    return `
      <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #059669;">
        <h3 style="margin: 0 0 5px 0; color: #111827;">${probe.name}</h3>
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 15px 0;">Station ID: ${probe.station_id} &nbsp;|&nbsp; Last reading: ${measuredDate}</p>

        ${probe.moisture_percent != null ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 8px 0; color: #374151;">Soil Moisture</h4>
            <div style="font-size: 28px; font-weight: bold; color: ${getMoistureColor(probe.moisture_percent)};">${probe.moisture_percent.toFixed(1)}%</div>
            <div style="margin-top: 8px; padding: 10px 14px; background: ${getMoistureColor(probe.moisture_percent)}; border-radius: 6px; color: white; font-weight: bold; display: inline-block; font-size: 14px;">
              ${getMoistureRecommendation(probe.moisture_percent)}
            </div>
          </div>
        ` : ''}

        ${probe.soil_temp_c != null ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 8px 0; color: #374151;">Soil Temperature</h4>
            <div style="font-size: 28px; font-weight: bold; color: #059669;">${probe.soil_temp_c.toFixed(1)}°C</div>
          </div>
        ` : ''}

        ${probe.rainfall_mm != null ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 8px 0; color: #374151;">Rainfall</h4>
            <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${probe.rainfall_mm.toFixed(1)} mm</div>
          </div>
        ` : ''}

        ${depthRows}
        ${depthTempRows}

        ${probe.battery_level != null ? `
          <p style="margin: 15px 0 0 0; font-size: 13px; color: #9ca3af;">Battery: ${probe.battery_level.toFixed(0)}%</p>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .ai-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Weekly Soil Health Report</h1>
      <p style="margin: 0; opacity: 0.9;">${dateLabel}</p>
    </div>

    <div class="content">
      <div style="background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 10px 0;">Overview</h2>
        <p style="margin: 0;"><strong>Active Probes:</strong> ${reportData.probeCount}</p>
      </div>

      <h2 style="color: #111827;">Probe Details</h2>
      ${probeCardsHtml}

      ${aiInterpretation ? `
        <div class="ai-box">
          <h2 style="margin-top: 0; color: #1e40af; font-size: 18px;">Farmer Joe's Weekly Analysis</h2>
          <p style="margin-bottom: 0; font-size: 15px; line-height: 1.7;">${aiInterpretation}</p>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; font-size: 14px;">
        <strong>Tip:</strong> Regular monitoring of soil conditions helps optimize irrigation, fertilization, and crop health.
        Check your FarmCast dashboard for real-time updates.
      </div>
    </div>

    <div class="footer">
      <p><strong>FarmCast Weather</strong></p>
      <p style="margin: 10px 0;">You're receiving weekly soil health reports as part of your subscription.</p>
      <p style="margin: 10px 0;">
        <a href="https://farmcastweather.com/settings" style="color: #60a5fa;">Manage Preferences</a> |
        <a href="https://farmcastweather.com/unsubscribe" style="color: #60a5fa;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildWeeklyProbeReportEmailText(reportData: any, aiInterpretation: string): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  let text = `WEEKLY SOIL HEALTH REPORT\n`;
  text += `${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

  if (aiInterpretation) {
    text += `FARMER JOE'S WEEKLY ANALYSIS:\n${aiInterpretation}\n\n`;
  }

  text += `OVERVIEW:\n- Active Probes: ${reportData.probeCount}\n\n`;
  text += `PROBE DETAILS:\n\n`;

  reportData.probeStats.forEach((probe: any) => {
    text += `${probe.name} (Station ${probe.station_id})\n`;
    if (probe.measured_at) {
      text += `Last reading: ${new Date(probe.measured_at).toLocaleDateString('en-AU')}\n`;
    }
    if (probe.moisture_percent != null) {
      text += `Soil Moisture: ${probe.moisture_percent.toFixed(1)}% - ${getMoistureRecommendation(probe.moisture_percent)}\n`;
    }
    if (probe.soil_temp_c != null) {
      text += `Soil Temperature: ${probe.soil_temp_c.toFixed(1)}°C\n`;
    }
    if (probe.rainfall_mm != null) {
      text += `Rainfall: ${probe.rainfall_mm.toFixed(1)}mm\n`;
    }
    if (probe.depthMoisture.length > 0) {
      text += `Moisture by depth:\n`;
      probe.depthMoisture.forEach((d: any) => {
        text += `  ${d.depth_cm}cm: ${d.value.toFixed(1)}%\n`;
      });
    }
    text += `---\n\n`;
  });

  text += `Visit dashboard: https://farmcastweather.com\nManage preferences: https://farmcastweather.com/settings\n`;
  return text;
}
