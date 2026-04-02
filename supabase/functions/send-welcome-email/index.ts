import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  location: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userId, email, location }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let probeReport = '';
    if (userId) {
      probeReport = await generateProbeReport(userId, supabaseAdmin);
    }

    const emailHtml = buildWelcomeEmail(location || 'Sydney, Australia', probeReport);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'FarmCast <support@mail.farmcastweather.com>',
        to: email,
        subject: 'Welcome to FarmCast - Your Farm Weather Assistant',
        html: emailHtml,
        text: buildWelcomeEmailText(location || 'Sydney, Australia'),
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Failed to send welcome email: ${errorData}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
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

async function generateProbeReport(userId: string, supabaseAdmin: any): Promise<string> {
  try {
    const { data: probeApis, error: apiError } = await supabaseAdmin
      .from('probe_apis')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (apiError || !probeApis || probeApis.length === 0) {
      return '';
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);

    const { data: probeData, error: dataError } = await supabaseAdmin
      .from('probe_data')
      .select('probe_id, depth, moisture, temperature, reading_time')
      .eq('probe_api_id', probeApis[0].id)
      .gte('reading_time', startDate.toISOString())
      .lte('reading_time', endDate.toISOString())
      .order('reading_time', { ascending: false })
      .limit(50);

    if (dataError || !probeData || probeData.length === 0) {
      return '';
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return '';
    }

    const probeDataSummary = probeData.slice(0, 10).map((reading: any) => ({
      time: new Date(reading.reading_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }),
      depth: reading.depth,
      moisture: reading.moisture,
      temperature: reading.temperature
    }));

    const prompt = `You are an agricultural soil expert analyzing moisture probe data. Based on the following recent readings, provide a brief 2-3 sentence summary of soil conditions and one actionable recommendation for the farmer.

Recent readings (last 24 hours):
${JSON.stringify(probeDataSummary, null, 2)}

Provide a concise, practical analysis focused on moisture levels, trends, and irrigation recommendations. Keep it under 100 words.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful agricultural advisor providing concise soil analysis.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI API error:', await aiResponse.text());
      return '';
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0]?.message?.content || '';

    if (!analysis) {
      return '';
    }

    return `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; margin-top: 20px;">
        <div style="font-size: 12px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
          🌱 Soil Moisture Analysis
        </div>
        <div style="font-size: 14px; color: #78350f; line-height: 1.6; font-weight: 500;">
          ${analysis}
        </div>
        <div style="font-size: 11px; color: #92400e; margin-top: 10px; font-weight: 600;">
          Based on ${probeData.length} readings from the last 24 hours
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating probe report:', error);
    return '';
  }
}

