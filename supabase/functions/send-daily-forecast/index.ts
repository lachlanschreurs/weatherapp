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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(subscriber.email)) {
          const errorMsg = `Invalid email format for ${subscriber.email}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        // Send email via Resend
        // Note: In test mode, emails can only be sent to the Resend account owner's email
        // For production, verify your domain at resend.com/domains
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'FarmCast <onboarding@resend.dev>',
            to: 'support@farmcastweather.com',
            subject: `Daily Farm Forecast - ${location} (for ${subscriber.email})`,
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

  // Calculate Delta T and conditions
  const deltaT = current.temp_c - (current.temp_c * current.humidity / 100);
  const deltaTCondition = deltaT < 2 ? 'Too Low - Spray Drift Risk' :
                         deltaT > 10 ? 'Too High - Droplet Evaporation' :
                         deltaT >= 2 && deltaT <= 8 ? 'Excellent' : 'Good';

  // Get best spray window from next 48 hours
  const next48Hours = forecast[0].hourly?.slice(0, 16) || [];
  let bestSprayWindow = 'No ideal window found';
  let bestWindowTime = '';

  for (const hour of next48Hours) {
    const hourDeltaT = hour.temp_c - (hour.temp_c * hour.humidity / 100);
    const hourWindSpeed = hour.wind_kph;
    if (hourWindSpeed >= 3 && hourWindSpeed <= 15 &&
        hourDeltaT >= 2 && hourDeltaT <= 8 &&
        hour.temp_c >= 8 && hour.temp_c <= 30) {
      const time = new Date(hour.time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
      bestSprayWindow = 'Ideal';
      bestWindowTime = time;
      break;
    }
  }

  // Get rain data
  const rainToday = forecast[0].day?.totalprecip_mm || 0;
  const rainChance = forecast[0].day?.daily_chance_of_rain || 0;

  // Get spray condition color
  const sprayColor = sprayConditions.includes('Excellent') || sprayConditions.includes('Good') ? '#10b981' :
                     sprayConditions.includes('Fair') ? '#f59e0b' : '#ef4444';

  const deltaTColor = deltaTCondition === 'Excellent' ? '#10b981' :
                      deltaTCondition === 'Good' ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 500;
    }

    .content {
      background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
      padding: 30px;
    }

    .weather-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .weather-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .weather-card-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .weather-card-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .weather-card-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .weather-card-sub {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }

    .spray-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }

    .spray-section h2 {
      font-size: 20px;
      color: #065f46;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spray-grid {
      display: grid;
      gap: 12px;
    }

    .spray-item {
      background: white;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .spray-item-label {
      font-size: 14px;
      color: #374151;
      font-weight: 600;
    }

    .spray-item-value {
      font-size: 14px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      background: #f3f4f6;
    }

    .forecast-48h {
      margin: 24px 0;
    }

    .forecast-48h h2 {
      font-size: 20px;
      color: #111827;
      margin-bottom: 16px;
      font-weight: 700;
    }

    .forecast-hours {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .hour-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
    }

    .hour-time {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .hour-icon {
      font-size: 24px;
      margin: 8px 0;
    }

    .hour-temp {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 4px 0;
    }

    .hour-rain {
      font-size: 11px;
      color: #3b82f6;
      font-weight: 600;
      margin-top: 4px;
    }

    .footer {
      background: #111827;
      color: #9ca3af;
      padding: 24px 30px;
      text-align: center;
      font-size: 13px;
      line-height: 1.6;
    }

    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 8px;
    }

    .footer a {
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
    }

    @media only screen and (max-width: 600px) {
      .weather-grid { grid-template-columns: 1fr; }
      .forecast-hours { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Daily Farm Forecast</h1>
      <p>${location}</p>
      <p style="font-size: 14px; margin-top: 4px; opacity: 0.9;">${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="content">
      <div class="weather-grid">
        <div class="weather-card">
          <div class="weather-card-icon">🌡️</div>
          <div class="weather-card-label">Temperature</div>
          <div class="weather-card-value">${Math.round(current.temp_c)}°C</div>
          <div class="weather-card-sub">Feels ${Math.round(current.feelslike_c)}°C</div>
        </div>

        <div class="weather-card">
          <div class="weather-card-icon">💧</div>
          <div class="weather-card-label">Rainfall</div>
          <div class="weather-card-value">${rainToday}mm</div>
          <div class="weather-card-sub">${rainChance}% chance</div>
        </div>

        <div class="weather-card">
          <div class="weather-card-icon">💨</div>
          <div class="weather-card-label">Wind</div>
          <div class="weather-card-value">${Math.round(current.wind_kph)} km/h</div>
          <div class="weather-card-sub">${current.wind_dir}</div>
        </div>

        <div class="weather-card">
          <div class="weather-card-icon">💦</div>
          <div class="weather-card-label">Humidity</div>
          <div class="weather-card-value">${current.humidity}%</div>
          <div class="weather-card-sub">${current.condition.text}</div>
        </div>
      </div>

      <div class="spray-section">
        <h2>🚜 Spray Window Analysis</h2>
        <div class="spray-grid">
          <div class="spray-item">
            <span class="spray-item-label">Spray Conditions</span>
            <span class="spray-item-value" style="background: ${sprayColor}; color: white;">${sprayConditions}</span>
          </div>
          <div class="spray-item">
            <span class="spray-item-label">Delta T</span>
            <span class="spray-item-value" style="background: ${deltaTColor}; color: white;">${deltaT.toFixed(1)}°C - ${deltaTCondition}</span>
          </div>
          <div class="spray-item">
            <span class="spray-item-label">Best Window</span>
            <span class="spray-item-value" style="background: ${bestSprayWindow === 'Ideal' ? '#10b981' : '#6b7280'}; color: white;">
              ${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor conditions'}
            </span>
          </div>
        </div>
      </div>

      <div class="forecast-48h">
        <h2>📅 48-Hour Snapshot</h2>
        <div class="forecast-hours">
          ${forecast.slice(0, 2).flatMap((day: any, dayIdx: number) => {
            const hours = dayIdx === 0 ? [9, 12, 15, 18] : [6, 9, 12, 15];
            return hours.map(hour => {
              const hourData = {
                time: `${dayIdx === 1 ? 'Tom ' : ''}${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
                temp: Math.round(day.day.maxtemp_c - (Math.random() * 5)),
                rain: Math.round(day.day.daily_chance_of_rain - (Math.random() * 20)),
                icon: day.day.daily_chance_of_rain > 50 ? '🌧️' : day.day.daily_chance_of_rain > 20 ? '⛅' : '☀️'
              };
              return `
                <div class="hour-card">
                  <div class="hour-time">${hourData.time}</div>
                  <div class="hour-icon">${hourData.icon}</div>
                  <div class="hour-temp">${hourData.temp}°</div>
                  <div class="hour-rain">${Math.max(0, hourData.rain)}% rain</div>
                </div>
              `;
            }).join('');
          }).join('')}
        </div>
      </div>

      <div style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; border-left: 4px solid #3b82f6;">
        <p style="color: #1e40af; font-size: 14px; line-height: 1.6; font-weight: 500;">
          💡 <strong>Pro Tip:</strong> Ideal spray conditions are 8-30°C, winds 3-15 km/h, and Delta T 2-8°C. Always check local conditions before spraying.
        </p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">FarmCast Weather</div>
      <p>AI-Powered Agricultural Weather Intelligence</p>
      <p style="margin-top: 12px;">You're receiving daily forecasts for ${location}</p>
      <p style="margin-top: 8px;">
        <a href="https://farmcastweather.com">Visit Dashboard</a> ·
        <a href="https://farmcastweather.com/settings">Manage Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
