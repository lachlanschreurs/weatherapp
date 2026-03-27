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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('*')
      .eq('daily_forecast_enabled', true);

    if (subError) throw subError;

    const eligibleSubscribers = subscribers?.filter((sub: any) => {
      if (sub.trial_active && sub.trial_end_date && new Date(sub.trial_end_date) > new Date()) {
        return true;
      }
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

    for (const subscriber of eligibleSubscribers) {
      try {
        console.log(`Processing subscriber: ${subscriber.email}`);
        const location = subscriber.location || 'Sydney, Australia';

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

        const weatherData = transformOpenWeatherData(currentData, forecastData, name, country);

        const emailHtml = buildDailyForecastEmail(weatherData, forecastData.list);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(subscriber.email)) {
          const errorMsg = `Invalid email format for ${subscriber.email}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

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
    dailyForecasts[date].wind.push(item.wind.speed * 3.6);
    if (item.rain && item.rain['3h']) {
      dailyForecasts[date].rain += item.rain['3h'];
    }
    if (item.pop) {
      dailyForecasts[date].rainChance = Math.max(dailyForecasts[date].rainChance, item.pop * 100);
    }
  });

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
      name: cityName,
      country: country
    },
    current: {
      temp_c: current.main.temp,
      feelslike_c: current.main.feels_like,
      humidity: current.main.humidity,
      wind_kph: current.wind.speed * 3.6,
      wind_degree: current.wind.deg,
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

function calculateDeltaT(tempC: number, humidity: number): number {
  const dewpoint = tempC - ((100 - humidity) / 5);
  const wetBulb = tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
                  Math.atan(tempC + humidity) -
                  Math.atan(humidity - 1.676331) +
                  0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
                  4.686035;

  const deltaT = tempC - wetBulb;
  return Math.max(0, deltaT);
}

function getDeltaTCondition(deltaT: number): { rating: string; color: string; bgColor: string } {
  if (deltaT < 2) return { rating: 'Poor', color: '#dc2626', bgColor: '#fee2e2' };
  if (deltaT >= 2 && deltaT <= 8) return { rating: 'Excellent', color: '#059669', bgColor: '#d1fae5' };
  if (deltaT > 8 && deltaT <= 10) return { rating: 'Good', color: '#10b981', bgColor: '#d1fae5' };
  if (deltaT > 10 && deltaT <= 14) return { rating: 'Marginal', color: '#f59e0b', bgColor: '#fef3c7' };
  return { rating: 'Poor', color: '#dc2626', bgColor: '#fee2e2' };
}

function getSprayCondition(windSpeedKmh: number, rainfallMm: number): { rating: string; color: string; bgColor: string } {
  if (rainfallMm > 0.5) return { rating: 'Poor', color: '#dc2626', bgColor: '#fee2e2' };
  if (windSpeedKmh > 25) return { rating: 'Poor', color: '#dc2626', bgColor: '#fee2e2' };
  if (windSpeedKmh > 15) return { rating: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' };
  return { rating: 'Good', color: '#059669', bgColor: '#d1fae5' };
}

function buildDailyForecastEmail(weatherData: any, hourlyForecast: any[]): string {
  const location = weatherData.location.name;
  const country = weatherData.location.country;
  const current = weatherData.current;
  const forecast = weatherData.forecast.forecastday;

  const deltaT = calculateDeltaT(current.temp_c, current.humidity);
  const deltaTCond = getDeltaTCondition(deltaT);

  const rainToday = forecast[0].day?.totalprecip_mm || 0;
  const sprayCond = getSprayCondition(current.wind_kph, rainToday);

  const rainChance = forecast[0].day?.daily_chance_of_rain || 0;

  const windDir = degreesToDirection(current.wind_degree);

  const next24Hours = hourlyForecast.slice(0, 8);
  let bestSprayWindow = 'No ideal window';
  let bestWindowTime = '';

  for (const hour of next24Hours) {
    const hourDeltaT = calculateDeltaT(hour.main.temp, hour.main.humidity);
    const hourWindSpeed = hour.wind.speed * 3.6;
    if (hourWindSpeed >= 3 && hourWindSpeed <= 15 &&
        hourDeltaT >= 2 && hourDeltaT <= 8 &&
        hour.main.temp >= 8 && hour.main.temp <= 30) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
      bestSprayWindow = 'Ideal';
      bestWindowTime = time;
      break;
    }
  }

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
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 32px 30px 28px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }
    .location-header {
      font-size: 20px;
      font-weight: 600;
      margin-top: 12px;
      margin-bottom: 4px;
    }
    .date-header {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }

    .content {
      background: white;
      padding: 30px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 3px solid #059669;
    }

    .weather-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }

    .weather-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #059669;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .weather-card-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .weather-card-label {
      font-size: 11px;
      color: #065f46;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }

    .weather-card-value {
      font-size: 28px;
      font-weight: 800;
      color: #065f46;
    }

    .weather-card-sub {
      font-size: 13px;
      color: #047857;
      margin-top: 6px;
      font-weight: 600;
    }

    .spray-section {
      margin: 28px 0;
    }

    .spray-grid {
      display: grid;
      gap: 10px;
    }

    .spray-item {
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 2px solid #e5e7eb;
    }

    .spray-item-label {
      font-size: 14px;
      color: #374151;
      font-weight: 700;
    }

    .spray-item-value {
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      color: white;
    }

    .forecast-24h {
      margin: 28px 0;
    }

    .forecast-hours {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .hour-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #059669;
      border-radius: 12px;
      padding: 14px 10px;
      text-align: center;
    }

    .hour-time {
      font-size: 12px;
      color: #065f46;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .hour-icon {
      font-size: 28px;
      margin: 8px 0;
    }

    .hour-temp {
      font-size: 20px;
      font-weight: 800;
      color: #065f46;
      margin: 6px 0;
    }

    .hour-rain {
      font-size: 11px;
      color: #047857;
      font-weight: 700;
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
      font-size: 18px;
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
      <div class="logo">🌾</div>
      <h1>FarmCast Weather</h1>
      <div class="location-header">${location}, ${country}</div>
      <div class="date-header">${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <div class="content">
      <div class="section-title">Current Conditions</div>
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
          <div class="weather-card-value">${rainToday.toFixed(1)}mm</div>
          <div class="weather-card-sub">${rainChance}% Chance</div>
        </div>

        <div class="weather-card">
          <div class="weather-card-icon">💨</div>
          <div class="weather-card-label">Wind Speed</div>
          <div class="weather-card-value">${Math.round(current.wind_kph)} km/h</div>
          <div class="weather-card-sub">${windDir} Direction</div>
        </div>

        <div class="weather-card">
          <div class="weather-card-icon">💦</div>
          <div class="weather-card-label">Humidity</div>
          <div class="weather-card-value">${current.humidity}%</div>
          <div class="weather-card-sub">${current.condition.text}</div>
        </div>
      </div>

      <div class="spray-section">
        <div class="section-title">Spray Window Analysis</div>
        <div class="spray-grid">
          <div class="spray-item">
            <span class="spray-item-label">Spray Conditions</span>
            <span class="spray-item-value" style="background: ${sprayCond.color};">${sprayCond.rating}</span>
          </div>
          <div class="spray-item">
            <span class="spray-item-label">Delta T</span>
            <span class="spray-item-value" style="background: ${deltaTCond.color};">${deltaT.toFixed(1)}°C - ${deltaTCond.rating}</span>
          </div>
          <div class="spray-item">
            <span class="spray-item-label">Best Spray Window</span>
            <span class="spray-item-value" style="background: ${bestSprayWindow === 'Ideal' ? '#059669' : '#6b7280'};">
              ${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor conditions'}
            </span>
          </div>
        </div>
      </div>

      <div class="forecast-24h">
        <div class="section-title">24-Hour Forecast</div>
        <div class="forecast-hours">
          ${next24Hours.map((hour: any, idx: number) => {
            const hourTime = new Date(hour.dt * 1000);
            const timeStr = hourTime.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
            const temp = Math.round(hour.main.temp);
            const rainProb = Math.round((hour.pop || 0) * 100);
            const weatherMain = hour.weather[0]?.main || 'Clear';
            const icon = weatherMain === 'Rain' ? '🌧️' :
                        weatherMain === 'Clouds' ? '⛅' :
                        weatherMain === 'Clear' ? '☀️' : '🌤️';

            return `
              <div class="hour-card">
                <div class="hour-time">${timeStr}</div>
                <div class="hour-icon">${icon}</div>
                <div class="hour-temp">${temp}°</div>
                <div class="hour-rain">${rainProb}% Rain</div>
              </div>
            `;
          }).slice(0, 8).join('')}
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">FarmCast Weather</div>
      <p>AI-Powered Agricultural Weather Intelligence</p>
      <p style="margin-top: 12px;">Daily forecasts for ${location}</p>
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
