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
      .select('id, email, probe_report_subscription_started_at, farmer_joe_subscription_status, trial_end_date')
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
        return true;
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
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString())
          .order('recorded_at', { ascending: false });

        if (dataError) {
          console.error(`Error fetching probe data for ${subscriber.email}:`, dataError);
          continue;
        }

        // Build report data
        const reportData = analyzeProbeData(probeData || [], probeApis);

        // Get AI interpretation of the week's data
        let aiInterpretation = '';
        if (probeData && probeData.length > 0) {
          try {
            aiInterpretation = await generateAIInterpretation(reportData, probeData);
          } catch (aiError) {
            console.error(`Failed to generate AI interpretation for ${subscriber.email}:`, aiError);
          }
        }

        // Build email HTML
        const emailHtml = buildWeeklyProbeReportEmail(reportData, aiInterpretation);

        // Send email via Resend
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
            text: buildWeeklyProbeReportEmailText(reportData, aiInterpretation),
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

async function generateAIInterpretation(reportData: any, rawProbeData: any[]): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not configured, skipping AI interpretation');
    return '';
  }

  const summaryText = reportData.probeStats.map((probe: any) => {
    let text = `${probe.name}: ${probe.readings} readings\n`;

    if (probe.temperature.count > 0) {
      const avg = (probe.temperature.sum / probe.temperature.count).toFixed(1);
      text += `  Temperature: ${probe.temperature.min.toFixed(1)}°C - ${probe.temperature.max.toFixed(1)}°C (avg: ${avg}°C)\n`;
    }

    if (probe.moisture.count > 0) {
      const avg = (probe.moisture.sum / probe.moisture.count).toFixed(1);
      text += `  Moisture: ${probe.moisture.min.toFixed(1)}% - ${probe.moisture.max.toFixed(1)}% (avg: ${avg}%)\n`;
    }

    if (probe.ph.count > 0) {
      const avg = (probe.ph.sum / probe.ph.count).toFixed(2);
      text += `  pH: ${probe.ph.min.toFixed(2)} - ${probe.ph.max.toFixed(2)} (avg: ${avg})\n`;
    }

    if (probe.ec.count > 0) {
      const avg = (probe.ec.sum / probe.ec.count).toFixed(2);
      text += `  EC: ${probe.ec.min.toFixed(2)} - ${probe.ec.max.toFixed(2)} mS/cm (avg: ${avg} mS/cm)\n`;
    }

    return text;
  }).join('\n');

  const prompt = `You are Farmer Joe, an experienced agricultural advisor. Analyze this week's soil probe data and provide a concise, actionable interpretation in 3-4 sentences. Focus on:
1. Overall soil health trends
2. Any concerning patterns or changes
3. Specific recommendations for the farmer

Data Summary:
${summaryText}

Provide a friendly, professional analysis that helps the farmer understand what happened this week and what actions to take.`;

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
          {
            role: 'system',
            content: 'You are Farmer Joe, an experienced agricultural advisor who provides concise, actionable advice to farmers based on soil probe data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return '';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating AI interpretation:', error);
    return '';
  }
}

function analyzeProbeData(probeData: any[], probeApis: any[]) {
  const probeStats: any = {};

  // Group data by day for trending
  const dailyData: any = {};

  probeData.forEach(reading => {
    const probeName = reading.location_name || 'Unknown Probe';
    const date = new Date(reading.recorded_at).toLocaleDateString('en-AU');

    // Initialize probe stats
    if (!probeStats[probeName]) {
      probeStats[probeName] = {
        name: probeName,
        readings: 0,
        depths: new Set(),
        temperature: { min: Infinity, max: -Infinity, sum: 0, count: 0, values: [] },
        moisture: { min: Infinity, max: -Infinity, sum: 0, count: 0, values: [] },
        ph: { min: Infinity, max: -Infinity, sum: 0, count: 0, values: [] },
        ec: { min: Infinity, max: -Infinity, sum: 0, count: 0, values: [] },
        dailyReadings: {},
      };
    }

    const probe = probeStats[probeName];
    probe.readings++;

    // Track daily readings for graphing
    if (!probe.dailyReadings[date]) {
      probe.dailyReadings[date] = {
        temperature: [],
        moisture: [],
      };
    }

    if (reading.depth_cm) {
      probe.depths.add(reading.depth_cm);
    }

    if (reading.temperature_c !== null && reading.temperature_c !== undefined) {
      probe.temperature.min = Math.min(probe.temperature.min, reading.temperature_c);
      probe.temperature.max = Math.max(probe.temperature.max, reading.temperature_c);
      probe.temperature.sum += reading.temperature_c;
      probe.temperature.count++;
      probe.temperature.values.push(reading.temperature_c);
      probe.dailyReadings[date].temperature.push(reading.temperature_c);
    }

    if (reading.moisture_percent !== null && reading.moisture_percent !== undefined) {
      probe.moisture.min = Math.min(probe.moisture.min, reading.moisture_percent);
      probe.moisture.max = Math.max(probe.moisture.max, reading.moisture_percent);
      probe.moisture.sum += reading.moisture_percent;
      probe.moisture.count++;
      probe.moisture.values.push(reading.moisture_percent);
      probe.dailyReadings[date].moisture.push(reading.moisture_percent);
    }
  });

  Object.values(probeStats).forEach((probe: any) => {
    probe.depths = Array.from(probe.depths).sort((a: number, b: number) => a - b);
  });

  return {
    probeCount: probeApis.length,
    totalReadings: probeData.length,
    probeStats: Object.values(probeStats),
  };
}