function buildWelcomeEmail(location: string, probeReport: string = ''): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%); margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 50px 30px; text-align: center; position: relative; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="white"/></svg>') no-repeat bottom; background-size: cover; opacity: 0.1; }
    .header h1 { margin: 0 0 10px 0; font-size: 36px; font-weight: 700; position: relative; z-index: 1; }
    .header p { font-size: 18px; margin: 0; opacity: 0.95; position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .welcome-message { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.8; }
    .feature-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; margin: 20px 0; border-radius: 12px; border-left: 5px solid #059669; box-shadow: 0 2px 10px rgba(5, 150, 105, 0.1); }
    .feature-box h3 { margin-top: 0; color: #047857; font-size: 20px; font-weight: 700; }
    .feature-list { margin: 15px 0; padding-left: 0; list-style: none; }
    .feature-list li { padding: 8px 0 8px 30px; position: relative; color: #1f2937; font-size: 15px; }
    .feature-list li::before { content: '✓'; position: absolute; left: 0; color: #059669; font-weight: bold; font-size: 18px; }
    .subscription-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; margin: 20px 0; border-radius: 12px; border-left: 5px solid #2563eb; box-shadow: 0 2px 10px rgba(37, 99, 235, 0.1); }
    .subscription-box h3 { margin-top: 0; color: #1e40af; font-size: 20px; font-weight: 700; }
    .price { font-size: 32px; font-weight: 800; color: #1e40af; margin: 10px 0; }
    .location-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; margin: 20px 0; border-radius: 12px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.1); }
    .location-box h3 { margin-top: 0; color: #92400e; font-size: 20px; font-weight: 700; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; margin: 30px 0; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3); transition: transform 0.2s; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4); }
    .tip-box { margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; border: 2px solid #3b82f6; font-size: 14px; }
    .tip-box strong { color: #1e40af; font-size: 16px; }
    .footer { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); color: #6b7280; padding: 30px; text-align: center; font-size: 13px; }
    .footer a { color: #059669; text-decoration: none; font-weight: 600; }
    .footer a:hover { text-decoration: underline; }
    .divider { height: 2px; background: linear-gradient(90deg, transparent, #d1d5db, transparent); margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Welcome to FarmCast</h1>
      <p>Agricultural Weather Intelligence</p>
    </div>

    <div class="content">
      <p class="welcome-message">Thank you for joining FarmCast! We're excited to help you make smarter farming decisions with accurate weather forecasts, intelligent insights, and real-time soil monitoring.</p>

      <div class="feature-box">
        <h3>🎉 Welcome to FarmCast Premium</h3>
        <p style="margin-bottom: 15px; color: #047857; font-weight: 600;">You now have access to all premium features:</p>
        <ul class="feature-list">
          <li><strong>Daily Weather Forecasts</strong> - Delivered every morning at 7:00 AM with spray conditions, soil moisture analysis, and farming recommendations</li>
          <li><strong>30-Day Extended Forecast</strong> - Long-range planning for your farm operations</li>
          <li><strong>Weather Alerts & Notifications</strong> - Real-time warnings for critical conditions</li>
          <li><strong>Farmer Joe AI Assistant</strong> - Chat with our agricultural AI for personalized advice</li>
          <li><strong>Best Planting Days</strong> - Optimized schedules based on weather patterns</li>
          <li><strong>Irrigation Schedule</strong> - Smart watering recommendations</li>
          <li><strong>Soil Moisture Monitoring</strong> - Track and analyze probe data with AI-powered insights</li>
        </ul>
      </div>

      ${probeReport}

      <div class="subscription-box">
        <h3>💳 Your Subscription</h3>
        <div class="price">$2.99/month</div>
        <p style="margin: 5px 0; color: #1e40af; font-weight: 600;">Billed monthly until you cancel</p>
        <p style="margin-top: 15px; font-size: 14px; color: #1f2937;">You'll receive comprehensive daily forecast emails at 7:00 AM, 7 days a week, including weather data, spray windows, and soil moisture analysis.</p>
      </div>

      <div class="location-box">
        <h3>📍 Your Location</h3>
        <p style="font-size: 18px; margin: 10px 0;">Default location: <strong>${location}</strong></p>
        <p style="font-size: 14px; color: #92400e; margin: 5px 0 0 0;">You can update this anytime in your dashboard settings.</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://farmcast.app" class="cta-button">Open Your Dashboard →</a>
      </div>

      <div class="divider"></div>

      <div class="tip-box">
        <strong>💡 Pro Tip:</strong> Start a conversation with Farmer Joe, our AI assistant, to get personalized farming advice based on your current weather conditions and soil data. He's available 24/7 in your dashboard!
      </div>
    </div>

    <div class="footer">
      <p style="font-weight: 700; color: #374151; font-size: 15px; margin-bottom: 15px;">FarmCast Weather</p>
      <p style="margin: 10px 0;">You're receiving this as a new FarmCast member.</p>
      <p style="margin: 15px 0;">
        <a href="https://farmcast.app/preferences">Email Preferences</a> |
        <a href="https://farmcast.app/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
        FarmCast Weather Services<br>
        This email was sent to an active FarmCast account.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildWelcomeEmailText(location: string): string {
  return `
Welcome to FarmCast - Agricultural Weather Intelligence

Thank you for joining FarmCast! We're excited to help you make smarter farming decisions with accurate weather forecasts, intelligent insights, and real-time soil monitoring.

WELCOME TO FARMCAST PREMIUM

You now have access to all premium features:

- Daily Weather Forecasts
  Delivered every morning at 7:00 AM with spray conditions, soil moisture analysis, and farming recommendations

- 30-Day Extended Forecast
  Long-range planning for your farm operations

- Weather Alerts & Notifications
  Real-time warnings for critical conditions

- Farmer Joe AI Assistant
  Chat with our agricultural AI for personalized advice

- Best Planting Days
  Optimized schedules based on weather patterns

- Irrigation Schedule
  Smart watering recommendations

- Soil Moisture Monitoring
  Track and analyze probe data with AI-powered insights

YOUR SUBSCRIPTION:

$2.99/month - Billed monthly until you cancel

You'll receive comprehensive daily forecast emails at 7:00 AM, 7 days a week, including weather data, spray windows, and soil moisture analysis.

YOUR LOCATION:

Default location: ${location}
You can update this anytime in your dashboard settings.

Visit your dashboard: https://farmcast.app

Pro Tip: Start a conversation with Farmer Joe, our AI assistant, to get personalized farming advice based on your current weather conditions and soil data. He's available 24/7 in your dashboard!

---

FarmCast Weather
You're receiving this as a new FarmCast member.

Manage preferences: https://farmcast.app/preferences
Unsubscribe: https://farmcast.app/unsubscribe

FarmCast Weather Services
This email was sent to an active FarmCast account.
  `.trim();
}
