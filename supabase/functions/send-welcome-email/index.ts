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

    const emailHtml = buildWelcomeEmail(location || 'Sydney, Australia');

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
        <h3 style="margin-top: 0;">Welcome to FarmCast Premium</h3>
        <p style="margin-bottom: 15px;">You now have access to all premium features including:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Daily Weather Forecasts</strong> - Delivered at 7:00 AM with spray conditions and farming recommendations</li>
          <li><strong>30-Day Extended Forecast</strong> - Long-range planning for your farm operations</li>
          <li><strong>Weather Alerts & Notifications</strong> - Real-time warnings for critical conditions</li>
          <li><strong>Farmer Joe AI Assistant</strong> - Chat with our agricultural AI for personalized advice</li>
          <li><strong>Best Planting Days</strong> - Optimized schedules based on weather patterns</li>
          <li><strong>Irrigation Schedule</strong> - Smart watering recommendations</li>
          <li><strong>Probe Monitoring</strong> - Track and analyze soil moisture data</li>
        </ul>
      </div>

      <div class="feature-box">
        <h3 style="margin-top: 0;">Your Subscription</h3>
        <p><strong>$2.99/month</strong> - Billed monthly until you cancel</p>
        <p style="margin-top: 10px; font-size: 14px; color: #059669;">You'll receive daily forecast emails at 7:00 AM based on your location preferences.</p>
      </div>

      <div class="feature-box">
        <h3 style="margin-top: 0;">Your Location</h3>
        <p>Default location: <strong>${location}</strong></p>
        <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">You can change this anytime in your dashboard.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://farmcast.app" class="cta-button">View Dashboard</a>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; font-size: 14px;">
        <strong>Tip:</strong> Chat with Farmer Joe for personalized farming advice based on current weather conditions.
      </p>
    </div>

    <div class="footer">
      <p><strong>FarmCast Weather</strong></p>
      <p style="margin: 10px 0;">You're receiving this as a new FarmCast member.</p>
      <p style="margin: 10px 0;">
        <a href="https://farmcast.app/preferences">Email Preferences</a> |
        <a href="https://farmcast.app/unsubscribe">Unsubscribe</a>
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

WELCOME TO FARMCAST PREMIUM

You now have access to all premium features including:

- Daily Weather Forecasts
  Delivered at 7:00 AM with spray conditions and farming recommendations

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

- Probe Monitoring
  Track and analyze soil moisture data

YOUR SUBSCRIPTION:

$2.99/month - Billed monthly until you cancel

You'll receive daily forecast emails at 7:00 AM based on your location preferences.

YOUR LOCATION:

Default location: ${location}
You can change this anytime in your dashboard.

Visit your dashboard: https://farmcast.app

Tip: Chat with Farmer Joe for personalized farming advice based on current weather conditions.

---

FarmCast Weather
You're receiving this as a new FarmCast member.

Manage preferences: https://farmcast.app/preferences
Unsubscribe: https://farmcast.app/unsubscribe

FarmCast Weather Services
This email was sent to an active FarmCast account.
  `.trim();
}
