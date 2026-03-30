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

    console.log(`Starting to process ${eligibleSubscribers.length} eligible subscribers`);

    // Process emails asynchronously in the background
    processEmailsInBackground(eligibleSubscribers, resendApiKey, weatherApiKey, supabaseAdmin);

    // Return immediately
    return new Response(
      JSON.stringify({
        message: `Processing ${eligibleSubscribers.length} daily forecast emails`,
        total: eligibleSubscribers.length
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

async function processEmailsInBackground(eligibleSubscribers: any[], resendApiKey: string, weatherApiKey: string, supabaseAdmin: any) {
  let emailsSent = 0;
  const errors: string[] = [];

  console.log(`Processing ${eligibleSubscribers.length} eligible subscribers`);

  try {
    for (const subscriber of eligibleSubscribers) {
      try {
        console.log(`Processing subscriber: ${subscriber.email}`);

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
          } else if (subscriber.location && subscriber.location !== 'Sydney, Australia') {
            location = subscriber.location;
          }
        } else if (subscriber.location && subscriber.location !== 'Sydney, Australia') {
          location = subscriber.location;
        }

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

        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&cnt=40`
        );

        if (!forecastResponse.ok) {
          const errorMsg = `Failed to fetch weather for ${subscriber.email}: ${forecastResponse.status}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const forecastData = await forecastResponse.json();

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

        const weatherData = transformForecastData(currentData, forecastData, name, country);

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
            from: 'FarmCast Weather <onboarding@resend.dev>',
            to: subscriber.email,
            subject: `Daily Farm Forecast - ${name}`,
            html: emailHtml,
            text: buildDailyForecastEmailText(weatherData, forecastData.list, name, country),
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

    console.log(`Successfully sent ${emailsSent} emails, ${errors.length} errors`);
  } catch (error) {
    console.error('Error in background email processing:', error);
  }
}

function transformForecastData(current: any, forecast: any, cityName: string, country: string) {
  const dailyForecasts: any = {};
  const today = new Date().toISOString().split('T')[0];

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
        rainChance: 0,
        isToday: date === today
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

  const forecastDays = Object.values(dailyForecasts).slice(0, 5).map((day: any) => {
    const temps = day.temps;

    return {
      date: day.date,
      day: {
        maxtemp_c: Math.max(...temps),
        mintemp_c: Math.min(...temps),
        condition: {
          text: day.conditions[Math.floor(day.conditions.length / 2)]
        },
        daily_chance_of_rain: Math.round(day.rainChance),
        totalprecip_mm: day.rain,
        maxwind_kph: Math.max(...day.wind)
      }
    };
  });

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

  const todayForecast = forecast[0].day;
  const highTemp = todayForecast?.maxtemp_c || 0;
  const lowTemp = todayForecast?.mintemp_c || 0;
  const rainToday = todayForecast?.totalprecip_mm || 0;
  const rainChance = todayForecast?.daily_chance_of_rain || 0;
  const sprayCond = getSprayCondition(current.wind_kph, rainToday);

  const windDir = degreesToDirection(current.wind_degree);

  const next24Hours = hourlyForecast.slice(0, 8);
  let bestSprayWindow = 'No ideal window';
  let bestWindowTime = '';

  const rainPeriods: string[] = [];
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

    if ((hour.pop || 0) > 0.3) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
      const prob = Math.round((hour.pop || 0) * 100);
      rainPeriods.push(`${time} (${prob}%)`);
    }
  }

  const rainTimingText = rainPeriods.length > 0
    ? `Expected around: ${rainPeriods.slice(0, 3).join(', ')}`
    : 'No significant rain expected in next 24 hours';

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
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      padding: 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      color: white;
      padding: 24px 24px 20px;
      text-align: center;
    }
    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 12px;
    }
    .brand-name {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: white;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: #047857;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .location-title {
      font-size: 18px;
      font-weight: 600;
      margin-top: 8px;
      opacity: 0.95;
    }
    .date-subtitle {
      font-size: 13px;
      opacity: 0.85;
      margin-top: 4px;
    }

    .content {
      padding: 24px;
    }

    .current-conditions {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .conditions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .condition-item {
      text-align: center;
    }

    .condition-icon {
      font-size: 32px;
      margin-bottom: 6px;
    }

    .condition-label {
      font-size: 11px;
      color: #065f46;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .condition-value {
      font-size: 24px;
      font-weight: 800;
      color: #047857;
      line-height: 1.2;
    }

    .condition-sub {
      font-size: 12px;
      color: #059669;
      margin-top: 2px;
      font-weight: 600;
    }

    .section-header {
      font-size: 16px;
      font-weight: 800;
      color: #047857;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 3px solid #047857;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .spray-analysis {
      margin-bottom: 20px;
    }

    .spray-metrics {
      display: grid;
      gap: 10px;
    }

    .spray-metric {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric-label {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }

    .metric-badge {
      font-size: 12px;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 6px;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .forecast-section {
      margin-bottom: 20px;
    }

    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .forecast-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #047857;
      border-radius: 8px;
      padding: 12px 8px;
      text-align: center;
    }

    .forecast-time {
      font-size: 11px;
      color: #065f46;
      font-weight: 800;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .forecast-icon {
      font-size: 28px;
      margin: 6px 0;
    }

    .forecast-temp {
      font-size: 18px;
      font-weight: 800;
      color: #047857;
      margin: 4px 0;
    }

    .forecast-rain {
      font-size: 10px;
      color: #059669;
      font-weight: 700;
      margin-top: 4px;
    }

    .footer {
      background: #111827;
      color: #9ca3af;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
    }

    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 6px;
    }

    .footer a {
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
    }

    @media only screen and (max-width: 600px) {
      .conditions-grid { grid-template-columns: 1fr; gap: 12px; }
      .forecast-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-name">FarmCast</div>
        <div class="logo-icon">🌱</div>
      </div>
      <div class="location-title">${location}, ${country}</div>
      <div class="date-subtitle">${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <div class="content">
      <div class="current-conditions">
        <div class="section-header">Today's Forecast</div>
        <div class="conditions-grid">
          <div class="condition-item">
            <div class="condition-icon">📈</div>
            <div class="condition-label">Today's High</div>
            <div class="condition-value">${Math.round(highTemp)}°C</div>
            <div class="condition-sub">Maximum</div>
          </div>

          <div class="condition-item">
            <div class="condition-icon">📉</div>
            <div class="condition-label">Today's Low</div>
            <div class="condition-value">${Math.round(lowTemp)}°C</div>
            <div class="condition-sub">Minimum</div>
          </div>

          <div class="condition-item">
            <div class="condition-icon">💧</div>
            <div class="condition-label">Rain Expected</div>
            <div class="condition-value">${rainToday.toFixed(1)}mm</div>
            <div class="condition-sub">${rainChance}% Chance</div>
          </div>

          <div class="condition-item">
            <div class="condition-icon">💨</div>
            <div class="condition-label">Wind</div>
            <div class="condition-value">${Math.round(current.wind_kph)} km/h</div>
            <div class="condition-sub">${windDir}</div>
          </div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; margin-bottom: 4px;">
          💧 Total Rainfall Expected
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; margin-bottom: 6px;">
          ${rainToday.toFixed(1)}mm
        </div>
        <div style="font-size: 12px; color: #1e40af; font-weight: 600;">
          ⏰ ${rainTimingText}
        </div>
      </div>

      <div class="spray-analysis">
        <div class="section-header">Spray Window Analysis</div>
        <div class="spray-metrics">
          <div class="spray-metric">
            <span class="metric-label">Spray Conditions</span>
            <span class="metric-badge" style="background: ${sprayCond.color};">${sprayCond.rating}</span>
          </div>
          <div class="spray-metric">
            <span class="metric-label">Delta T</span>
            <span class="metric-badge" style="background: ${deltaTCond.color};">${deltaT.toFixed(1)}°C - ${deltaTCond.rating}</span>
          </div>
          <div class="spray-metric">
            <span class="metric-label">Best Window Today</span>
            <span class="metric-badge" style="background: ${bestSprayWindow === 'Ideal' ? '#047857' : '#6b7280'};">
              ${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor'}
            </span>
          </div>
        </div>
      </div>

      <div class="forecast-section">
        <div class="section-header">24-Hour Forecast</div>
        <div class="forecast-grid">
          ${next24Hours.map((hour: any) => {
            const hourTime = new Date(hour.dt * 1000);
            const timeStr = hourTime.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
            const temp = Math.round(hour.main.temp);
            const rainProb = Math.round((hour.pop || 0) * 100);
            const weatherMain = hour.weather[0]?.main || 'Clear';
            const icon = weatherMain === 'Rain' ? '🌧️' :
                        weatherMain === 'Clouds' ? '⛅' :
                        weatherMain === 'Clear' ? '☀️' : '🌤️';

            return `
              <div class="forecast-card">
                <div class="forecast-time">${timeStr}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">${temp}°</div>
                <div class="forecast-rain">${rainProb}% Rain</div>
              </div>
            `;
          }).slice(0, 8).join('')}
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">FarmCast Weather</div>
      <p>Agricultural Weather Intelligence</p>
      <p style="margin-top: 10px; font-size: 11px;">
        <a href="https://farmcastweather.com">Visit Dashboard</a> ·
        <a href="https://farmcastweather.com/settings">Manage Preferences</a> ·
        <a href="https://farmcastweather.com/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top: 10px; font-size: 10px;">
        FarmCast Weather Services<br>
        Sent to subscribers of daily weather forecasts
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildDailyForecastEmailText(weatherData: any, hourlyForecast: any[], cityName: string, country: string): string {
  const current = weatherData.current;
  const forecast = weatherData.forecast.forecastday;

  const deltaT = calculateDeltaT(current.temp_c, current.humidity);
  const deltaTCond = getDeltaTCondition(deltaT);

  const todayForecast = forecast[0].day;
  const highTemp = todayForecast?.maxtemp_c || 0;
  const lowTemp = todayForecast?.mintemp_c || 0;
  const rainToday = todayForecast?.totalprecip_mm || 0;
  const rainChance = todayForecast?.daily_chance_of_rain || 0;
  const sprayCond = getSprayCondition(current.wind_kph, rainToday);

  const windDir = degreesToDirection(current.wind_degree);

  const next24Hours = hourlyForecast.slice(0, 8);
  let bestSprayWindow = 'No ideal window';
  let bestWindowTime = '';

  const rainPeriods: string[] = [];
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

    if ((hour.pop || 0) > 0.3) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
      const prob = Math.round((hour.pop || 0) * 100);
      rainPeriods.push(`${time} (${prob}%)`);
    }
  }

  const rainTimingText = rainPeriods.length > 0
    ? `Expected around: ${rainPeriods.slice(0, 3).join(', ')}`
    : 'No significant rain expected in next 24 hours';

  return `
FARMCAST DAILY FORECAST
${cityName}, ${country}
${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

TODAY'S FORECAST:
- Current Temperature: ${Math.round(current.temp_c)}°C (Feels like ${Math.round(current.feelslike_c)}°C)
- High / Low: ${Math.round(highTemp)}°C / ${Math.round(lowTemp)}°C
- Rain Expected: ${rainToday.toFixed(1)}mm (${rainChance}% chance)
- Rain Timing: ${rainTimingText}
- Wind: ${Math.round(current.wind_kph)} km/h ${windDir}
- Humidity: ${current.humidity}%

SPRAY WINDOW ANALYSIS:
- Spray Conditions: ${sprayCond.rating}
- Delta T: ${deltaT.toFixed(1)}°C - ${deltaTCond.rating}
- Best Window Today: ${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor conditions'}

24-HOUR FORECAST:
${next24Hours.slice(0, 8).map((hour: any) => {
  const hourTime = new Date(hour.dt * 1000);
  const timeStr = hourTime.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
  const temp = Math.round(hour.main.temp);
  const rainProb = Math.round((hour.pop || 0) * 100);
  const weatherMain = hour.weather[0]?.main || 'Clear';
  return `${timeStr}: ${temp}°C, ${weatherMain}, ${rainProb}% rain`;
}).join('\n')}

Visit your dashboard: https://farmcastweather.com
Manage preferences: https://farmcastweather.com/settings
Unsubscribe: https://farmcastweather.com/unsubscribe

FarmCast Weather Services
Sent to subscribers of daily weather forecasts
  `.trim();
}
