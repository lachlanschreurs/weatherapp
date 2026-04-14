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

    const weatherApiKey = Deno.env.get('FARMCAST_OPENWEATHER_STARTUP_KEY');
    if (!weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    console.log(`Starting to process ${eligibleSubscribers.length} eligible subscribers`);

    const backgroundTask = processEmailsInBackground(eligibleSubscribers, resendApiKey, weatherApiKey, supabaseAdmin);
    EdgeRuntime.waitUntil(backgroundTask);

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
          }
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

        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&cnt=40`;

        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(currentUrl),
          fetch(forecastUrl),
        ]);

        if (!currentResponse.ok) {
          const errorText = await currentResponse.text();
          const errorMsg = `Failed to fetch current weather for ${subscriber.email}: ${currentResponse.status} - ${errorText}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        if (!forecastResponse.ok) {
          const errorText = await forecastResponse.text();
          const errorMsg = `Failed to fetch forecast for ${subscriber.email}: ${forecastResponse.status} - ${errorText}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        const weatherData = transformWeatherDataFromForecast(currentData, forecastData, name, country, currentData.timezone);
        const hourlyForecast = buildHourlyFromForecast(forecastData);

        let probeReport = '';
        if (subscriber.user_id) {
          probeReport = await generateProbeReport(subscriber.user_id, supabaseAdmin, weatherData, weatherData.forecast.forecastday);
        }

        const emailHtml = buildDailyForecastEmail(weatherData, hourlyForecast, probeReport);

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
            from: 'FarmCast Weather <support@mail.farmcastweather.com>',
            to: subscriber.email,
            subject: `Daily Farm Forecast - ${name}`,
            html: emailHtml,
            text: buildDailyForecastEmailText(weatherData, hourlyForecast, name, country),
            headers: {
              'X-Entity-Ref-ID': `daily-forecast-${Date.now()}`,
              'List-Unsubscribe': '<https://farmcastweather.com/unsubscribe>',
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            tags: [
              {
                name: 'category',
                value: 'daily_forecast'
              }
            ]
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

function buildHourlyFromForecast(forecastData: any): any[] {
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
      weather: item.weather,
    }));
}

function transformWeatherDataFromForecast(currentData: any, forecastData: any, cityName: string, country: string, timezoneOffsetSeconds: number = 0) {
  const list = forecastData.list || [];

  const localNowMs = Date.now() + timezoneOffsetSeconds * 1000;
  const localNowDate = new Date(localNowMs);
  const todayStr = localNowDate.toISOString().split('T')[0];
  const nowTs = Math.floor(Date.now() / 1000);

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
    const futureItems = date === todayStr
      ? (items as any[]).filter((i: any) => i.dt >= nowTs)
      : items as any[];

    const relevantItems = futureItems.length > 0 ? futureItems : items as any[];

    const allDayItems = items as any[];
    const tempMaxValues = allDayItems.map((i: any) => i.main.temp_max);
    const tempMinValues = allDayItems.map((i: any) => i.main.temp_min);
    const allTemps = allDayItems.map((i: any) => i.main.temp);

    const maxtemp_c = Math.max(...tempMaxValues, ...allTemps);
    const mintemp_c = Math.min(...tempMinValues, ...allTemps);

    const rain = items.reduce((sum: number, i: any) => sum + (i.rain?.['3h'] || 0), 0);
    const maxPop = Math.max(...items.map((i: any) => i.pop || 0));
    const maxWind = Math.max(...items.map((i: any) => (i.wind?.speed || 0) * 3.6));
    const midItem = items[Math.floor(items.length / 2)] || items[0];

    const avgWindDeg = allDayItems.reduce((sum: number, i: any) => sum + (i.wind?.deg || 0), 0) / allDayItems.length;

    const hourlyItems = (items as any[]).map((i: any) => ({
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
        condition: { text: midItem.weather[0].description },
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

function transformWeatherDataFromOneCall(oneCallData: any, cityName: string, country: string) {
  const forecastDays = oneCallData.daily.slice(0, 8).map((day: any) => {
    return {
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      day: {
        maxtemp_c: day.temp.max,
        mintemp_c: day.temp.min,
        condition: {
          text: day.weather[0].description
        },
        daily_chance_of_rain: Math.round((day.pop || 0) * 100),
        totalprecip_mm: (day.rain || 0) + (day.snow || 0),
        maxwind_kph: day.wind_speed * 3.6
      }
    };
  });

  return {
    location: {
      name: cityName,
      country: country
    },
    current: {
      temp_c: oneCallData.current.temp,
      feelslike_c: oneCallData.current.feels_like,
      humidity: oneCallData.current.humidity,
      wind_kph: oneCallData.current.wind_speed * 3.6,
      wind_degree: oneCallData.current.wind_deg,
      wind_dir: degreesToDirection(oneCallData.current.wind_deg),
      condition: {
        text: oneCallData.current.weather[0].description
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

function getSprayWindowForDay(windSpeedKmh: number, rainfallMm: number, deltaT: number): string {
  if (rainfallMm > 5) return '❌';
  if (windSpeedKmh > 25) return '❌';
  if (windSpeedKmh >= 3 && windSpeedKmh <= 15 && deltaT >= 2 && deltaT <= 8) return '✅';
  if (windSpeedKmh < 3 || windSpeedKmh > 20) return '⚠️';
  if (deltaT < 2 || deltaT > 10) return '⚠️';
  return '✓';
}

function hourIsRainy(h: any): boolean {
  if (h.rain_mm > 0.2) return true;
  if (h.pop > 0.4) return true;
  return false;
}

function getBestSprayWindowFromHours(hours: any[], totalRainMm: number): { icon: string; timeRange: string; windDir: string } {
  const totalActualRain = hours.reduce((s: number, h: any) => s + (h.rain_mm || 0), 0);
  const heavyRainDay = totalActualRain > 5 || totalRainMm > 10;
  if (heavyRainDay) return { icon: '❌', timeRange: 'Rain forecast', windDir: '' };

  const idealWindows: any[] = [];
  const goodWindows: any[] = [];

  for (const h of hours) {
    const windKph = h.wind_speed_kph;
    const deltaT = calculateDeltaT(h.temp, h.humidity);

    if (hourIsRainy(h) || windKph > 25) continue;

    const recentRain = h.rain_mm > 0.1;

    if (!recentRain && windKph >= 3 && windKph <= 15 && deltaT >= 2 && deltaT <= 8 && h.temp >= 10 && h.temp <= 30) {
      idealWindows.push(h);
    } else if (!recentRain && windKph >= 3 && windKph <= 20 && deltaT >= 2 && deltaT <= 10) {
      goodWindows.push(h);
    }
  }

  const buildTimeRange = (windows: any[]) => {
    if (windows.length === 0) return { timeRange: '', windDir: '' };
    const sortedWindows = [...windows].sort((a, b) => a.dt - b.dt);
    const first = sortedWindows[0];
    const last = sortedWindows[sortedWindows.length - 1];
    const fmt = (ts: number) => new Date(ts * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
    const timeRange = sortedWindows.length === 1 ? fmt(first.dt) : `${fmt(first.dt)}–${fmt(last.dt)}`;
    const avgDeg = sortedWindows.reduce((s: number, h: any) => s + h.wind_deg, 0) / sortedWindows.length;
    return { timeRange, windDir: degreesToDirection(avgDeg) };
  };

  if (idealWindows.length > 0) {
    const { timeRange, windDir } = buildTimeRange(idealWindows);
    return { icon: '✅', timeRange, windDir };
  }
  if (goodWindows.length > 0) {
    const { timeRange, windDir } = buildTimeRange(goodWindows);
    return { icon: '✓', timeRange, windDir };
  }

  const dryHour = hours.find((h: any) => !hourIsRainy(h));
  const windDirFallback = dryHour ? degreesToDirection(dryHour.wind_deg) : '';
  if (totalActualRain > 0.5 || totalRainMm > 0.5) return { icon: '❌', timeRange: 'Rain forecast', windDir: windDirFallback };
  return { icon: '⚠️', timeRange: 'Marginal conditions', windDir: windDirFallback };
}

async function generateProbeReport(userId: string, supabaseAdmin: any, weatherData?: any, dailyForecast?: any[]): Promise<string> {
  try {
    const { data: connections, error: connError } = await supabaseAdmin
      .from('probe_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(10);

    if (connError || !connections || connections.length === 0) {
      return '';
    }

    const { data: latestReadings, error: readingError } = await supabaseAdmin
      .from('probe_readings_latest')
      .select('*')
      .in('connection_id', connections.map((c: any) => c.id))
      .order('measured_at', { ascending: false })
      .limit(50);

    if (readingError || !latestReadings || latestReadings.length === 0) {
      return '';
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return buildBasicProbeReport(latestReadings, connections);
    }

    const probeDataForAI = latestReadings.slice(0, 10).map((reading: any) => {
      const connection = connections.find((c: any) => c.id === reading.connection_id);
      const moistureDepths = reading.moisture_depths?.depths || [];
      const soilTempDepths = reading.soil_temp_depths?.depths || [];

      return {
        location: reading.station_id || connection?.friendly_name || connection?.station_id || 'Probe',
        lastUpdate: new Date(reading.measured_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }),
        moisture: moistureDepths.length > 0
          ? moistureDepths.map((d: any) => {
              const status = getMoistureStatus(d.value);
              return `${d.depth_cm}cm: ${d.value}% (${status.status})`;
            }).join(', ')
          : reading.moisture_percent
          ? `${reading.moisture_percent}% (${getMoistureStatus(reading.moisture_percent).status})`
          : 'N/A',
        soilTemp: soilTempDepths.length > 0
          ? soilTempDepths.map((d: any) => {
              const status = getSoilTempStatus(d.value);
              return `${d.depth_cm}cm: ${d.value}°C (${status.status})`;
            }).join(', ')
          : reading.soil_temp_c
          ? `${reading.soil_temp_c}°C (${getSoilTempStatus(reading.soil_temp_c).status})`
          : 'N/A',
        airTemp: reading.air_temp_c ? `${reading.air_temp_c}°C` : 'N/A',
        humidity: reading.humidity_percent ? `${reading.humidity_percent}%` : 'N/A',
        battery: reading.battery_level ? `${reading.battery_level}%` : 'N/A',
      };
    });

    const weatherContext = weatherData && dailyForecast ? `

CURRENT WEATHER CONDITIONS:
- Temperature: ${weatherData.current.temp_c}°C
- Humidity: ${weatherData.current.humidity}%
- Conditions: ${weatherData.current.condition.text}

UPCOMING 3-DAY FORECAST:
${dailyForecast.slice(0, 3).map((day: any, i: number) => {
  const date = new Date(day.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
  return `Day ${i + 1} (${date}):
  - Temp: ${day.day.mintemp_c}°C to ${day.day.maxtemp_c}°C
  - Rain chance: ${day.day.daily_chance_of_rain}%
  - Expected rainfall: ${day.day.totalprecip_mm.toFixed(1)}mm
  - Conditions: ${day.day.condition.text}`;
}).join('\n')}
` : '';

    const prompt = `You are an agricultural soil expert analyzing moisture probe data from multiple field stations. Based on the following recent readings AND upcoming weather forecast, provide:

1. A brief summary of overall soil conditions across all probes
2. Specific concerns or opportunities identified (e.g., dry zones, optimal moisture areas)
3. Actionable irrigation recommendations for the next 24-48 hours, considering upcoming weather
4. Any plant health considerations based on soil temperature, moisture, and weather trends

MOISTURE LEVEL GUIDE:
- Very Dry (<15%): Critical - immediate irrigation needed
- Dry (15-25%): Irrigation recommended soon
- Ideal (25-40%): Optimal moisture for most crops
- Moist (40-55%): Good moisture, monitor for excess
- Saturated (>55%): Risk of waterlogging, avoid irrigation

SOIL TEMP GUIDE:
- Cold (<10°C): Slow growth, delay planting
- Cool (10-15°C): Suitable for cool-season crops
- Optimal (15-25°C): Ideal for most crops
- Warm (25-30°C): Monitor stress, increase irrigation
- Hot (>30°C): Heat stress risk, critical monitoring
${weatherContext}
Probe Data (latest readings):
${JSON.stringify(probeDataForAI, null, 2)}

Provide a practical analysis in 3-5 sentences that considers BOTH current soil conditions AND upcoming weather. If rain is forecast, adjust irrigation advice accordingly. If hot weather is coming, factor that into moisture management. Focus on actionable insights for farm operations. Keep it under 150 words.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful agricultural advisor providing concise, actionable soil analysis for farmers.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('OpenAI API error:', await aiResponse.text());
      return buildBasicProbeReport(latestReadings, connections);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0]?.message?.content || '';

    if (!analysis) {
      return buildBasicProbeReport(latestReadings, connections);
    }

    const detailedReadings = latestReadings.slice(0, 5).map((reading: any) => {
      const connection = connections.find((c: any) => c.id === reading.connection_id);
      const moistureDepths = reading.moisture_depths?.depths || [];
      const soilTempDepths = reading.soil_temp_depths?.depths || [];

      return buildProbeReadingCard(reading, connection, moistureDepths, soilTempDepths);
    }).join('');

    return `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 10px; padding: 16px; margin-top: 20px;">
        <div style="font-size: 12px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          🌱 AI Soil Analysis & Recommendations
        </div>
        <div style="font-size: 13px; color: #78350f; line-height: 1.6; font-weight: 500; margin-bottom: 12px;">
          ${analysis}
        </div>
        <div style="font-size: 10px; color: #92400e; font-weight: 600;">
          Analysis based on ${latestReadings.length} active probe${latestReadings.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style="margin-top: 16px;">
        <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 8px;">
          📊 Detailed Probe Readings
        </div>
        ${detailedReadings}
      </div>
    `;
  } catch (error) {
    console.error('Error generating probe report:', error);
    return '';
  }
}

