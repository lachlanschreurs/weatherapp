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
        from: 'FarmCast <support@farmcastweather.com>',
        to: email,
        subject: 'Welcome to FarmCast - Your AI Farm Weather Assistant',
        html: emailHtml,
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .feature-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #059669; }
    .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Welcome to FarmCast!</h1>
      <p style="font-size: 18px; margin-top: 10px;">Your AI-Powered Farm Weather Assistant</p>
    </div>

    <div class="content">
      <h2>Thanks for joining us!</h2>
      <p>We're excited to have you on board. FarmCast is designed to help you make better farming decisions with accurate weather forecasts and AI-powered insights.</p>

      <div class="feature-box">
        <h3>📧 What You'll Receive</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Daily Weather Forecasts</strong> - Delivered at 7:00 AM with spray conditions and farming recommendations</li>
          <li><strong>Weekly Soil Health Reports</strong> - Comprehensive analysis of your moisture probe data (when you upload probe information)</li>
          <li><strong>Real-time Alerts</strong> - Important weather warnings and optimal spray windows</li>
        </ul>
      </div>

      <div class="feature-box">
        <h3>🎁 3-Month Free Trial</h3>
        <p>Enjoy <strong>3 months of complimentary email reports</strong> to experience the full power of FarmCast. After your trial, email reports are available with our Farmer Joe AI subscription at just $5.99/month.</p>
      </div>

      <div class="feature-box">
        <h3>🚜 Your Location</h3>
        <p>We've set your default location to <strong>${location}</strong>. You can change this anytime in your dashboard.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://farmcast.app" class="cta-button">Visit Your Dashboard</a>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        💡 <strong>Pro Tip:</strong> Chat with Farmer Joe, our AI assistant, for personalized farming advice based on current weather conditions!
      </p>
    </div>

    <div class="footer">
      <p><strong>FarmCast</strong> - Smarter Farming Through Better Weather Intelligence</p>
      <p style="margin-top: 10px;">You're receiving this as a new FarmCast member. Your daily forecasts start tomorrow at 7:00 AM.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
