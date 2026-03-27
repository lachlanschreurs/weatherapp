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

    // Get all subscribers with daily forecast enabled who are in trial or have active subscription
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('*')
      .eq('daily_forecast_enabled', true);

    if (subError) throw subError;

    // Filter to only include users who should receive emails
    const eligibleSubscribers = subscribers?.filter((sub: any) => {
      // In trial and trial not expired
      if (sub.trial_active && sub.trial_end_date && new Date(sub.trial_end_date) > new Date()) {
        return true;
      }
      // No subscription requirement (legacy users or free tier)
      if (!sub.requires_subscription) {
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

    const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    let emailsSent = 0;
    const errors: string[] = [];

    console.log(`Processing ${eligibleSubscribers.length} eligible subscribers`);

    // Send email to each eligible subscriber
    for (const subscriber of eligibleSubscribers) {
      try {
        console.log(`Processing subscriber: ${subscriber.email}`);
        const location = subscriber.location || 'Sydney, Australia';

        // First get coordinates for the location
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${weatherApiKey}`
        );

        if (!geoResponse.ok) {
          const errorMsg = `Failed to geocode location for ${subscriber.email}: ${geoResponse.status}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const geoData = await geoResponse.json();
        if (!geoData || geoData.length === 0) {
          const errorMsg = `Location not found for ${subscriber.email}: ${location}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const { lat, lon, name, country } = geoData[0];

        // Fetch current and forecast weather data
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&cnt=40`
        );

        if (!weatherResponse.ok) {
          const errorMsg = `Failed to fetch weather for ${subscriber.email}: ${weatherResponse.status}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const forecastData = await weatherResponse.json();

        // Get current weather
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
        );

        if (!currentResponse.ok) {
          const errorMsg = `Failed to fetch current weather for ${subscriber.email}: ${currentResponse.status}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const currentData = await currentResponse.json();

        // Transform OpenWeather data to match our email template format
        const weatherData = transformOpenWeatherData(currentData, forecastData, name, country);

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
            from: 'FarmCast <support@farmcastweather.com>',
            to: subscriber.email,
            subject: `Daily Farm Forecast - ${location}`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          emailsSent++;
          console.log(`Successfully sent email to ${subscriber.email}`);
        } else {
          const errorData = await emailResponse.text();
          const errorMsg = `Failed to send email to ${subscriber.email}: ${errorData}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Error processing subscriber ${subscriber.email}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Successfully sent ${emailsSent} emails to subscribers`,
        total: eligibleSubscribers.length,
        sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined
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

function transformOpenWeatherData(current: any, forecast: any, cityName: string, country: string) {
  // Group forecast by day
  const dailyForecasts: any = {};

  forecast.list.forEach((item: any) => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        date,
        temps: [],
        conditions: [],
        humidity: [],
        wind: [],
        rain: 0,
        rainChance: 0
      };
    }

    dailyForecasts[date].temps.push(item.main.temp);
    dailyForecasts[date].conditions.push(item.weather[0].description);
    dailyForecasts[date].humidity.push(item.main.humidity);
    dailyForecasts[date].wind.push(item.wind.speed * 3.6); // Convert m/s to km/h
    if (item.rain && item.rain['3h']) {
      dailyForecasts[date].rain += item.rain['3h'];
    }
    if (item.pop) {
      dailyForecasts[date].rainChance = Math.max(dailyForecasts[date].rainChance, item.pop * 100);
    }
  });

  // Convert to array and calculate daily aggregates
  const forecastDays = Object.values(dailyForecasts).slice(0, 5).map((day: any) => ({
    date: day.date,
    day: {
      maxtemp_c: Math.max(...day.temps),
      mintemp_c: Math.min(...day.temps),
      condition: {
        text: day.conditions[Math.floor(day.conditions.length / 2)]
      },
      daily_chance_of_rain: Math.round(day.rainChance),
      totalprecip_mm: day.rain,
      maxwind_kph: Math.max(...day.wind)
    }
  }));

  return {
    location: {
      name: `${cityName}, ${country}`
    },
    current: {
      temp_c: current.main.temp,
      feelslike_c: current.main.feels_like,
      humidity: current.main.humidity,
      wind_kph: current.wind.speed * 3.6,
      wind_dir: degreesToDirection(current.wind.deg),
      condition: {
        text: current.weather[0].description
      }
    },
    forecast: {
      forecastday: forecastDays
    }
  };
}

function degreesToDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function getSprayConditions(current: any): string {
  const temp = current.temp_c;
  const humidity = current.humidity;
  const windSpeed = current.wind_kph;
  const deltaT = temp - (temp * humidity / 100);

  if (windSpeed > 20) return 'Poor - Wind too strong';
  if (temp < 8 || temp > 30) return 'Poor - Temperature out of range';
  if (deltaT < 2 || deltaT > 10) return 'Poor - Delta T out of range';

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