function getMoistureStatus(moisturePercent: number): { status: string; color: string; bgColor: string; icon: string } {
  if (moisturePercent < 15) {
    return { status: 'Very Dry', color: '#dc2626', bgColor: '#fee2e2', icon: '🔴' };
  } else if (moisturePercent >= 15 && moisturePercent < 25) {
    return { status: 'Dry', color: '#f59e0b', bgColor: '#fef3c7', icon: '🟡' };
  } else if (moisturePercent >= 25 && moisturePercent <= 40) {
    return { status: 'Ideal', color: '#059669', bgColor: '#d1fae5', icon: '🟢' };
  } else if (moisturePercent > 40 && moisturePercent <= 55) {
    return { status: 'Moist', color: '#3b82f6', bgColor: '#dbeafe', icon: '🔵' };
  } else {
    return { status: 'Saturated', color: '#6366f1', bgColor: '#e0e7ff', icon: '💧' };
  }
}

function getSoilTempStatus(tempC: number): { status: string; color: string } {
  if (tempC < 10) {
    return { status: 'Cold', color: '#3b82f6' };
  } else if (tempC >= 10 && tempC < 15) {
    return { status: 'Cool', color: '#10b981' };
  } else if (tempC >= 15 && tempC <= 25) {
    return { status: 'Optimal', color: '#059669' };
  } else if (tempC > 25 && tempC <= 30) {
    return { status: 'Warm', color: '#f59e0b' };
  } else {
    return { status: 'Hot', color: '#dc2626' };
  }
}

