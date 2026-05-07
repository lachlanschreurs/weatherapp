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
    const location = 'Middle Tarwin, AU';

    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${weatherApiKey}`
    );
    if (!geoResponse.ok) throw new Error(`Geocode failed: ${geoResponse.status}`);
    const geoData = await geoResponse.json();
    if (!geoData || geoData.length === 0) throw new Error(`Location not found: ${location}`);

    const { lat, lon, name, country } = geoData[0];

    const [currentRes, forecastRes, dailyRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&cnt=40`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&cnt=5`),
    ]);

    if (!currentRes.ok) throw new Error(`Current weather failed: ${currentRes.status}`);
    if (!forecastRes.ok) throw new Error(`Forecast failed: ${forecastRes.status}`);

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();
    const dailyData = dailyRes.ok ? await dailyRes.json() : null;

    const weatherData = transformWeather(currentData, forecastData, name, country, currentData.timezone, dailyData);
    const hourly = buildHourly(forecastData);

    let probeHtml = '';
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', testEmail)
      .maybeSingle();

    if (profile?.id) {
      probeHtml = await generateProbeReport(profile.id, supabaseAdmin, weatherData);
    }

    const html = buildEmail(weatherData, hourly, probeHtml);

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'FarmCast Weather <support@mail.farmcastweather.com>',
        to: testEmail,
        subject: `Daily Farm Forecast - ${name}`,
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
  const nowTs = Math.floor(Date.now() / 1000);
  return (forecastData.list || [])
    .filter((item: any) => item.dt >= nowTs)
    .slice(0, 24)
    .map((item: any) => ({
      dt: item.dt,
      temp: item.main.temp,
      feels_like: item.main.feels_like,
      humidity: item.main.humidity,
      wind_speed: item.wind.speed,
      wind_deg: item.wind.deg,
      pop: item.pop || 0,
      rain_mm: item.rain?.['3h'] || 0,
      weather: item.weather,
    }));
}

function transformWeather(currentData: any, forecastData: any, cityName: string, country: string, timezoneOffsetSeconds: number = 0, dailyData: any = null) {
  const list = forecastData.list || [];
  const localNowMs = Date.now() + timezoneOffsetSeconds * 1000;
  const todayStr = new Date(localNowMs).toISOString().split('T')[0];

  const dailyMap: Record<string, { maxtemp_c: number; mintemp_c: number }> = {};
  if (dailyData?.list) {
    for (const d of dailyData.list) {
      const dateStr = new Date(d.dt * 1000).toISOString().split('T')[0];
      dailyMap[dateStr] = { maxtemp_c: d.temp?.max ?? null, mintemp_c: d.temp?.min ?? null };
    }
  }

  const dayMap: Record<string, any[]> = {};
  for (const item of list) {
    const localItemMs = item.dt * 1000 + timezoneOffsetSeconds * 1000;
    const date = new Date(localItemMs).toISOString().split('T')[0];
    if (!dayMap[date]) dayMap[date] = [];
    dayMap[date].push(item);
  }

  const forecastDays = Object.entries(dayMap)
    .filter(([date]) => date >= todayStr)
    .slice(0, 8)
    .map(([date, items]) => {
      const tempMaxValues = items.map((i: any) => i.main.temp_max);
      const tempMinValues = items.map((i: any) => i.main.temp_min);
      const allTemps = items.map((i: any) => i.main.temp);
      const derivedMax = Math.max(...tempMaxValues, ...allTemps);
      const derivedMin = Math.min(...tempMinValues, ...allTemps);
      const officialDay = dailyMap[date];
      const maxtemp_c = (officialDay?.maxtemp_c != null) ? officialDay.maxtemp_c : derivedMax;
      const mintemp_c = (officialDay?.mintemp_c != null) ? officialDay.mintemp_c : derivedMin;
      const rain = items.reduce((s: number, i: any) => s + (i.rain?.['3h'] || 0), 0);
      const maxPop = Math.max(...items.map((i: any) => i.pop || 0));
      const maxWind = Math.max(...items.map((i: any) => (i.wind?.speed || 0) * 3.6));
      const mid = items[Math.floor(items.length / 2)] || items[0];
      const avgWindDeg = items.reduce((s: number, i: any) => s + (i.wind?.deg || 0), 0) / items.length;

      const hourlyItems = items.map((i: any) => ({
        dt: i.dt,
        temp: i.main.temp,
        humidity: i.main.humidity,
        wind_speed_kph: (i.wind?.speed || 0) * 3.6,
        wind_deg: i.wind?.deg || 0,
        pop: i.pop || 0,
        rain_mm: i.rain?.['3h'] || 0,
      }));

      return {
        date,
        hour: hourlyItems,
        day: {
          maxtemp_c,
          mintemp_c,
          condition: { text: mid.weather[0].description },
          daily_chance_of_rain: Math.round(maxPop * 100),
          totalprecip_mm: rain,
          maxwind_kph: maxWind,
          avg_wind_deg: avgWindDeg,
        },
      };
    });

  return {
    location: { name: cityName, country },
    current: {
      temp_c: currentData.main.temp,
      feelslike_c: currentData.main.feels_like,
      humidity: currentData.main.humidity,
      wind_kph: (currentData.wind?.speed || 0) * 3.6,
      wind_degree: currentData.wind?.deg || 0,
      wind_dir: degreesToDirection(currentData.wind?.deg || 0),
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

function getDeltaTRating(dt: number): { rating: string; color: string } {
  if (dt < 2) return { rating: 'Poor', color: '#dc2626' };
  if (dt < 4) return { rating: 'Okay', color: '#d97706' };
  if (dt <= 6) return { rating: 'Excellent', color: '#16a34a' };
  if (dt <= 8) return { rating: 'Okay', color: '#d97706' };
  return { rating: 'Poor', color: '#dc2626' };
}

function getMoistureStatus(val: number): { status: string; color: string } {
  if (val < 15) return { status: 'Very Dry', color: '#dc2626' };
  if (val < 25) return { status: 'Dry', color: '#d97706' };
  if (val <= 40) return { status: 'Ideal', color: '#16a34a' };
  if (val <= 55) return { status: 'Moist', color: '#2563eb' };
  return { status: 'Saturated', color: '#7c3aed' };
}

function getSoilTempStatus(t: number): { status: string; color: string } {
  if (t < 10) return { status: 'Cold', color: '#2563eb' };
  if (t < 15) return { status: 'Cool', color: '#059669' };
  if (t <= 25) return { status: 'Optimal', color: '#16a34a' };
  if (t <= 30) return { status: 'Warm', color: '#d97706' };
  return { status: 'Hot', color: '#dc2626' };
}

function getBestSprayWindow(hours: any[]): { hasWindow: boolean; timeRange: string; reason: string } {
  const windows: any[] = [];
  for (const h of hours) {
    const wind = h.wind_speed_kph || (h.wind_speed ? h.wind_speed * 3.6 : 0);
    const dt = calcDeltaT(h.temp, h.humidity);
    const hourRain = (h.rain_mm || 0) > 0.2;
    if (!hourRain && wind >= 3 && wind <= 15 && dt >= 2 && dt <= 8) {
      windows.push(h);
    }
  }

  if (windows.length === 0) {
    const totalRain = hours.reduce((s: number, h: any) => s + (h.rain_mm || 0), 0);
    if (totalRain > 0.5) return { hasWindow: false, timeRange: '', reason: 'Rain' };
    return { hasWindow: false, timeRange: '', reason: 'Conditions' };
  }

  const sorted = [...windows].sort((a, b) => a.dt - b.dt);
  const fmt = (ts: number) => {
    const d = new Date(ts * 1000);
    const h = d.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hr}${ampm}`;
  };
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const timeRange = `${fmt(first.dt)}\u2013${fmt(last.dt)}`;
  return { hasWindow: true, timeRange, reason: '' };
}

