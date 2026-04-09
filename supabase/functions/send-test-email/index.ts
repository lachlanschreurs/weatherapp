import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const weatherApiKey = Deno.env.get('FARMCAST_OPENWEATHER_STARTUP_KEY');
    if (!weatherApiKey) throw new Error('Weather API key not configured');

    const testEmail = 'lachlan@schreurs.com.au';
    const location = 'Tatura, AU';

    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${weatherApiKey}`
    );
    if (!geoResponse.ok) throw new Error(`Geocode failed: ${geoResponse.status}`);
    const geoData = await geoResponse.json();
    if (!geoData || geoData.length === 0) throw new Error(`Location not found: ${location}`);

    const { lat, lon, name, country } = geoData[0];

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&cnt=40`),
    ]);

    if (!currentRes.ok) throw new Error(`Current weather failed: ${currentRes.status}`);
    if (!forecastRes.ok) throw new Error(`Forecast failed: ${forecastRes.status}`);

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    const weatherData = transformWeather(currentData, forecastData, name, country);
    const hourly = buildHourly(forecastData);
    const html = buildEmail(weatherData, hourly);

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'FarmCast Weather <support@mail.farmcastweather.com>',
        to: testEmail,
        subject: `[TEST] Daily Farm Forecast - ${name}`,
        html,
      }),
    });

    const emailResult = await emailRes.json();

    return new Response(JSON.stringify({ success: emailRes.ok, result: emailResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildHourly(forecastData: any): any[] {
  return (forecastData.list || []).slice(0, 24).map((item: any) => ({
    dt: item.dt,
    temp: item.main.temp,
    humidity: item.main.humidity,
    wind_speed: item.wind.speed,
    wind_deg: item.wind.deg,
    pop: item.pop || 0,
    weather: item.weather,
  }));
}

function transformWeather(currentData: any, forecastData: any, cityName: string, country: string) {
  const list = forecastData.list || [];
  const dayMap: Record<string, any[]> = {};
  for (const item of list) {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!dayMap[date]) dayMap[date] = [];
    dayMap[date].push(item);
  }

  const forecastDays = Object.entries(dayMap).slice(0, 8).map(([date, items]) => {
    const temps = items.map((i: any) => i.main.temp);
    const rain = items.reduce((s: number, i: any) => s + (i.rain?.['3h'] || 0), 0);
    const maxPop = Math.max(...items.map((i: any) => i.pop || 0));
    const maxWind = Math.max(...items.map((i: any) => (i.wind?.speed || 0) * 3.6));
    const mid = items[Math.floor(items.length / 2)] || items[0];
    return {
      date,
      hour: items.map((i: any) => ({ humidity: i.main.humidity, wind_deg: i.wind?.deg || 0 })),
      day: {
        maxtemp_c: Math.max(...temps),
        mintemp_c: Math.min(...temps),
        condition: { text: mid.weather[0].description },
        daily_chance_of_rain: Math.round(maxPop * 100),
        totalprecip_mm: rain,
        maxwind_kph: maxWind,
      },
    };
  });

  return {
    location: { name: cityName, country },
    current: {
      temp_c: currentData.main.temp,
      humidity: currentData.main.humidity,
      wind_kph: (currentData.wind?.speed || 0) * 3.6,
      wind_degree: currentData.wind?.deg || 0,
      condition: { text: currentData.weather[0].description },
    },
    forecast: { forecastday: forecastDays },
  };
}

function degreesToDirection(d: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(d / 22.5) % 16];
}

function calcDeltaT(temp: number, humidity: number): number {
  const wb = temp * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(temp + humidity) - Math.atan(humidity - 1.676331) +
    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) - 4.686035;
  return Math.max(0, temp - wb);
}

function deltaTRating(dt: number): { rating: string; color: string } {
  if (dt < 2) return { rating: 'Poor', color: '#dc2626' };
  if (dt <= 8) return { rating: 'Excellent', color: '#16a34a' };
  if (dt <= 10) return { rating: 'Good', color: '#10b981' };
  if (dt <= 14) return { rating: 'Marginal', color: '#d97706' };
  return { rating: 'Poor', color: '#dc2626' };
}

function sprayWindowForDay(wind: number, rain: number, dt: number): string {
  if (rain > 5 || wind > 25) return '❌';
  if (wind >= 3 && wind <= 15 && dt >= 2 && dt <= 8) return '✅';
  if (wind < 3 || wind > 20 || dt < 2 || dt > 10) return '⚠️';
  return '✓';
}

