import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      .from('email_subscriptions')
      .select('user_id, email, created_at')
      .eq('daily_forecast_enabled', true);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscribers found' }),
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
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        let location = 'Melbourne, Australia';

        if (subscriber.user_id) {
          const { data: favoriteLocation } = await supabaseAdmin
            .from('saved_locations')
            .select('name')
            .eq('user_id', subscriber.user_id)
            .or('is_primary.eq.true,is_favorite.eq.true')
            .order('is_primary', { ascending: false })
            .order('last_accessed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (favoriteLocation?.name) {
            location = favoriteLocation.name;
          }
        }

        const emailHtml = buildWelcomeEmail(location);
        const emailText = buildWelcomeEmailText(location);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'FarmCast <support@mail.farmcastweather.com>',
            to: subscriber.email,
            subject: 'Welcome to FarmCast - Your Farm Weather Assistant',
            html: emailHtml,
            text: emailText,
          }),
        });

        if (emailResponse.ok) {
          emailsSent++;
          console.log(`Successfully sent welcome email to ${subscriber.email}`);
        } else {
          const errorData = await emailResponse.text();
          errors.push(`Failed to send to ${subscriber.email}: ${errorData}`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Error processing ${subscriber.email}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${emailsSent} welcome emails to existing subscribers`,
        total: subscribers.length,
        sent: emailsSent,
        errors: errors.length,
        errorDetails: errors
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-bulk-welcome-emails function:', error);
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

function buildWelcomeEmail(location: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #059669; color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .feature-box { background: #f9fafb; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #059669; }
    .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f3f4f6; color: #6b7280; padding: 20px; text-align: center; font-size: 12px; }
    .footer a { color: #059669; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Welcome to FarmCast</h1>
      <p style="font-size: 16px; margin: 0;">Agricultural Weather Intelligence</p>
    </div>

    <div class="content">
      <p>Thank you for joining FarmCast. We're here to help you make better farming decisions with accurate weather forecasts and intelligent insights.</p>

      <div class="feature-box">
        <h3 style="margin-top: 0;">Daily Weather Forecasts</h3>
        <p style="margin-bottom: 15px;">You're now subscribed to daily email forecasts at 7:00 AM including:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Detailed Weather Conditions</strong> - Temperature, rainfall, wind, and humidity</li>
          <li><strong>Spray Window Analysis</strong> - Delta T and optimal spraying conditions</li>
          <li><strong>5-Day Forecast</strong> - Plan ahead with extended weather predictions</li>
          <li><strong>Farming Recommendations</strong> - Planting conditions and irrigation advice</li>
          <li><strong>Weather Alerts</strong> - Critical warnings for your farm operations</li>
        </ul>
      </div>

      <div class="feature-box">
        <h3 style="margin-top: 0;">Your Location</h3>
        <p>Default location: <strong>${location}</strong></p>
        <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">You can change this anytime in your dashboard.</p>
      </div>

      <div class="feature-box">
        <h3 style="margin-top: 0;">What to Expect</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Daily Emails</strong> - Every morning at 7:00 AM, 7 days a week</li>
          <li><strong>Weekly Soil Reports</strong> - If you have probes configured</li>
          <li><strong>Real-time Alerts</strong> - Critical weather warnings as they happen</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://farmcastweather.com" class="cta-button">View Dashboard</a>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; font-size: 14px;">
        <strong>Your first daily forecast will arrive tomorrow at 7:00 AM</strong> with detailed weather analysis for your location.
      </p>
    </div>

    <div class="footer">
      <p><strong>FarmCast Weather</strong></p>
      <p style="margin: 10px 0;">You're receiving this as a new FarmCast member.</p>
      <p style="margin: 10px 0;">
        <a href="https://farmcastweather.com/settings">Email Preferences</a> |
        <a href="https://farmcastweather.com/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin: 15px 0 0 0; color: #9ca3af;">
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

Thank you for joining FarmCast. We're here to help you make better farming decisions with accurate weather forecasts and intelligent insights.

DAILY WEATHER FORECASTS

You're now subscribed to daily email forecasts at 7:00 AM including:

- Detailed Weather Conditions
  Temperature, rainfall, wind, and humidity

- Spray Window Analysis
  Delta T and optimal spraying conditions

- 5-Day Forecast
  Plan ahead with extended weather predictions

- Farming Recommendations
  Planting conditions and irrigation advice

- Weather Alerts
  Critical warnings for your farm operations

YOUR LOCATION:

Default location: ${location}
You can change this anytime in your dashboard.

WHAT TO EXPECT:

- Daily Emails: Every morning at 7:00 AM, 7 days a week
- Weekly Soil Reports: If you have probes configured
- Real-time Alerts: Critical weather warnings as they happen

Your first daily forecast will arrive tomorrow at 7:00 AM with detailed weather analysis for your location.

Visit your dashboard: https://farmcastweather.com

---

FarmCast Weather
You're receiving this as a new FarmCast member.

Manage preferences: https://farmcastweather.com/settings
Unsubscribe: https://farmcastweather.com/unsubscribe

FarmCast Weather Services
This email was sent to an active FarmCast account.
  `.trim();
}
