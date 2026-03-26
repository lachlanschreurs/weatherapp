import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WeatherData {
  location: string;
  current: any;
  forecast: any;
  sprayConditions: string;
  deltaT: number;
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

    // Get all subscribers with daily forecast enabled who are in trial or have premium
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('*, user_subscriptions!inner(status, subscription_tier)')
      .eq('daily_forecast_enabled', true)
      .or('trial_active.eq.true,user_subscriptions.status.eq.active');

    if (subError) throw subError;

    // Filter to only include users who should receive emails
    const eligibleSubscribers = subscribers?.filter((sub: any) => {
      // In trial and trial not expired
      if (sub.trial_active && new Date(sub.trial_end_date) > new Date()) {
        return true;
      }
      // Has active premium subscription
      if (sub.user_subscriptions?.status === 'active' &&
          sub.user_subscriptions?.subscription_tier === 'premium') {
        return true;
      }
      return false;
    }) || [];

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

    const weatherApiKey = Deno.env.get('API_KEY_FARMCAST');
    if (!weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    let emailsSent = 0;

    // Send email to each eligible subscriber
    for (const subscriber of eligibleSubscribers) {
      try {
        const location = subscriber.location || 'Sydney, Australia';

        // Fetch weather data for subscriber's location
        const weatherResponse = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(location)}&days=5&aqi=yes`
        );

        if (!weatherResponse.ok) {
          console.error(`Failed to fetch weather for ${subscriber.email}`);
          continue;
        }

        const weatherData = await weatherResponse.json();

        // Calculate spray conditions
        const current = weatherData.current;
        const sprayConditions = getSprayConditions(current);

        // Build email HTML
        const emailHtml = buildDailyForecastEmail(weatherData, sprayConditions);

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'FarmCast <noreply@farmcast.app>',
            to: subscriber.email,
            subject: `Daily Farm Forecast - ${location}`,
            html: emailHtml,
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
        message: `Successfully sent ${emailsSent} emails to subscribers`,
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
    console.error('Error in send-daily-forecast function:', error);
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

function getSprayConditions(current: any): string {
  const temp = current.temp_c;
  const humidity = current.humidity;
  const windSpeed = current.wind_kph;
  const deltaT = temp - (temp * humidity / 100);

  if (windSpeed > 20) return 'Poor - Wind too strong';
  if (temp < 8 || temp > 30) return 'Poor - Temperature out of range';
  if (deltaT < 2 || deltaT > 10) return 'Poor - Delta T out of range';
  if (current.precip_mm > 0) return 'Poor - Rain detected';

  if (windSpeed < 5 && deltaT >= 2 && deltaT <= 8 && temp >= 15 && temp <= 25) {
    return 'Excellent - Perfect conditions';
  }

  if (windSpeed <= 10 && deltaT >= 2 && deltaT <= 10) {
    return 'Good - Suitable conditions';
  }

  return 'Fair - Acceptable conditions';
}

function buildDailyForecastEmail(weatherData: any, sprayConditions: string): string {
  const location = weatherData.location.name;
  const current = weatherData.current;
  const forecast = weatherData.forecast.forecastday;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .spray-box { background: ${sprayConditions.includes('Excellent') ? '#d1fae5' : sprayConditions.includes('Good') ? '#fef3c7' : '#fee2e2'};
                 border-left: 4px solid ${sprayConditions.includes('Excellent') ? '#059669' : sprayConditions.includes('Good') ? '#f59e0b' : '#dc2626'};
                 padding: 15px; margin: 20px 0; border-radius: 5px; }
    .forecast-day { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌤️ Daily Farm Forecast</h1>
      <p>${location} - ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <h2>Current Conditions</h2>
      <p><strong>Temperature:</strong> ${current.temp_c}°C | <strong>Feels Like:</strong> ${current.feelslike_c}°C</p>
      <p><strong>Humidity:</strong> ${current.humidity}% | <strong>Wind:</strong> ${current.wind_kph} km/h ${current.wind_dir}</p>
      <p><strong>Conditions:</strong> ${current.condition.text}</p>

      <div class="spray-box">
        <h3>🚜 Today's Spray Conditions</h3>
        <p><strong>${sprayConditions}</strong></p>
        <p><small>Delta T: ${(current.temp_c - (current.temp_c * current.humidity / 100)).toFixed(1)}°C | Wind: ${current.wind_kph} km/h</small></p>
      </div>

      <h2>5-Day Forecast</h2>
      ${forecast.map((day: any) => `
        <div class="forecast-day">
          <h4>${new Date(day.date).toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
          <p><strong>${day.day.condition.text}</strong></p>
          <p>High: ${day.day.maxtemp_c}°C | Low: ${day.day.mintemp_c}°C</p>
          <p>Rain Chance: ${day.day.daily_chance_of_rain}% | Rain: ${day.day.totalprecip_mm}mm</p>
          <p>Max Wind: ${day.day.maxwind_kph} km/h</p>
        </div>
      `).join('')}

      <p style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        💡 <strong>Farm Planning Tip:</strong> Review spray windows carefully. Ideal conditions are temperatures 15-25°C,
        winds below 10 km/h, and Delta T between 2-8°C.
      </p>
    </div>

    <div class="footer">
      <p>FarmCast - Your AI-Powered Farm Weather Assistant</p>
      <p>You're receiving this because you subscribed to daily forecasts.</p>
      <p><a href="#" style="color: #60a5fa;">Manage Preferences</a> | <a href="#" style="color: #60a5fa;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