function buildEmail(weatherData: any, hourly: any[]): string {
  const { name: loc, country } = weatherData.location;
  const cur = weatherData.current;
  const forecast = weatherData.forecast.forecastday;
  const today = forecast[0].day;

  const highTemp = Math.round(today.maxtemp_c);
  const lowTemp = Math.round(today.mintemp_c);
  const rainMm = today.totalprecip_mm;
  const rainChance = today.daily_chance_of_rain;
  const windDir = degreesToDirection(cur.wind_degree);
  const dt = calcDeltaT(cur.temp_c, cur.humidity);
  const dtCond = deltaTRating(dt);

  let bestWindow = 'Monitor';
  let bestColor = '#64748b';
  const rainPeriods: string[] = [];

  for (const h of hourly) {
    const hdt = calcDeltaT(h.temp, h.humidity);
    const hwind = h.wind_speed * 3.6;
    if (hwind >= 3 && hwind <= 15 && hdt >= 2 && hdt <= 8 && h.temp >= 8 && h.temp <= 30) {
      bestWindow = new Date(h.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
      bestColor = '#16a34a';
      break;
    }
    if ((h.pop || 0) > 0.3) {
      const t = new Date(h.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
      rainPeriods.push(`${t} (${Math.round((h.pop || 0) * 100)}%)`);
    }
  }

  const rainTiming = rainPeriods.length > 0
    ? `Expected around: ${rainPeriods.slice(0, 3).join(', ')}`
    : 'No significant rain expected in next 24 hours';

  const fiveDays = forecast.slice(0, 5).map((d: any) => {
    const date = new Date(d.date);
    const avgWind = d.day.maxwind_kph;
    const avgTemp = (d.day.maxtemp_c + d.day.mintemp_c) / 2;
    const avgHum = d.hour?.[12]?.humidity || 60;
    const sprayDt = calcDeltaT(avgTemp, avgHum);
    return {
      dayName: date.toLocaleDateString('en-AU', { weekday: 'short' }),
      date: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      high: Math.round(d.day.maxtemp_c),
      low: Math.round(d.day.mintemp_c),
      rain: d.day.totalprecip_mm.toFixed(1),
      rainChance: d.day.daily_chance_of_rain,
      wind: Math.round(avgWind),
      windDir: degreesToDirection(d.hour?.[12]?.wind_deg || 0),
      spray: sprayWindowForDay(avgWind, d.day.totalprecip_mm, sprayDt),
    };
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f172a;padding:24px 16px;line-height:1.5;}
.container{max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.8);border:1px solid #334155;}
.header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-bottom:1px solid #334155;padding:28px 28px 24px;text-align:center;}
.logo-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px;}
.logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;}
.brand-name{font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;}
.brand-tag{font-size:11px;font-weight:600;color:#4ade80;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;}
.location-pill{display:inline-block;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.25);border-radius:999px;padding:6px 18px;font-size:14px;font-weight:700;color:#86efac;margin-bottom:6px;}
.date-line{font-size:12px;color:#64748b;font-weight:500;}
.content{padding:24px;}
.section-label{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#4ade80;margin-bottom:12px;}
.card{background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;margin-bottom:16px;}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.stat-cell{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;text-align:center;}
.stat-icon{font-size:22px;margin-bottom:6px;}
.stat-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px;}
.stat-value{font-size:26px;font-weight:800;line-height:1.1;}
.stat-sub{font-size:11px;color:#94a3b8;margin-top:3px;font-weight:500;}
.rain-card{background:linear-gradient(135deg,#0c1a2e 0%,#0f172a 100%);border:1px solid #1d4ed8;border-radius:10px;padding:16px;margin-bottom:16px;}
.rain-label{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#60a5fa;margin-bottom:6px;}
.rain-value{font-size:28px;font-weight:800;color:#93c5fd;margin-bottom:4px;}
.rain-timing{font-size:12px;color:#60a5fa;font-weight:600;}
.ops-row{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.ops-label{font-size:13px;font-weight:600;color:#cbd5e1;}
.badge{font-size:11px;font-weight:800;padding:5px 12px;border-radius:6px;color:white;text-transform:uppercase;letter-spacing:0.5px;}
.ft{width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #334155;}
.ft thead tr{background:#0f172a;}
.ft th{padding:10px 8px;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#4ade80;font-size:10px;border-bottom:1px solid #334155;}
.ft th:first-child{text-align:left;padding-left:14px;}
.ft td{padding:11px 8px;border-bottom:1px solid #1e293b;vertical-align:middle;}
.ft td:first-child{padding-left:14px;}
.ft tr:last-child td{border-bottom:none;}
.ft tr:nth-child(odd){background:#1e293b;}
.ft tr:nth-child(even){background:#172033;}
.footer{background:#0a0f1a;border-top:1px solid #1e293b;color:#475569;padding:20px 24px;text-align:center;font-size:11px;}
.footer-brand{font-size:15px;font-weight:800;color:#4ade80;letter-spacing:-0.3px;margin-bottom:4px;}
.footer a{color:#4ade80;text-decoration:none;font-weight:600;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo-row">
      <div class="logo-icon">🌱</div>
      <span class="brand-name">FarmCast</span>
    </div>
    <div class="brand-tag">Daily Farm Intelligence</div>
    <div class="location-pill">${loc}, ${country}</div>
    <div class="date-line" style="margin-top:8px;">${new Date().toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
  </div>

  <div class="content">
    <div class="section-label">Today's Forecast</div>
    <div class="card">
      <div class="stat-grid">
        <div class="stat-cell">
          <div class="stat-icon">🌡️</div>
          <div class="stat-label">High</div>
          <div class="stat-value" style="color:#fca5a5;">${highTemp}°C</div>
          <div class="stat-sub">Maximum</div>
        </div>
        <div class="stat-cell">
          <div class="stat-icon">🌡️</div>
          <div class="stat-label">Low</div>
          <div class="stat-value" style="color:#93c5fd;">${lowTemp}°C</div>
          <div class="stat-sub">Minimum</div>
        </div>
        <div class="stat-cell">
          <div class="stat-icon">💧</div>
          <div class="stat-label">Rain Expected</div>
          <div class="stat-value" style="color:#7dd3fc;">${rainMm.toFixed(1)}mm</div>
          <div class="stat-sub">${rainChance}% chance</div>
        </div>
        <div class="stat-cell">
          <div class="stat-icon">💨</div>
          <div class="stat-label">Wind</div>
          <div class="stat-value" style="color:#86efac;">${Math.round(cur.wind_kph)}</div>
          <div class="stat-sub">km/h ${windDir}</div>
        </div>
      </div>
    </div>

    <div class="rain-card">
      <div class="rain-label">Rainfall Timing</div>
      <div class="rain-value">${rainMm.toFixed(1)}mm</div>
      <div class="rain-timing">${rainTiming}</div>
    </div>

    <div class="section-label">Farm Operations</div>
    <div style="margin-bottom:16px;">
      <div class="ops-row">
        <span class="ops-label">Best Spray Window</span>
        <span class="badge" style="background:${bestColor};">${bestWindow}</span>
      </div>
      <div class="ops-row">
        <span class="ops-label">Delta T Index</span>
        <span class="badge" style="background:${dtCond.color};">${dt.toFixed(1)}°C &mdash; ${dtCond.rating}</span>
      </div>
    </div>

    <div class="section-label">5-Day Forecast</div>
    <table class="ft">
      <thead>
        <tr>
          <th>Day</th>
          <th>Temp</th>
          <th>Rain</th>
          <th>Wind</th>
          <th>Spray</th>
        </tr>
      </thead>
      <tbody>
        ${fiveDays.map((d: any) => `
        <tr>
          <td>
            <div style="font-size:13px;font-weight:800;color:#e2e8f0;">${d.dayName}</div>
            <div style="font-size:10px;color:#64748b;font-weight:600;margin-top:2px;">${d.date}</div>
          </td>
          <td style="text-align:center;">
            <div style="font-size:14px;font-weight:800;color:#fca5a5;">${d.high}°</div>
            <div style="font-size:11px;font-weight:700;color:#93c5fd;margin-top:2px;">${d.low}°</div>
          </td>
          <td style="text-align:center;">
            <div style="font-size:13px;font-weight:800;color:#7dd3fc;">${d.rain}mm</div>
            <div style="font-size:10px;font-weight:600;color:#64748b;margin-top:2px;">${d.rainChance}%</div>
          </td>
          <td style="text-align:center;">
            <div style="font-size:12px;font-weight:700;color:#86efac;">${d.wind} km/h</div>
            <div style="font-size:10px;font-weight:600;color:#64748b;margin-top:2px;">${d.windDir}</div>
          </td>
          <td style="text-align:center;font-size:18px;">${d.spray}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top:8px;font-size:10px;color:#475569;text-align:center;font-weight:600;">
      Spray: ✅ Ideal &nbsp;·&nbsp; ✓ Good &nbsp;·&nbsp; ⚠️ Marginal &nbsp;·&nbsp; ❌ Poor
    </div>
  </div>

  <div class="footer">
    <div class="footer-brand">FarmCast Weather</div>
    <p style="margin-bottom:10px;">Agricultural Weather Intelligence</p>
    <p>
      <a href="https://farmcastweather.com">Dashboard</a> &nbsp;·&nbsp;
      <a href="https://farmcastweather.com/settings">Preferences</a> &nbsp;·&nbsp;
      <a href="https://farmcastweather.com/unsubscribe">Unsubscribe</a>
    </p>
    <p style="margin-top:12px;font-size:10px;color:#334155;">
      FarmCast Weather Services &mdash; $2.99/month, cancel anytime.
    </p>
  </div>
</div>
</body>
</html>`;
}