function getDaySprayLabel(hours: any[], _totalRainMm: number): { icon: string; label: string } {
  const windows: any[] = [];
  for (const h of hours) {
    const wind = h.wind_speed_kph || 0;
    const dt = calcDeltaT(h.temp, h.humidity);
    const hourRain = (h.rain_mm || 0) > 0.2;
    if (!hourRain && wind >= 3 && wind <= 15 && dt >= 2 && dt <= 8) {
      windows.push(h);
    }
  }

  if (windows.length === 0) {
    const totalActualRain = hours.reduce((s: number, h: any) => s + (h.rain_mm || 0), 0);
    if (totalActualRain > 0.5) return { icon: '\u2717', label: 'Rain' };
    return { icon: '\u2717', label: 'Conditions' };
  }

  const sorted = [...windows].sort((a, b) => a.dt - b.dt);
  const fmt = (ts: number) => {
    const d = new Date(ts * 1000);
    const h = d.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hr}${ampm}`;
  };
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return { icon: '\u2713', label: `${fmt(first.dt)}\u2013${fmt(last.dt)}` };
}

function getDailyPlantingRating(maxTemp: number, minTemp: number, rainMm: number, maxWindKph: number, rainChance: number): { rating: string; icon: string; color: string; note: string; soilTempEst: number } {
  const soilTempEst = Math.round((maxTemp * 0.6 + minTemp * 0.4) * 0.85);
  if (rainMm > 10 || rainChance > 70) return { rating: 'Avoid', icon: '\u2717', color: '#dc2626', note: 'Too wet \u2014 waterlogging risk', soilTempEst };
  if (maxWindKph > 30) return { rating: 'Avoid', icon: '\u2717', color: '#dc2626', note: 'High winds \u2014 seedling damage risk', soilTempEst };
  if (maxTemp > 38 || minTemp < 2) return { rating: 'Avoid', icon: '\u2717', color: '#dc2626', note: maxTemp > 38 ? 'Too hot for transplanting' : 'Frost risk overnight', soilTempEst };
  if (maxTemp >= 20 && maxTemp <= 28 && minTemp >= 8 && rainMm < 5 && maxWindKph < 20) return { rating: 'Good', icon: '\u2713', color: '#16a34a', note: 'Suitable conditions for planting', soilTempEst };
  if (maxTemp >= 15 && maxTemp <= 32 && minTemp >= 5 && rainMm < 8 && maxWindKph < 25) return { rating: 'Good', icon: '\u2713', color: '#16a34a', note: 'Suitable conditions for planting', soilTempEst };
  return { rating: 'Marginal', icon: '\u26a0', color: '#d97706', note: 'Borderline \u2014 monitor conditions', soilTempEst };
}

function getDailyIrrigationAdvice(rainMm: number, rainChance: number, maxTemp: number): { action: string; amount: string; note: string; color: string } {
  if (rainMm >= 10 || rainChance >= 70) return { action: 'Skip', amount: '0mm', note: 'Rain forecast \u2014 soil will recharge naturally', color: '#16a34a' };
  if (rainMm >= 5 || rainChance >= 50) return { action: 'Reduce', amount: '5\u201310mm', note: 'Light rain expected \u2014 top up only if needed', color: '#d97706' };
  if (maxTemp >= 35) return { action: 'Irrigate', amount: '25\u201335mm', note: 'Heat stress risk \u2014 irrigate early morning', color: '#dc2626' };
  if (maxTemp >= 28) return { action: 'Irrigate', amount: '15\u201320mm', note: 'Warm & dry \u2014 apply in early morning', color: '#2563eb' };
  return { action: 'Optional', amount: '5\u201310mm', note: 'Cool conditions \u2014 irrigate only if soil is dry', color: '#64748b' };
}

async function generateProbeReport(userId: string, supabaseAdmin: any, weatherData: any): Promise<string> {
  try {
    const { data: connections, error: connError } = await supabaseAdmin
      .from('probe_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(10);

    if (connError || !connections || connections.length === 0) return '';

    const { data: latestReadings, error: readingError } = await supabaseAdmin
      .from('probe_readings_latest')
      .select('*')
      .in('connection_id', connections.map((c: any) => c.id))
      .order('measured_at', { ascending: false })
      .limit(50);

    if (readingError || !latestReadings || latestReadings.length === 0) return '';

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    let analysis = '';

    if (openaiApiKey) {
      const probeDataForAI = latestReadings.slice(0, 10).map((reading: any) => {
        const connection = connections.find((c: any) => c.id === reading.connection_id);
        const moistureDepths = reading.moisture_depths?.depths || [];
        const soilTempDepths = reading.soil_temp_depths?.depths || [];
        return {
          location: connection?.friendly_name || reading.station_id || 'Probe',
          moisture: moistureDepths.length > 0
            ? moistureDepths.map((d: any) => `${d.depth_cm}cm: ${d.value}% (${getMoistureStatus(d.value).status})`).join(', ')
            : reading.moisture_percent ? `${reading.moisture_percent}%` : 'N/A',
          soilTemp: soilTempDepths.length > 0
            ? soilTempDepths.map((d: any) => `${d.depth_cm}cm: ${d.value}\u00b0C`).join(', ')
            : reading.soil_temp_c ? `${reading.soil_temp_c}\u00b0C` : 'N/A',
        };
      });

      const dailyForecast = weatherData.forecast.forecastday;
      const weatherContext = `
CURRENT: ${weatherData.current.temp_c}\u00b0C, ${weatherData.current.humidity}% humidity, ${weatherData.current.condition.text}
NEXT 3 DAYS:
${dailyForecast.slice(0, 3).map((day: any, i: number) => {
  const date = new Date(day.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${date}: ${day.day.mintemp_c}\u00b0C-${day.day.maxtemp_c}\u00b0C, ${day.day.totalprecip_mm.toFixed(1)}mm rain (${day.day.daily_chance_of_rain}%)`;
}).join('\n')}`;

      const prompt = `You are an agricultural soil expert. Based on soil probe data and weather forecast, provide a practical 3-5 sentence analysis covering: overall soil conditions, irrigation recommendations considering weather, and any concerns. Keep under 120 words.

PROBE DATA:
${JSON.stringify(probeDataForAI, null, 2)}

WEATHER:
${weatherContext}`;

      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a helpful agricultural advisor providing concise soil analysis for farmers.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.7,
          }),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          analysis = aiData.choices[0]?.message?.content || '';
        }
      } catch (_e) { /* fall through to basic report */ }
    }

    const probeCards = latestReadings.slice(0, 5).map((reading: any) => {
      const connection = connections.find((c: any) => c.id === reading.connection_id);
      const probeName = connection?.friendly_name || reading.station_id || 'Probe';
      const lastUpdate = new Date(reading.measured_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
      const moistureDepths = reading.moisture_depths?.depths || [];
      const soilTempDepths = reading.soil_temp_depths?.depths || [];

      const moistureRows = moistureDepths.length > 0
        ? moistureDepths.map((d: any) => {
            const st = getMoistureStatus(d.value);
            return `<tr>
              <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">\u{1F4A7} ${d.depth_cm}cm</td>
              <td style="padding:8px 12px;font-size:14px;font-weight:700;color:#111827;text-align:center;border-bottom:1px solid #f3f4f6;font-family:monospace;">${d.value.toFixed(2)}%</td>
              <td style="padding:8px 12px;font-size:12px;font-weight:600;color:${st.color};text-align:right;border-bottom:1px solid #f3f4f6;">${st.status}</td>
            </tr>`;
          }).join('')
        : '';

      const soilTempRows = soilTempDepths.length > 0
        ? soilTempDepths.map((d: any) => {
            const st = getSoilTempStatus(d.value);
            return `<tr>
              <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">\u{1F321}\u{FE0F} Soil ${d.depth_cm}cm</td>
              <td style="padding:8px 12px;font-size:14px;font-weight:700;color:#111827;text-align:center;border-bottom:1px solid #f3f4f6;font-family:monospace;" colspan="2">${d.value.toFixed(2)}\u00b0C</td>
            </tr>`;
          }).join('')
        : '';

      return `<div style="margin-bottom:16px;">
        <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:2px;">${probeName}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:10px;">Last update: ${lastUpdate}</div>
        <table style="width:100%;border-collapse:collapse;">
          ${moistureRows}
          ${soilTempRows}
        </table>
      </div>`;
    }).join('');

    let aiSection = '';
    if (analysis) {
      aiSection = `
      <tr><td style="padding:24px 32px 0;">
        <div style="border-top:2px solid #16a34a;padding-top:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:12px;">\u{1F9EA} AI ANALYSIS</div>
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;background:#fafafa;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">AI POWERED &nbsp;&nbsp;SOIL ANALYSIS & RECOMMENDATIONS</div>
            <div style="font-size:13px;color:#374151;line-height:1.6;">${analysis}</div>
            <div style="font-size:11px;color:#6b7280;font-style:italic;margin-top:10px;">Analysis based on ${latestReadings.length} active probe${latestReadings.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      </td></tr>`;
    }

    const probeSection = `
    ${aiSection}
    <tr><td style="padding:24px 32px 0;">
      <div style="${analysis ? '' : 'border-top:2px solid #16a34a;padding-top:20px;'}">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">\u{1F4CA} SOIL PROBE READINGS</div>
        ${probeCards}
      </div>
    </td></tr>`;

    return probeSection;
  } catch (error) {
    console.error('Error generating probe report:', error);
    return '';
  }
}

