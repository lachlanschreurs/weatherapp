import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProbeReading {
  probe_name: string;
  timestamp: string;
  temperature?: number;
  moisture?: number;
  ph?: number;
  ec?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get all users with probe report access (free trial or active subscription)
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, probe_report_subscription_started_at, farmer_joe_subscription_status, farmer_joe_subscription_ends_at')
      .not('probe_report_subscription_started_at', 'is', null);

    if (subError) throw subError;

    // Filter to only include users who should receive emails
    const eligibleSubscribers = subscribers?.filter((profile: any) => {
      const now = new Date();
      const startedAt = new Date(profile.probe_report_subscription_started_at);
      const freeEndDate = new Date(startedAt);
      freeEndDate.setMonth(freeEndDate.getMonth() + 3);

      // In free 3-month trial period
      if (now < freeEndDate) {
        return true;
      }

      // Has active Farmer Joe subscription
      if (profile.farmer_joe_subscription_status === 'active') {
        const endsAt = profile.farmer_joe_subscription_ends_at ? new Date(profile.farmer_joe_subscription_ends_at) : null;
        if (!endsAt || endsAt > now) {
          return true;
        }
      }

      return false;
    }).map((profile: any) => ({
      user_id: profile.id,
      email: profile.email
    })) || [];

    if (eligibleSubscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No eligible subscribers found' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    let emailsSent = 0;

    // Get date range for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Send email to each eligible subscriber
    for (const subscriber of eligibleSubscribers) {
      try {
        // Get user's probe APIs
        const { data: probeApis, error: apiError } = await supabaseAdmin
          .from('probe_apis')
          .select('*')
          .eq('user_id', subscriber.user_id);

        if (apiError) {
          console.error(`Error fetching probe APIs for ${subscriber.email}:`, apiError);
          continue;
        }

        if (!probeApis || probeApis.length === 0) {
          console.log(`No probe APIs configured for ${subscriber.email}`);
          continue;
        }

        // Get probe data for the past week
        const { data: probeData, error: dataError } = await supabaseAdmin
          .from('probe_data')
          .select('*')
          .eq('user_id', subscriber.user_id)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order('timestamp', { ascending: false });

        if (dataError) {
          console.error(`Error fetching probe data for ${subscriber.email}:`, dataError);
          continue;
        }

        // Build report data
        const reportData = analyzeProbeData(probeData || [], probeApis);

        // Build email HTML
        const emailHtml = buildWeeklyProbeReportEmail(reportData);

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'FarmCast <onboarding@resend.dev>',
            to: subscriber.email,
            subject: 'Weekly Soil Health Report',
            html: emailHtml,
            text: buildWeeklyProbeReportEmailText(reportData),
          }),
        });

        if (emailResponse.ok) {
          emailsSent++;
        } else {
          const errorData = await emailResponse.text();
          console.error(`Failed to send email to ${subscriber.email}:`, errorData);
        }
      } catch (error) {
        console.error(`Error processing subscriber ${subscriber.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Successfully sent ${emailsSent} weekly reports`,
        total: eligibleSubscribers.length,
        sent: emailsSent
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-weekly-probe-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function analyzeProbeData(probeData: any[], probeApis: any[]) {
  const probeStats: any = {};

  // Group data by probe
  probeData.forEach(reading => {
    const probeName = reading.probe_name || 'Unknown Probe';

    if (!probeStats[probeName]) {
      probeStats[probeName] = {
        name: probeName,
        readings: 0,
        temperature: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
        moisture: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
        ph: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
        ec: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      };
    }

    const probe = probeStats[probeName];
    probe.readings++;

    // Update temperature stats
    if (reading.temperature !== null && reading.temperature !== undefined) {
      probe.temperature.min = Math.min(probe.temperature.min, reading.temperature);
      probe.temperature.max = Math.max(probe.temperature.max, reading.temperature);
      probe.temperature.sum += reading.temperature;
      probe.temperature.count++;
    }

    // Update moisture stats
    if (reading.moisture !== null && reading.moisture !== undefined) {
      probe.moisture.min = Math.min(probe.moisture.min, reading.moisture);
      probe.moisture.max = Math.max(probe.moisture.max, reading.moisture);
      probe.moisture.sum += reading.moisture;
      probe.moisture.count++;
    }

    // Update pH stats
    if (reading.ph !== null && reading.ph !== undefined) {
      probe.ph.min = Math.min(probe.ph.min, reading.ph);
      probe.ph.max = Math.max(probe.ph.max, reading.ph);
      probe.ph.sum += reading.ph;
      probe.ph.count++;
    }

    // Update EC stats
    if (reading.ec !== null && reading.ec !== undefined) {
      probe.ec.min = Math.min(probe.ec.min, reading.ec);
      probe.ec.max = Math.max(probe.ec.max, reading.ec);
      probe.ec.sum += reading.ec;
      probe.ec.count++;
    }
  });

  return {
    probeCount: probeApis.length,
    totalReadings: probeData.length,
    probeStats: Object.values(probeStats),
  };
}

function buildWeeklyProbeReportEmail(reportData: any): string {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const weekEnd = new Date();

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .summary-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .probe-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #059669; }
    .metric { display: inline-block; margin: 10px 15px 10px 0; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .metric-value { font-size: 20px; font-weight: bold; color: #059669; }
    .status-good { color: #059669; }
    .status-warning { color: #f59e0b; }
    .status-alert { color: #dc2626; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Weekly Soil Health Report</h1>
      <p style="margin: 0;">${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <div class="content">
      <div class="summary-box">
        <h2>Overview</h2>
        <p><strong>Active Probes:</strong> ${reportData.probeCount}</p>
        <p><strong>Total Readings This Week:</strong> ${reportData.totalReadings}</p>
        <p><strong>Average Readings Per Day:</strong> ${(reportData.totalReadings / 7).toFixed(1)}</p>
      </div>

      ${reportData.probeStats.length > 0 ? `
        <h2>Probe Details</h2>
        ${reportData.probeStats.map((probe: any) => `
          <div class="probe-card">
            <h3>${probe.name}</h3>
            <p style="color: #6b7280; font-size: 14px;">${probe.readings} readings this week</p>

            ${probe.temperature.count > 0 ? `
              <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px;">Temperature</h4>
                <div class="metric">
                  <div class="metric-label">Average</div>
                  <div class="metric-value">${(probe.temperature.sum / probe.temperature.count).toFixed(1)}°C</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Min</div>
                  <div class="metric-value">${probe.temperature.min.toFixed(1)}°C</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Max</div>
                  <div class="metric-value">${probe.temperature.max.toFixed(1)}°C</div>
                </div>
              </div>
            ` : ''}

            ${probe.moisture.count > 0 ? `
              <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px;">Soil Moisture</h4>
                <div class="metric">
                  <div class="metric-label">Average</div>
                  <div class="metric-value ${getMoistureStatus(probe.moisture.sum / probe.moisture.count)}">${(probe.moisture.sum / probe.moisture.count).toFixed(1)}%</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Min</div>
                  <div class="metric-value">${probe.moisture.min.toFixed(1)}%</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Max</div>
                  <div class="metric-value">${probe.moisture.max.toFixed(1)}%</div>
                </div>
                <p style="margin-top: 10px; font-size: 14px;">
                  ${getMoistureRecommendation(probe.moisture.sum / probe.moisture.count)}
                </p>
              </div>
            ` : ''}

            ${probe.ph.count > 0 ? `
              <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px;">pH Level</h4>
                <div class="metric">
                  <div class="metric-label">Average</div>
                  <div class="metric-value ${getPhStatus(probe.ph.sum / probe.ph.count)}">${(probe.ph.sum / probe.ph.count).toFixed(2)}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Min</div>
                  <div class="metric-value">${probe.ph.min.toFixed(2)}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Max</div>
                  <div class="metric-value">${probe.ph.max.toFixed(2)}</div>
                </div>
                <p style="margin-top: 10px; font-size: 14px;">
                  ${getPhRecommendation(probe.ph.sum / probe.ph.count)}
                </p>
              </div>
            ` : ''}

            ${probe.ec.count > 0 ? `
              <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px;">Electrical Conductivity</h4>
                <div class="metric">
                  <div class="metric-label">Average</div>
                  <div class="metric-value">${(probe.ec.sum / probe.ec.count).toFixed(2)} mS/cm</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Min</div>
                  <div class="metric-value">${probe.ec.min.toFixed(2)} mS/cm</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Max</div>
                  <div class="metric-value">${probe.ec.max.toFixed(2)} mS/cm</div>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      ` : `
        <div class="summary-box">
          <p style="text-align: center; color: #6b7280;">
            No probe data available for this week. Make sure your probe APIs are configured and actively sending data.
          </p>
        </div>
      `}

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
      <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 11px;">
        FarmCast Weather Services<br>
        Sent to subscribers of weekly probe reports
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function getMoistureStatus(moisture: number): string {
  if (moisture < 20) return 'status-alert';
  if (moisture > 80) return 'status-warning';
  return 'status-good';
}

function getMoistureRecommendation(moisture: number): string {
  if (moisture < 20) return 'Low moisture detected. Consider irrigation.';
  if (moisture > 80) return 'High moisture detected. Monitor drainage.';
  return 'Moisture levels are optimal.';
}

function getPhStatus(ph: number): string {
  if (ph < 5.5 || ph > 7.5) return 'status-alert';
  if (ph < 6.0 || ph > 7.0) return 'status-warning';
  return 'status-good';
}

function getPhRecommendation(ph: number): string {
  if (ph < 5.5) return 'Soil is too acidic. Consider lime application.';
  if (ph > 7.5) return 'Soil is too alkaline. Consider sulfur application.';
  if (ph < 6.0) return 'Slightly acidic. Monitor for sensitive crops.';
  if (ph > 7.0) return 'Slightly alkaline. Monitor for sensitive crops.';
  return 'pH levels are optimal for most crops.';
}

function buildWeeklyProbeReportEmailText(reportData: any): string {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date();

  let text = `
WEEKLY SOIL HEALTH REPORT
${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}

OVERVIEW:
- Active Probes: ${reportData.probeCount}
- Total Readings This Week: ${reportData.totalReadings}
- Average Readings Per Day: ${(reportData.totalReadings / 7).toFixed(1)}

`;

  if (reportData.probeStats.length > 0) {
    text += 'PROBE DETAILS:\n\n';

    reportData.probeStats.forEach((probe: any) => {
      text += `${probe.name}\n`;
      text += `${probe.readings} readings this week\n\n`;

      if (probe.temperature.count > 0) {
        text += `Temperature:\n`;
        text += `  Average: ${(probe.temperature.sum / probe.temperature.count).toFixed(1)}°C\n`;
        text += `  Min: ${probe.temperature.min.toFixed(1)}°C\n`;
        text += `  Max: ${probe.temperature.max.toFixed(1)}°C\n\n`;
      }

      if (probe.moisture.count > 0) {
        const avgMoisture = probe.moisture.sum / probe.moisture.count;
        text += `Soil Moisture:\n`;
        text += `  Average: ${avgMoisture.toFixed(1)}%\n`;
        text += `  Min: ${probe.moisture.min.toFixed(1)}%\n`;
        text += `  Max: ${probe.moisture.max.toFixed(1)}%\n`;
        text += `  ${getMoistureRecommendation(avgMoisture).replace(/⚠️|✅/g, '').trim()}\n\n`;
      }

      if (probe.ph.count > 0) {
        const avgPh = probe.ph.sum / probe.ph.count;
        text += `pH Level:\n`;
        text += `  Average: ${avgPh.toFixed(2)}\n`;
        text += `  Min: ${probe.ph.min.toFixed(2)}\n`;
        text += `  Max: ${probe.ph.max.toFixed(2)}\n`;
        text += `  ${getPhRecommendation(avgPh)}\n\n`;
      }

      if (probe.ec.count > 0) {
        text += `Electrical Conductivity:\n`;
        text += `  Average: ${(probe.ec.sum / probe.ec.count).toFixed(2)} mS/cm\n`;
        text += `  Min: ${probe.ec.min.toFixed(2)} mS/cm\n`;
        text += `  Max: ${probe.ec.max.toFixed(2)} mS/cm\n\n`;
      }

      text += '---\n\n';
    });
  } else {
    text += 'No probe data available for this week. Make sure your probe APIs are configured and actively sending data.\n\n';
  }

  text += `
Tip: Regular monitoring of soil conditions helps optimize irrigation, fertilization, and crop health.

Visit dashboard: https://farmcastweather.com
Manage preferences: https://farmcastweather.com/settings
Unsubscribe: https://farmcastweather.com/unsubscribe

FarmCast Weather Services
Sent to subscribers of weekly probe reports
  `.trim();

  return text;
}