function buildBasicProbeReport(readings: any[], connections: any[]): string {
  const readingCards = readings.slice(0, 5).map((reading: any) => {
    const connection = connections.find((c: any) => c.id === reading.connection_id);
    const moistureDepths = reading.moisture_depths?.depths || [];
    const soilTempDepths = reading.soil_temp_depths?.depths || [];

    return buildProbeReadingCard(reading, connection, moistureDepths, soilTempDepths);
  }).join('');

  return `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 10px; padding: 16px; margin-top: 20px;">
      <div style="font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 8px;">
        🌱 Soil Moisture Readings
      </div>
      <div style="font-size: 13px; color: #78350f; line-height: 1.6; font-weight: 500;">
        Latest data from ${readings.length} active probe${readings.length > 1 ? 's' : ''} in your field.
      </div>
    </div>

    <div style="margin-top: 16px;">
      ${readingCards}
    </div>
  `;
}

function buildProbeReadingCard(reading: any, connection: any, moistureDepths: any[], soilTempDepths: any[]): string {
  const probeName = connection?.friendly_name || reading.station_id || 'Probe Station';
  const lastUpdate = new Date(reading.measured_at).toLocaleString('en-AU', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const moistureRows = moistureDepths.length > 0
    ? moistureDepths.map((d: any) => {
        const moistStatus = getMoistureStatus(d.value);
        return `
        <tr>
          <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">💧 ${d.depth_cm}cm depth</td>
          <td style="padding: 6px 8px; text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #047857;">${d.value}%</div>
            <div style="font-size: 9px; font-weight: 700; color: ${moistStatus.color}; margin-top: 2px;">${moistStatus.icon} ${moistStatus.status}</div>
          </td>
        </tr>
      `;
      }).join('')
    : reading.moisture_percent
    ? (() => {
        const moistStatus = getMoistureStatus(reading.moisture_percent);
        return `<tr>
        <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">💧 Moisture</td>
        <td style="padding: 6px 8px; text-align: right;">
          <div style="font-size: 12px; font-weight: 800; color: #047857;">${reading.moisture_percent}%</div>
          <div style="font-size: 9px; font-weight: 700; color: ${moistStatus.color}; margin-top: 2px;">${moistStatus.icon} ${moistStatus.status}</div>
        </td>
      </tr>`;
      })()
    : '';

  const soilTempRows = soilTempDepths.length > 0
    ? soilTempDepths.map((d: any) => {
        const tempStatus = getSoilTempStatus(d.value);
        return `
        <tr>
          <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">🌡️ Soil ${d.depth_cm}cm</td>
          <td style="padding: 6px 8px; text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #047857;">${d.value}°C</div>
            <div style="font-size: 9px; font-weight: 700; color: ${tempStatus.color}; margin-top: 2px;">${tempStatus.status}</div>
          </td>
        </tr>
      `;
      }).join('')
    : reading.soil_temp_c
    ? (() => {
        const tempStatus = getSoilTempStatus(reading.soil_temp_c);
        return `<tr>
        <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">🌡️ Soil Temp</td>
        <td style="padding: 6px 8px; text-align: right;">
          <div style="font-size: 12px; font-weight: 800; color: #047857;">${reading.soil_temp_c}°C</div>
          <div style="font-size: 9px; font-weight: 700; color: ${tempStatus.color}; margin-top: 2px;">${tempStatus.status}</div>
        </td>
      </tr>`;
      })()
    : '';

  const extraRows = `
    ${reading.air_temp_c ? `
      <tr>
        <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">🌤️ Air Temp</td>
        <td style="padding: 6px 8px; font-size: 12px; font-weight: 800; color: #047857; text-align: right;">${reading.air_temp_c}°C</td>
      </tr>
    ` : ''}
    ${reading.humidity_percent ? `
      <tr>
        <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">💨 Humidity</td>
        <td style="padding: 6px 8px; font-size: 12px; font-weight: 800; color: #047857; text-align: right;">${reading.humidity_percent}%</td>
      </tr>
    ` : ''}
    ${reading.battery_level ? `
      <tr>
        <td style="padding: 6px 8px; font-size: 11px; color: #065f46; font-weight: 600;">🔋 Battery</td>
        <td style="padding: 6px 8px; font-size: 12px; font-weight: 800; color: ${reading.battery_level < 20 ? '#dc2626' : '#047857'}; text-align: right;">${reading.battery_level}%</td>
      </tr>
    ` : ''}
  `;

  return `
    <div style="background: white; border: 2px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
      <div style="font-size: 12px; font-weight: 800; color: #047857; margin-bottom: 6px;">
        ${probeName}
      </div>
      <div style="font-size: 9px; color: #6b7280; margin-bottom: 8px; font-weight: 600;">
        Last update: ${lastUpdate}
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${moistureRows}
        ${soilTempRows}
        ${extraRows}
      </table>
    </div>
  `;
}

function buildDailyForecastEmail(weatherData: any, hourlyForecast: any[], probeReport: string = ''): string {
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

  const windDir = degreesToDirection(current.wind_degree);

  const next24Hours = hourlyForecast.slice(0, 24);
  let bestSprayWindow = 'No ideal window';
  let bestWindowTime = '';

  const rainPeriods: string[] = [];
  for (const hour of next24Hours) {
    const hourDeltaT = calculateDeltaT(hour.temp, hour.humidity);
    const hourWindSpeed = hour.wind_speed * 3.6;
    const hourRainLikely = (hour.pop || 0) > 0.5;
    if (!hourRainLikely &&
        hourWindSpeed >= 3 && hourWindSpeed <= 15 &&
        hourDeltaT >= 2 && hourDeltaT <= 8 &&
        hour.temp >= 10 && hour.temp <= 28) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
      bestSprayWindow = 'Ideal';
      bestWindowTime = time;
      break;
    }

    if ((hour.pop || 0) > 0.5) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
      const prob = Math.round((hour.pop || 0) * 100);
      rainPeriods.push(`${time} (${prob}%)`);
    }
  }

  const rainTimingText = rainPeriods.length > 0
    ? `Expected around: ${rainPeriods.slice(0, 3).join(', ')}`
    : 'No significant rain expected in next 24 hours';

  const fiveDayForecast = forecast.slice(0, 5).map((day: any) => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
    const windDeg = day.day.avg_wind_deg ?? 0;
    const avgWindKph = day.hour?.length > 0
      ? day.hour.reduce((s: number, h: any) => s + h.wind_speed_kph, 0) / day.hour.length
      : day.day.maxwind_kph;
    const sprayResult = getBestSprayWindowFromHours(day.hour || [], day.day.totalprecip_mm);

    return {
      dayName,
      date: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      high: Math.round(day.day.maxtemp_c),
      low: Math.round(day.day.mintemp_c),
      rain: day.day.totalprecip_mm.toFixed(1),
      rainChance: day.day.daily_chance_of_rain,
      wind: Math.round(avgWindKph),
      windDir: degreesToDirection(windDeg),
      sprayIcon: sprayResult.icon,
      sprayTime: sprayResult.timeRange,
      sprayWindDir: sprayResult.windDir,
    };
  });

  const sprayBadgeColor = bestSprayWindow === 'Ideal' ? '#16a34a' : '#64748b';
  const deltaTBg = deltaTCond.color;

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
      background-color: #0f172a;
      padding: 24px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.8);
      border: 1px solid #334155;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-bottom: 1px solid #334155;
      padding: 28px 28px 24px;
      text-align: center;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      color: #f1f5f9;
      letter-spacing: -0.5px;
    }
    .brand-tag {
      font-size: 11px;
      font-weight: 600;
      color: #4ade80;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .location-pill {
      display: inline-block;
      background: rgba(74,222,128,0.12);
      border: 1px solid rgba(74,222,128,0.25);
      border-radius: 999px;
      padding: 6px 18px;
      font-size: 14px;
      font-weight: 700;
      color: #86efac;
      margin-bottom: 6px;
    }
    .date-line {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .content { padding: 24px; }

    .section-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #4ade80;
      margin-bottom: 12px;
    }

    .card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-cell {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }

    .stat-icon { font-size: 22px; margin-bottom: 6px; }

    .stat-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: #f1f5f9;
      line-height: 1.1;
    }

    .stat-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 3px;
      font-weight: 500;
    }

    .ops-row {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .ops-label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .badge {
      font-size: 11px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 6px;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rain-card {
      background: linear-gradient(135deg, #0c1a2e 0%, #0f172a 100%);
      border: 1px solid #1d4ed8;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .rain-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #60a5fa;
      margin-bottom: 6px;
    }

    .rain-value {
      font-size: 28px;
      font-weight: 800;
      color: #93c5fd;
      margin-bottom: 4px;
    }

    .rain-timing {
      font-size: 12px;
      color: #60a5fa;
      font-weight: 600;
    }

    .forecast-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #334155;
    }

    .forecast-table thead tr {
      background: #0f172a;
    }

    .forecast-table th {
      padding: 10px 8px;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4ade80;
      font-size: 10px;
      border-bottom: 1px solid #334155;
    }

    .forecast-table th:first-child { text-align: left; padding-left: 14px; }

    .forecast-table td {
      padding: 11px 8px;
      border-bottom: 1px solid #1e293b;
      vertical-align: middle;
    }

    .forecast-table td:first-child { padding-left: 14px; }

    .forecast-table tr:last-child td { border-bottom: none; }

    .forecast-table tr:nth-child(odd) { background: #1e293b; }
    .forecast-table tr:nth-child(even) { background: #172033; }

    .footer {
      background: #0a0f1a;
      border-top: 1px solid #1e293b;
      color: #475569;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
    }

    .footer-brand {
      font-size: 15px;
      font-weight: 800;
      color: #4ade80;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }

    .footer a { color: #4ade80; text-decoration: none; font-weight: 600; }

    @media only screen and (max-width: 600px) {
      .stat-grid { grid-template-columns: 1fr; }
    }
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
      <div class="location-pill">${location}, ${country}</div>
      <div class="date-line" style="margin-top:8px;">${new Date(Date.now() + 11 * 60 * 60 * 1000).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <div class="content">

      <div class="section-label">Today's Forecast</div>
      <div class="card" style="padding:16px;">
        <div class="stat-grid">
          <div class="stat-cell">
            <div class="stat-icon">🌡️</div>
            <div class="stat-label">High</div>
            <div class="stat-value" style="color:#fca5a5;">${Math.round(highTemp)}°C</div>
            <div class="stat-sub">Maximum</div>
          </div>
          <div class="stat-cell">
            <div class="stat-icon">🌡️</div>
            <div class="stat-label">Low</div>
            <div class="stat-value" style="color:#93c5fd;">${Math.round(lowTemp)}°C</div>
            <div class="stat-sub">Minimum</div>
          </div>
          <div class="stat-cell">
            <div class="stat-icon">💧</div>
            <div class="stat-label">Rain Expected</div>
            <div class="stat-value" style="color:#7dd3fc;">${rainToday.toFixed(1)}mm</div>
            <div class="stat-sub">${rainChance}% chance</div>
          </div>
          <div class="stat-cell">
            <div class="stat-icon">💨</div>
            <div class="stat-label">Wind</div>
            <div class="stat-value" style="color:#86efac;">${Math.round(current.wind_kph)}</div>
            <div class="stat-sub">km/h ${windDir}</div>
          </div>
        </div>
      </div>

      <div class="rain-card">
        <div class="rain-label">Rainfall Timing</div>
        <div class="rain-value">${rainToday.toFixed(1)}mm</div>
        <div class="rain-timing">${rainTimingText}</div>
      </div>

      <div class="section-label">Farm Operations</div>
      <div style="margin-bottom:16px;">
        <div class="ops-row">
          <span class="ops-label">Best Spray Window</span>
          <span class="badge" style="background:${sprayBadgeColor};">${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor'}</span>
        </div>
        <div class="ops-row">
          <span class="ops-label">Delta T Index</span>
          <span class="badge" style="background:${deltaTBg};">${deltaT.toFixed(1)}°C &mdash; ${deltaTCond.rating}</span>
        </div>
        ${getPlantingConditions(weatherData, next24Hours)}
        ${getIrrigationAdvice(rainToday, rainChance, current.temp_c, current.humidity)}
      </div>

      ${probeReport}

      <div class="section-label" style="margin-top:8px;">5-Day Forecast</div>
      <table class="forecast-table">
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
          ${fiveDayForecast.map((day: any) => `
            <tr>
              <td>
                <div style="font-size:13px;font-weight:800;color:#e2e8f0;">${day.dayName}</div>
                <div style="font-size:10px;color:#64748b;font-weight:600;margin-top:2px;">${day.date}</div>
              </td>
              <td style="text-align:center;">
                <div style="font-size:14px;font-weight:800;color:#fca5a5;">${day.high}°</div>
                <div style="font-size:11px;font-weight:700;color:#93c5fd;margin-top:2px;">${day.low}°</div>
              </td>
              <td style="text-align:center;">
                <div style="font-size:13px;font-weight:800;color:#7dd3fc;">${day.rain}mm</div>
                <div style="font-size:10px;font-weight:600;color:#64748b;margin-top:2px;">${day.rainChance}%</div>
              </td>
              <td style="text-align:center;">
                <div style="font-size:12px;font-weight:700;color:#86efac;">${day.wind} km/h</div>
                <div style="font-size:10px;font-weight:600;color:#64748b;margin-top:2px;">${day.windDir}</div>
              </td>
              <td style="text-align:center;">
                <div style="font-size:18px;">${day.sprayIcon}</div>
                ${day.sprayTime ? `<div style="font-size:9px;font-weight:600;color:#94a3b8;margin-top:2px;">${day.sprayTime}</div>` : ''}
              </td>
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
        FarmCast Weather Services &mdash; Sent to daily forecast subscribers<br>
        $2.99/month, billed monthly. Cancel anytime in settings.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

function getPlantingConditions(weatherData: any, _hourlyForecast: any[]): string {
  const todayForecast = weatherData.forecast.forecastday[0].day;
  const highTemp = todayForecast?.maxtemp_c || 0;
  const lowTemp = todayForecast?.mintemp_c || 0;
  const rainToday = todayForecast?.totalprecip_mm || 0;
  const windSpeed = weatherData.current.wind_kph;

  let rating = 'Good';
  let color = '#16a34a';

  if (rainToday > 5 || windSpeed > 25) {
    rating = 'Poor';
    color = '#dc2626';
  } else if (highTemp > 35 || lowTemp < 5 || rainToday > 2) {
    rating = 'Moderate';
    color = '#d97706';
  } else if (highTemp >= 15 && highTemp <= 28 && rainToday < 2 && windSpeed < 15) {
    rating = 'Excellent';
    color = '#16a34a';
  }

  return `
    <div class="ops-row">
      <span class="ops-label">🌱 Planting Conditions</span>
      <span class="badge" style="background:${color};">${rating}</span>
    </div>
  `;
}

function getIrrigationAdvice(rainToday: number, rainChance: number, temp: number, humidity: number): string {
  let advice = 'Not Needed';
  let color = '#475569';

  const evapotranspiration = temp > 25 && humidity < 60;

  if (rainToday < 5 && rainChance < 30) {
    if (evapotranspiration) {
      advice = 'Recommended';
      color = '#1d4ed8';
    } else if (rainToday < 2) {
      advice = 'Consider';
      color = '#d97706';
    }
  }

  return `
    <div class="ops-row">
      <span class="ops-label">💧 Irrigation</span>
      <span class="badge" style="background:${color};">${advice}</span>
    </div>
  `;
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

  const next24Hours = hourlyForecast.slice(0, 24);
  let bestSprayWindow = 'No ideal window';
  let bestWindowTime = '';

  const rainPeriods: string[] = [];
  for (const hour of next24Hours) {
    const hourDeltaT = calculateDeltaT(hour.temp, hour.humidity);
    const hourWindSpeed = hour.wind_speed * 3.6;
    const hourRainLikely = (hour.pop || 0) > 0.5;
    if (!hourRainLikely &&
        hourWindSpeed >= 3 && hourWindSpeed <= 15 &&
        hourDeltaT >= 2 && hourDeltaT <= 8 &&
        hour.temp >= 10 && hour.temp <= 28) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
      bestSprayWindow = 'Ideal';
      bestWindowTime = time;
      break;
    }

    if ((hour.pop || 0) > 0.5) {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
      const prob = Math.round((hour.pop || 0) * 100);
      rainPeriods.push(`${time} (${prob}%)`);
    }
  }

  const rainTimingText = rainPeriods.length > 0
    ? `Expected around: ${rainPeriods.slice(0, 3).join(', ')}`
    : 'No significant rain expected in next 24 hours';

  const fiveDayForecast = forecast.slice(0, 5).map((day: any) => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
    const windDeg = day.day.avg_wind_deg ?? 0;
    const avgWindKph = day.hour?.length > 0
      ? day.hour.reduce((s: number, h: any) => s + h.wind_speed_kph, 0) / day.hour.length
      : day.day.maxwind_kph;
    const sprayResult = getBestSprayWindowFromHours(day.hour || [], day.day.totalprecip_mm);

    return {
      dayName,
      date: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      high: Math.round(day.day.maxtemp_c),
      low: Math.round(day.day.mintemp_c),
      rain: day.day.totalprecip_mm.toFixed(1),
      rainChance: day.day.daily_chance_of_rain,
      wind: Math.round(avgWindKph),
      windDir: degreesToDirection(windDeg),
      sprayIcon: sprayResult.icon,
      sprayTime: sprayResult.timeRange,
    };
  });

  return `
FARMCAST DAILY FORECAST
${cityName}, ${country}
${new Date(Date.now() + 11 * 60 * 60 * 1000).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

TODAY'S FORECAST:
- Actual High: ${Math.round(highTemp)}°C
- Actual Low: ${Math.round(lowTemp)}°C
- Rain Expected: ${rainToday.toFixed(1)}mm (${rainChance}% chance)
- Rain Timing: ${rainTimingText}
- Wind: ${Math.round(current.wind_kph)} km/h ${windDir}
- Humidity: ${current.humidity}%

SPRAY WINDOW ANALYSIS:
- Spray Conditions: ${sprayCond.rating}
- Delta T: ${deltaT.toFixed(1)}°C - ${deltaTCond.rating}
- Best Window Today: ${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor conditions'}

5-DAY FORECAST:
${fiveDayForecast.map((day: any) =>
  `${day.dayName} ${day.date}: High ${day.high}°C / Low ${day.low}°C | Rain: ${day.rain}mm (${day.rainChance}%) | Wind: ${day.wind} km/h ${day.windDir} | Spray: ${day.sprayIcon}${day.sprayTime ? ' ' + day.sprayTime : ''}`
).join('\n')}

Spray Window Key: ✅ Ideal · ✓ Good · ⚠️ Marginal · ❌ Poor

24-HOUR FORECAST WITH DELTA T:
${next24Hours.slice(0, 12).map((hour: any) => {
  const hourTime = new Date(hour.dt * 1000);
  const timeStr = hourTime.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
  const temp = Math.round(hour.temp);
  const rainProb = Math.round((hour.pop || 0) * 100);
  const weatherMain = hour.weather[0]?.main || 'Clear';
  const hourDeltaT = calculateDeltaT(hour.temp, hour.humidity);
  const hourWindSpeed = Math.round(hour.wind_speed * 3.6);
  const deltaTCond = getDeltaTCondition(hourDeltaT);
  return `${timeStr}: ${temp}°C, ${weatherMain}, ${rainProb}% rain, Wind ${hourWindSpeed}km/h, ΔT ${hourDeltaT.toFixed(1)} (${deltaTCond.rating})`;
}).join('\n')}

Delta T Guide: 2-8=Excellent | 8-10=Good | 10-14=Marginal | <2 or >14=Poor

Visit your dashboard: https://farmcastweather.com
Manage preferences: https://farmcastweather.com/settings
Unsubscribe: https://farmcastweather.com/unsubscribe

FarmCast Weather Services
Sent to subscribers of daily weather forecasts

Your subscription: $2.99/month, billed monthly. Cancel anytime in settings.
  `.trim();
}