function buildWeeklyProbeReportEmail(reportData: any, aiInterpretation: string = ''): string {
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
    .ai-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .probe-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #059669; }
    .metric { display: inline-block; margin: 10px 15px 10px 0; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .metric-value { font-size: 20px; font-weight: bold; color: #059669; }
    .status-good { color: #059669; }
    .status-warning { color: #f59e0b; }
    .status-alert { color: #dc2626; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
    .graph-container { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .graph-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; }
    .graph-canvas { position: relative; height: 200px; margin: 20px 0; }
    .graph-bar { position: absolute; bottom: 0; background: linear-gradient(180deg, #059669 0%, #047857 100%); border-radius: 4px 4px 0 0; transition: all 0.3s; }
    .graph-bar-moisture { background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); }
    .graph-label { position: absolute; bottom: -25px; font-size: 11px; color: #6b7280; text-align: center; width: 100%; }
    .graph-value { position: absolute; top: -20px; font-size: 11px; font-weight: bold; color: #374151; text-align: center; width: 100%; }
    .graph-y-axis { position: absolute; left: -40px; top: 0; height: 100%; display: flex; flex-direction: column; justify-content: space-between; font-size: 10px; color: #6b7280; }
    .highlight-box { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin: 0 5px; }
    .highlight-high { background: #fee2e2; color: #dc2626; }
    .highlight-low { background: #dbeafe; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Weekly Soil Health Report</h1>
      <p style="margin: 0;">${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <div class="content">
      ${buildGraphsSection(reportData)}

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
            <p style="color: #6b7280; font-size: 14px;">
              ${probe.readings} readings this week
              ${probe.depths.length > 0 ? ` • Monitoring depths: ${probe.depths.join('cm, ')}cm` : ''}
            </p>

            ${probe.temperature.count > 0 ? `
              <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px;">🌡️ Soil Temperature</h4>
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
                <div class="metric">
                  <div class="metric-label">Range</div>
                  <div class="metric-value">${(probe.temperature.max - probe.temperature.min).toFixed(1)}°C</div>
                </div>
              </div>
            ` : ''}

            ${probe.moisture.count > 0 ? `
              <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px;">💧 Soil Moisture</h4>
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
                <div class="metric">
                  <div class="metric-label">Variation</div>
                  <div class="metric-value">${(probe.moisture.max - probe.moisture.min).toFixed(1)}%</div>
                </div>
                <div style="margin-top: 12px; padding: 12px; background: ${getMoistureColor(probe.moisture.sum / probe.moisture.count)}; border-radius: 6px; color: white;">
                  <strong>${getMoistureRecommendation(probe.moisture.sum / probe.moisture.count)}</strong>
                </div>
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

function buildGraphsSection(reportData: any): string {
  if (!reportData.probeStats || reportData.probeStats.length === 0) {
    return '';
  }

  let graphsHtml = '';

  reportData.probeStats.forEach((probe: any) => {
    // Get last 7 days
    const days: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-AU'));
    }

    // Calculate daily averages
    const dailyTemps: (number | null)[] = [];
    const dailyMoisture: (number | null)[] = [];

    days.forEach(day => {
      const dayData = probe.dailyReadings[day];
      if (dayData) {
        if (dayData.temperature && dayData.temperature.length > 0) {
          const avg = dayData.temperature.reduce((a: number, b: number) => a + b, 0) / dayData.temperature.length;
          dailyTemps.push(avg);
        } else {
          dailyTemps.push(null);
        }

        if (dayData.moisture && dayData.moisture.length > 0) {
          const avg = dayData.moisture.reduce((a: number, b: number) => a + b, 0) / dayData.moisture.length;
          dailyMoisture.push(avg);
        } else {
          dailyMoisture.push(null);
        }
      } else {
        dailyTemps.push(null);
        dailyMoisture.push(null);
      }
    });

    // Build temperature graph
    if (probe.temperature.count > 0) {
      const tempMin = probe.temperature.min;
      const tempMax = probe.temperature.max;
      const tempRange = tempMax - tempMin;

      graphsHtml += `
        <div class="graph-container">
          <div class="graph-title">🌡️ ${probe.name} - Soil Temperature Trend</div>
          <div style="margin-bottom: 15px; text-align: center;">
            <span class="highlight-box highlight-high">High: ${tempMax.toFixed(1)}°C</span>
            <span class="highlight-box highlight-low">Low: ${tempMin.toFixed(1)}°C</span>
          </div>
          <div style="position: relative; padding-left: 50px; margin-top: 30px;">
            <div class="graph-canvas" style="display: flex; align-items: flex-end; justify-content: space-around; gap: 8px;">
              ${days.map((day, i) => {
                const temp = dailyTemps[i];
                if (temp === null) {
                  return `
                    <div style="flex: 1; position: relative;">
                      <div style="height: 20px; background: #e5e7eb; border-radius: 4px; opacity: 0.3;"></div>
                      <div class="graph-label">${day.split('/')[0]}/${day.split('/')[1]}</div>
                    </div>
                  `;
                }
                const height = tempRange > 0 ? ((temp - tempMin) / tempRange * 180) + 20 : 100;
                return `
                  <div style="flex: 1; position: relative;">
                    <div class="graph-bar" style="height: ${height}px;">
                      <div class="graph-value">${temp.toFixed(1)}°C</div>
                    </div>
                    <div class="graph-label">${day.split('/')[0]}/${day.split('/')[1]}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Build moisture graph
    if (probe.moisture.count > 0) {
      const moistMin = probe.moisture.min;
      const moistMax = probe.moisture.max;
      const moistRange = moistMax - moistMin;

      graphsHtml += `
        <div class="graph-container">
          <div class="graph-title">💧 ${probe.name} - Soil Moisture Trend</div>
          <div style="margin-bottom: 15px; text-align: center;">
            <span class="highlight-box highlight-high">High: ${moistMax.toFixed(1)}%</span>
            <span class="highlight-box highlight-low">Low: ${moistMin.toFixed(1)}%</span>
          </div>
          <div style="position: relative; padding-left: 50px; margin-top: 30px;">
            <div class="graph-canvas" style="display: flex; align-items: flex-end; justify-content: space-around; gap: 8px;">
              ${days.map((day, i) => {
                const moisture = dailyMoisture[i];
                if (moisture === null) {
                  return `
                    <div style="flex: 1; position: relative;">
                      <div style="height: 20px; background: #e5e7eb; border-radius: 4px; opacity: 0.3;"></div>
                      <div class="graph-label">${day.split('/')[0]}/${day.split('/')[1]}</div>
                    </div>
                  `;
                }
                const height = moistRange > 0 ? ((moisture - moistMin) / moistRange * 180) + 20 : 100;
                return `
                  <div style="flex: 1; position: relative;">
                    <div class="graph-bar graph-bar-moisture" style="height: ${height}px;">
                      <div class="graph-value">${moisture.toFixed(1)}%</div>
                    </div>
                    <div class="graph-label">${day.split('/')[0]}/${day.split('/')[1]}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }
  });

  return graphsHtml;
}

function getMoistureStatus(moisture: number): string {
  if (moisture < 20) return 'status-alert';
  if (moisture > 80) return 'status-warning';
  return 'status-good';
}

function getMoistureRecommendation(moisture: number): string {
  if (moisture < 30) return 'Very Dry - Irrigation Recommended';
  if (moisture < 40) return 'Dry - Monitor Closely';
  if (moisture < 60) return 'Optimal Moisture Range';
  if (moisture < 70) return 'Moist - Good Conditions';
  return 'Very Wet - Check Drainage';
}

function getMoistureColor(moisture: number): string {
  if (moisture < 30) return '#D32F2F';
  if (moisture < 40) return '#F57C00';
  if (moisture < 60) return '#388E3C';
  if (moisture < 70) return '#1976D2';
  return '#0277BD';
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

function buildWeeklyProbeReportEmailText(reportData: any, aiInterpretation: string = ''): string {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date();

  let text = `
WEEKLY SOIL HEALTH REPORT
${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}

${aiInterpretation ? `FARMER JOE'S WEEKLY ANALYSIS:\n${aiInterpretation}\n\n` : ''}OVERVIEW:
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
