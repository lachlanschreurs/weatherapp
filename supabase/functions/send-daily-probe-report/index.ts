import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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

    console.log(`Found ${subscribers?.length || 0} total subscribers with probe access`);

    const eligibleSubscribers = subscribers?.filter((profile: any) => {
      const now = new Date();
      const startedAt = new Date(profile.probe_report_subscription_started_at);
      const freeEndDate = new Date(startedAt);
      freeEndDate.setMonth(freeEndDate.getMonth() + 3);

      if (now < freeEndDate) {
        return true;
      }

      if (profile.farmer_joe_subscription_status === 'active') {
        return true;
      }

      return false;
    }).map((profile: any) => ({
      user_id: profile.id,
      email: profile.email
    })) || [];

    console.log(`Found ${eligibleSubscribers.length} eligible subscribers`);

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

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    for (const subscriber of eligibleSubscribers) {
      try {
        console.log(`Processing subscriber: ${subscriber.email}`);

        const { data: probeApis, error: apiError } = await supabaseAdmin
          .from('probe_apis')
          .select('*')
          .eq('user_id', subscriber.user_id);

        if (apiError) {
          console.error(`Error fetching probe APIs for ${subscriber.email}:`, apiError);
          continue;
        }

        console.log(`Found ${probeApis?.length || 0} probe APIs for ${subscriber.email}`);

        if (!probeApis || probeApis.length === 0) {
          console.log(`Skipping ${subscriber.email} - no probe APIs configured`);
          continue;
        }

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

        console.log(`Found ${probeData?.length || 0} probe readings for ${subscriber.email}`);

        if (!probeData || probeData.length === 0) {
          console.log(`Skipping ${subscriber.email} - no probe data in last 24 hours`);
          continue;
        }

        const reportData = analyzeProbeData(probeData || [], probeApis);

        let aiInterpretation = '';
        try {
          aiInterpretation = await generateAIInterpretation(probeData || []);
        } catch (aiError) {
          console.error(`Failed to generate AI interpretation for ${subscriber.email}:`, aiError);
        }

        const htmlContent = buildDailyProbeReportEmail(reportData, aiInterpretation);

        console.log(`Sending email to ${subscriber.email}...`);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'FarmCast <support@mail.farmcastweather.com>',
            to: subscriber.email,
            subject: `Daily Soil Health Report - ${new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${subscriber.email}:`, errorText);
          continue;
        }

        console.log(`Successfully sent email to ${subscriber.email}`);
        emailsSent++;
      } catch (error) {
        console.error(`Error processing subscriber ${subscriber.email}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully sent ${emailsSent} daily reports`, total: eligibleSubscribers.length, sent: emailsSent }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-daily-probe-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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

async function generateAIInterpretation(probeData: any[]): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return '';
  }

  try {
    const dataByLocation: { [key: string]: any[] } = {};
    probeData.forEach(reading => {
      const location = reading.location_name || 'Unknown';
      if (!dataByLocation[location]) {
        dataByLocation[location] = [];
      }
      dataByLocation[location].push(reading);
    });

    const summaries = Object.entries(dataByLocation).map(([location, readings]) => {
      const temps = readings.map(r => r.temperature_c).filter(t => t !== null);
      const moistures = readings.map(r => r.moisture_percent).filter(m => m !== null);

      return `${location}: ${readings.length} readings today. Temperature ${Math.min(...temps).toFixed(1)}°C to ${Math.max(...temps).toFixed(1)}°C (avg ${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°C). Soil moisture ${Math.min(...moistures).toFixed(1)}% to ${Math.max(...moistures).toFixed(1)}% (avg ${(moistures.reduce((a, b) => a + b, 0) / moistures.length).toFixed(1)}%).`;
    }).join(' ');

    const prompt = `You are Farmer Joe, an experienced agricultural advisor. Analyze this daily soil probe data and provide practical advice for today:

${summaries}

Provide a brief daily update (2-3 sentences) covering:
1. Overall soil health status today
2. Any immediate actions needed (irrigation, inspection, etc.)
3. One key observation or tip for today

Keep it practical and actionable for today's farm work.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Farmer Joe, a helpful agricultural advisor who provides practical farming advice.' },
          { role: 'user', content: prompt }
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

  probeData.forEach(reading => {
    const probeName = reading.location_name || 'Unknown Probe';

    if (!probeStats[probeName]) {
      probeStats[probeName] = {
        name: probeName,
        readings: 0,
        depths: new Set(),
        temperature: { min: Infinity, max: -Infinity, sum: 0, count: 0, values: [] },
        moisture: { min: Infinity, max: -Infinity, sum: 0, count: 0, values: [] },
      };
    }

    const probe = probeStats[probeName];
    probe.readings++;

    if (reading.depth_cm) {
      probe.depths.add(reading.depth_cm);
    }

    if (reading.temperature_c !== null && reading.temperature_c !== undefined) {
      probe.temperature.min = Math.min(probe.temperature.min, reading.temperature_c);
      probe.temperature.max = Math.max(probe.temperature.max, reading.temperature_c);
      probe.temperature.sum += reading.temperature_c;
      probe.temperature.count++;
      probe.temperature.values.push(reading.temperature_c);
    }

    if (reading.moisture_percent !== null && reading.moisture_percent !== undefined) {
      probe.moisture.min = Math.min(probe.moisture.min, reading.moisture_percent);
      probe.moisture.max = Math.max(probe.moisture.max, reading.moisture_percent);
      probe.moisture.sum += reading.moisture_percent;
      probe.moisture.count++;
      probe.moisture.values.push(reading.moisture_percent);
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

function buildDailyProbeReportEmail(reportData: any, aiInterpretation: string = ''): string {
  const today = new Date();

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .ai-section { background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
    .ai-section h2 { margin-top: 0; font-size: 20px; }
    .probe-section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .probe-section h3 { color: #2E7D32; margin-top: 0; border-bottom: 2px solid #2E7D32; padding-bottom: 10px; }
    .metric { margin: 15px 0; padding: 12px; background: #f5f5f5; border-radius: 6px; }
    .metric-label { font-weight: bold; color: #555; font-size: 14px; }
    .metric-value { font-size: 24px; color: #2E7D32; font-weight: bold; margin: 5px 0; }
    .metric-range { color: #666; font-size: 14px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .summary { background: #E8F5E9; padding: 15px; border-left: 4px solid #2E7D32; margin-bottom: 20px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Daily Soil Health Report</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">${today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="content">
      ${aiInterpretation ? `
      <div class="ai-section">
        <h2>🌾 Farmer Joe's Daily Update</h2>
        <p style="margin: 0; line-height: 1.8; font-size: 15px;">${aiInterpretation}</p>
      </div>
      ` : ''}

      <div class="summary">
        <strong>Today's Overview:</strong> ${reportData.totalReadings} readings from ${reportData.probeCount} probe${reportData.probeCount !== 1 ? 's' : ''}
      </div>

      ${reportData.probeStats.map((probe: any) => `
        <div class="probe-section">
          <h3>${probe.name}</h3>
          <p style="color: #666; margin-top: 0;">
            ${probe.readings} readings today
            ${probe.depths.length > 0 ? ` • Depths: ${probe.depths.join('cm, ')}cm` : ''}
          </p>

          ${probe.temperature.count > 0 ? `
          <div class="metric">
            <div class="metric-label">🌡️ Soil Temperature</div>
            <div class="metric-value">${(probe.temperature.sum / probe.temperature.count).toFixed(1)}°C</div>
            <div class="metric-range">Range: ${probe.temperature.min.toFixed(1)}°C to ${probe.temperature.max.toFixed(1)}°C</div>
          </div>
          ` : ''}

          ${probe.moisture.count > 0 ? `
          <div class="metric">
            <div class="metric-label">💧 Soil Moisture</div>
            <div class="metric-value">${(probe.moisture.sum / probe.moisture.count).toFixed(1)}%</div>
            <div class="metric-range">Range: ${probe.moisture.min.toFixed(1)}% to ${probe.moisture.max.toFixed(1)}%</div>
            <div style="margin-top: 8px; padding: 8px; background: ${getMoistureColor((probe.moisture.sum / probe.moisture.count))}; border-radius: 4px; color: white; font-size: 13px; text-align: center;">
              ${getMoistureStatus((probe.moisture.sum / probe.moisture.count))}
            </div>
          </div>
          ` : ''}
        </div>
      `).join('')}

      <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #F57C00;">
        <strong style="color: #E65100;">💡 Tip of the Day:</strong>
        <p style="margin: 8px 0 0 0; color: #555;">Monitor your soil moisture levels daily to optimize irrigation timing. Most crops thrive with soil moisture between 40-60%.</p>
      </div>
    </div>

    <div class="footer">
      <p>This is your daily soil health report from FarmCast</p>
      <p>Data collected from your connected probe stations</p>
    </div>
  </div>
</body>
</html>
`;
}

function getMoistureStatus(moisture: number): string {
  if (moisture < 30) return 'Very Dry - Consider Irrigation';
  if (moisture < 40) return 'Dry - Monitor Closely';
  if (moisture < 60) return 'Optimal Range';
  if (moisture < 70) return 'Moist';
  return 'Very Wet - Check Drainage';
}

function getMoistureColor(moisture: number): string {
  if (moisture < 30) return '#D32F2F';
  if (moisture < 40) return '#F57C00';
  if (moisture < 60) return '#388E3C';
  if (moisture < 70) return '#1976D2';
  return '#0277BD';
}