function buildEmail(weatherData: any, hourly: any[], probeHtml: string = ''): string {
  const { name: loc, country } = weatherData.location;
  const cur = weatherData.current;
  const forecast = weatherData.forecast.forecastday;
  const today = forecast[0];
  const todayDay = today.day;

  const highTemp = Math.round(todayDay.maxtemp_c);
  const lowTemp = Math.round(todayDay.mintemp_c);
  const rainMm = todayDay.totalprecip_mm;
  const rainChance = todayDay.daily_chance_of_rain;
  const windDir = degreesToDirection(cur.wind_degree);
  const dt = calcDeltaT(cur.temp_c, cur.humidity);
  const dtCond = getDeltaTRating(dt);

  const sprayWindow = getBestSprayWindow(today.hour || hourly);
  const sprayBadgeText = sprayWindow.hasWindow ? '' : 'AVOID SPRAYING';
  const sprayBadgeColor = sprayWindow.hasWindow ? '#16a34a' : '#dc2626';
  const sprayTitle = sprayWindow.hasWindow
    ? `Spray Window: ${sprayWindow.timeRange}`
    : 'No Spray Window Today';
  const spraySubtext = sprayWindow.hasWindow
    ? 'Conditions suitable for application during this window'
    : 'High drift risk or washoff likely \u2014 delay application';

  const fiveDays = forecast.slice(0, 5).map((d: any) => {
    const date = new Date(d.date);
    const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const avgWind = d.hour?.length > 0
      ? Math.round(d.hour.reduce((s: number, h: any) => s + (h.wind_speed_kph || 0), 0) / d.hour.length)
      : Math.round(d.day.maxwind_kph);
    const windDeg = d.day.avg_wind_deg ?? (d.hour?.[Math.floor((d.hour?.length || 1) / 2)]?.wind_deg ?? 0);
    const spray = getDaySprayLabel(d.hour || [], d.day.totalprecip_mm);
    const irrigation = getDailyIrrigationAdvice(d.day.totalprecip_mm, d.day.daily_chance_of_rain, d.day.maxtemp_c);
    const planting = getDailyPlantingRating(d.day.maxtemp_c, d.day.mintemp_c, d.day.totalprecip_mm, d.day.maxwind_kph, d.day.daily_chance_of_rain);

    return { dayName, dateStr, high: Math.round(d.day.maxtemp_c), low: Math.round(d.day.mintemp_c), rain: d.day.totalprecip_mm.toFixed(1), rainChance: d.day.daily_chance_of_rain, wind: avgWind, windDir: degreesToDirection(windDeg), spray, irrigation, planting };
  });

  const bestSprayTimeForOps = sprayWindow.hasWindow ? sprayWindow.timeRange : 'N/A';
  const plantingRating = getDailyPlantingRating(todayDay.maxtemp_c, todayDay.mintemp_c, todayDay.totalprecip_mm, todayDay.maxwind_kph, todayDay.daily_chance_of_rain);
  const irrigationAdvice = getDailyIrrigationAdvice(todayDay.totalprecip_mm, todayDay.daily_chance_of_rain, todayDay.maxtemp_c);

  const dateStr = new Date(Date.now() + 11 * 60 * 60 * 1000).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="padding:32px 32px 24px;text-align:center;">
    <div style="margin-bottom:8px;">
      <span style="display:inline-block;width:40px;height:40px;background:#f0fdf4;border-radius:10px;line-height:40px;font-size:20px;vertical-align:middle;">\u{1F331}</span>
      <span style="font-size:24px;font-weight:800;color:#111827;vertical-align:middle;margin-left:8px;">Farm<span style="color:#16a34a;">Cast</span></span>
    </div>
    <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#6b7280;margin-bottom:16px;">DAILY FARM INTELLIGENCE</div>
    <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:999px;padding:6px 18px;font-size:14px;font-weight:700;color:#166534;margin-bottom:6px;">\u{1F4CD} ${loc}, ${country}</div>
    <div style="font-size:12px;color:#9ca3af;margin-top:6px;">${dateStr}</div>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 32px;"><div style="border-top:2px solid #16a34a;"></div></td></tr>

  <!-- Today's Forecast -->
  <tr><td style="padding:24px 32px 0;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">TODAY'S FORECAST</div>

    <!-- Current Conditions Card -->
    <div style="border:1px solid #bbf7d0;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">CURRENT CONDITIONS</div>
      <div style="font-size:48px;font-weight:300;color:#16a34a;line-height:1;">${Math.round(cur.temp_c)}\u00b0C</div>
      <div style="font-size:13px;color:#9ca3af;margin-top:8px;text-transform:capitalize;">${cur.condition.text} \u00b7 Feels like ${Math.round(cur.feelslike_c)}\u00b0C \u00b7 ${cur.humidity}% Humidity</div>
    </div>

    <!-- Stats Grid -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="padding-right:8px;padding-bottom:16px;">
          <div style="text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">TODAY'S HIGH</div>
            <div style="font-size:32px;font-weight:300;color:#16a34a;">${highTemp}\u00b0C</div>
            <div style="font-size:11px;color:#9ca3af;">Maximum</div>
          </div>
        </td>
        <td width="50%" style="padding-left:8px;padding-bottom:16px;">
          <div style="text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">TODAY'S LOW</div>
            <div style="font-size:32px;font-weight:300;color:#16a34a;">${lowTemp}\u00b0C</div>
            <div style="font-size:11px;color:#9ca3af;">Minimum</div>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding-right:8px;">
          <div style="text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">RAIN EXPECTED</div>
            <div style="font-size:32px;font-weight:300;color:#16a34a;">${rainMm.toFixed(1)}mm</div>
            <div style="font-size:11px;color:#9ca3af;">${rainChance}% chance</div>
          </div>
        </td>
        <td width="50%" style="padding-left:8px;">
          <div style="text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">WIND</div>
            <div style="font-size:32px;font-weight:300;color:#d97706;">${Math.round(cur.wind_kph)} km/h</div>
            <div style="font-size:11px;color:#9ca3af;">${windDir}</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Spray Window -->
  <tr><td style="padding:24px 32px 0;">
    <div style="border-top:2px solid #16a34a;padding-top:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">\u{1F4A7} SPRAY WINDOW</div>
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${sprayBadgeColor};">\u{1F6AB} TODAY'S SPRAY WINDOW</div></td>
            <td style="text-align:right;">${sprayBadgeText ? `<span style="display:inline-block;border:1px solid ${sprayBadgeColor};border-radius:4px;padding:3px 10px;font-size:10px;font-weight:700;color:${sprayBadgeColor};letter-spacing:0.5px;">${sprayBadgeText}</span>` : ''}</td>
          </tr>
        </table>
        <div style="font-size:20px;font-weight:600;color:#111827;margin:12px 0 4px;">${sprayTitle}</div>
        <div style="font-size:13px;color:#9ca3af;">${spraySubtext}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
          <tr>
            <td width="33%" style="text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">DELTA T</div>
              <div style="font-size:16px;font-weight:700;color:#111827;">${dt.toFixed(1)}\u00b0C</div>
            </td>
            <td width="33%" style="text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">WIND</div>
              <div style="font-size:16px;font-weight:700;color:#111827;">${Math.round(cur.wind_kph)} km/h</div>
            </td>
            <td width="33%" style="text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">HUMIDITY</div>
              <div style="font-size:16px;font-weight:700;color:#111827;">${cur.humidity}%</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </td></tr>

  <!-- 5-Day Outlook -->
  <tr><td style="padding:24px 32px 0;">
    <div style="border-top:2px solid #16a34a;padding-top:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">\u{1F4C5} 5-DAY OUTLOOK</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-left:12px;">DAY</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">TEMP</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">RAIN</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">WIND</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">SPRAY</th>
          </tr>
        </thead>
        <tbody>
          ${fiveDays.map((d: any) => `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:12px 8px;padding-left:12px;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#111827;">${d.dayName}</div>
              <div style="font-size:11px;color:#9ca3af;">${d.dateStr}</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#111827;">${d.high}\u00b0</div>
              <div style="font-size:11px;color:#9ca3af;">${d.low}\u00b0</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#111827;">${d.rain}mm</div>
              <div style="font-size:11px;color:#9ca3af;">${d.rainChance}%</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:12px;font-weight:600;color:#d97706;">${d.wind} km/h</div>
              <div style="font-size:11px;color:#9ca3af;">${d.windDir}</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:13px;font-weight:700;color:${d.spray.icon === '\u2713' ? '#16a34a' : '#dc2626'};">${d.spray.icon} ${d.spray.label}</div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </td></tr>

  <!-- Farm Operations Summary -->
  <tr><td style="padding:24px 32px 0;">
    <div style="border-top:2px solid #16a34a;padding-top:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">\u{1F69C} FARM OPERATIONS SUMMARY</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding:8px 0;">
            <div style="font-size:12px;color:#9ca3af;">\u{1F4A7} Best Spray Window</div>
            <div style="font-size:14px;font-weight:700;color:#111827;">${bestSprayTimeForOps}</div>
          </td>
          <td width="50%" style="padding:8px 0;">
            <div style="font-size:12px;color:#9ca3af;">\u{1F321}\u{FE0F} Delta T Index</div>
            <div style="font-size:14px;font-weight:700;color:#111827;">${dt.toFixed(1)}\u00b0C \u2014 ${dtCond.rating}</div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:8px 0;">
            <div style="font-size:12px;color:#9ca3af;">\u{1F331} Planting Conditions</div>
            <div style="font-size:14px;font-weight:700;color:${plantingRating.color};">${plantingRating.rating.toUpperCase()}</div>
          </td>
          <td width="50%" style="padding:8px 0;">
            <div style="font-size:12px;color:#9ca3af;">\u{1F4A7} Irrigation</div>
            <div style="display:inline-block;border:1px solid #e5e7eb;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:700;color:#374151;">${irrigationAdvice.action.toUpperCase()}</div>
          </td>
        </tr>
      </table>
    </div>
  </td></tr>

  <!-- Probe Report (if available) -->
  ${probeHtml}

  <!-- Planting Days -->
  <tr><td style="padding:24px 32px 0;">
    <div style="border-top:2px solid #16a34a;padding-top:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">\u{1F331} PLANTING DAYS THIS WEEK</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-left:12px;">DAY</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">RATING</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">SOIL TEMP</th>
            <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">CONDITIONS</th>
          </tr>
        </thead>
        <tbody>
          ${fiveDays.map((d: any) => `
          <tr>
            <td style="padding:12px 8px;padding-left:12px;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#111827;">${d.dayName} ${d.dateStr.split(' ')[0]}</div>
              <div style="font-size:11px;color:#9ca3af;">${d.dateStr.split(' ')[1] || ''}</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:13px;font-weight:700;color:${d.planting.color};">${d.planting.icon} ${d.planting.rating}</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#16a34a;">${d.planting.soilTempEst}\u00b0C</div>
              <div style="font-size:10px;color:#9ca3af;">est.</div>
            </td>
            <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:12px;color:#6b7280;">${d.planting.note}</div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </td></tr>

  <!-- Irrigation Schedule -->
  <tr><td style="padding:24px 32px 0;">
    <div style="border-top:2px solid #16a34a;padding-top:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#374151;margin-bottom:16px;">\u{1F4A7} 5-DAY IRRIGATION SCHEDULE</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-left:12px;">DAY</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">ACTION</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">AMOUNT</th>
            <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;">NOTES</th>
          </tr>
        </thead>
        <tbody>
          ${fiveDays.map((d: any) => `
          <tr>
            <td style="padding:12px 8px;padding-left:12px;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#111827;">${d.dayName} ${d.dateStr.split(' ')[0]}</div>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <span style="display:inline-block;border:1px solid ${d.irrigation.color};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;color:${d.irrigation.color};">${d.irrigation.action}</span>
            </td>
            <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:14px;font-weight:700;color:#111827;">${d.irrigation.amount}</div>
            </td>
            <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:12px;color:#6b7280;">${d.irrigation.note}</div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:32px 32px 0;">
    <div style="border-top:2px solid #16a34a;padding-top:24px;text-align:center;">
      <div style="margin-bottom:8px;">
        <span style="font-size:18px;font-weight:800;color:#111827;">\u{1F331} Farm<span style="color:#16a34a;">Cast</span></span>
      </div>
      <div style="margin-bottom:16px;">
        <a href="https://farmcastweather.com" style="color:#16a34a;text-decoration:none;font-weight:600;font-size:13px;margin:0 12px;">Dashboard</a>
        <a href="https://farmcastweather.com/settings" style="color:#16a34a;text-decoration:none;font-weight:600;font-size:13px;margin:0 12px;">Preferences</a>
        <a href="https://farmcastweather.com/unsubscribe" style="color:#16a34a;text-decoration:none;font-weight:600;font-size:13px;margin:0 12px;">Unsubscribe</a>
      </div>
      <div style="font-size:11px;color:#9ca3af;line-height:1.6;margin-bottom:12px;">
        FarmCast Weather Services \u2014 Sent to daily forecast subscribers at $2.99/month, billed monthly. Cancel anytime in settings. For agricultural information only \u2014 does not constitute fertiliser, or legal application advice. Always follow local regulations and qualified agronomist advice before spraying or applying products.
      </div>
      <div style="font-size:12px;font-weight:600;color:#6b7280;padding-bottom:24px;">
        Built for farmers. Designed for real on-farm decisions.
      </div>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
