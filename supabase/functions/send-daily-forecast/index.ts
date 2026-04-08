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

    const weatherApiKey = Deno.env.get('FARMCAST_OPENWEATHER_NEW_KEY') || Deno.env.get('OPENWEATHER_API_KEY');
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

        const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
        const oneCallResponse = await fetch(oneCallUrl);

        if (!oneCallResponse.ok) {
          const errorText = await oneCallResponse.text();
          const errorMsg = `Failed to fetch weather data for ${subscriber.email}: ${oneCallResponse.status} - ${errorText}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const oneCallData = await oneCallResponse.json();

        const weatherData = transformWeatherDataFromOneCall(oneCallData, name, country);

        let probeReport = '';
        if (subscriber.user_id) {
          probeReport = await generateProbeReport(subscriber.user_id, supabaseAdmin, weatherData, oneCallData.daily);
        }

        const emailHtml = buildDailyForecastEmail(weatherData, oneCallData.hourly, probeReport);

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
            text: buildDailyForecastEmailText(weatherData, oneCallData.hourly, name, country),
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
  const date = new Date(day.dt * 1000).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
  return `Day ${i + 1} (${date}):
  - Temp: ${day.temp.min}°C to ${day.temp.max}°C
  - Rain chance: ${Math.round((day.pop || 0) * 100)}%
  - Expected rainfall: ${((day.rain || 0) + (day.snow || 0)).toFixed(1)}mm
  - Conditions: ${day.weather[0].description}`;
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
  const sprayCond = getSprayCondition(current.wind_kph, rainToday);

  const windDir = degreesToDirection(current.wind_degree);

  const next24Hours = hourlyForecast.slice(0, 24);
  let bestSprayWindow = 'No ideal window';
  let bestWindowTime = '';

  const rainPeriods: string[] = [];
  for (const hour of next24Hours) {
    const hourDeltaT = calculateDeltaT(hour.temp, hour.humidity);
    const hourWindSpeed = hour.wind_speed * 3.6;
    if (hourWindSpeed >= 3 && hourWindSpeed <= 15 &&
        hourDeltaT >= 2 && hourDeltaT <= 8 &&
        hour.temp >= 8 && hour.temp <= 30) {
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

  const fiveDayForecast = forecast.slice(0, 5).map((day: any) => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
    const avgWind = day.day.maxwind_kph;
    const avgTemp = (day.day.maxtemp_c + day.day.mintemp_c) / 2;
    const avgHumidity = day.hour?.[12]?.humidity || 60;
    const sprayDeltaT = calculateDeltaT(avgTemp, avgHumidity);
    const sprayWindow = getSprayWindowForDay(avgWind, day.day.totalprecip_mm, sprayDeltaT);

    return {
      dayName,
      date: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      high: Math.round(day.day.maxtemp_c),
      low: Math.round(day.day.mintemp_c),
      rain: day.day.totalprecip_mm.toFixed(1),
      rainChance: day.day.daily_chance_of_rain,
      wind: Math.round(avgWind),
      windDir: degreesToDirection(day.hour?.[12]?.wind_deg || 0),
      sprayWindow
    };
  });

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
            <div class="condition-icon">🌡️</div>
            <div class="condition-label">Actual High</div>
            <div class="condition-value">${Math.round(highTemp)}°C</div>
            <div class="condition-sub">Maximum</div>
          </div>

          <div class="condition-item">
            <div class="condition-icon">🌡️</div>
            <div class="condition-label">Actual Low</div>
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

      <div class="spray-analysis">
        <div class="section-header">Farm Operations Analysis</div>
        <div class="spray-metrics">
          <div class="spray-metric">
            <span class="metric-label">🌾 Best Spray Window</span>
            <span class="metric-badge" style="background: ${bestSprayWindow === 'Ideal' ? '#047857' : '#6b7280'};">
              ${bestSprayWindow === 'Ideal' ? bestWindowTime : 'Monitor'}
            </span>
          </div>
          <div class="spray-metric">
            <span class="metric-label">Delta T</span>
            <span class="metric-badge" style="background: ${deltaTCond.color};">${deltaT.toFixed(1)}°C - ${deltaTCond.rating}</span>
          </div>
          ${getPlantingConditions(weatherData, next24Hours)}
          ${getIrrigationAdvice(rainToday, rainChance, current.temp_c, current.humidity)}
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 10px; padding: 16px; margin-top: 20px;">
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

      ${probeReport}

      <div style="margin-top: 24px;">
        <div class="section-header">5-Day Forecast</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; background: #f9fafb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: linear-gradient(135deg, #047857 0%, #065f46 100%); color: white;">
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">Day</th>
              <th style="padding: 10px 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">Temps</th>
              <th style="padding: 10px 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">Rain</th>
              <th style="padding: 10px 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">Wind</th>
              <th style="padding: 10px 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">Spray</th>
            </tr>
          </thead>
          <tbody>
            ${fiveDayForecast.map((day: any, index: number) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: 700; color: #047857;">
                  <div style="font-size: 12px; font-weight: 800;">${day.dayName}</div>
                  <div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">${day.date}</div>
                </td>
                <td style="padding: 12px 8px; text-align: center;">
                  <div style="font-size: 15px; font-weight: 800; color: #dc2626;">${day.high}°</div>
                  <div style="font-size: 11px; font-weight: 700; color: #3b82f6; margin-top: 2px;">${day.low}°</div>
                </td>
                <td style="padding: 12px 8px; text-align: center;">
                  <div style="font-size: 13px; font-weight: 800; color: #1e40af;">${day.rain}mm</div>
                  <div style="font-size: 10px; font-weight: 700; color: #3b82f6; margin-top: 2px;">${day.rainChance}%</div>
                </td>
                <td style="padding: 12px 8px; text-align: center;">
                  <div style="font-size: 13px; font-weight: 800; color: #047857;">${day.wind} km/h</div>
                  <div style="font-size: 10px; font-weight: 700; color: #059669; margin-top: 2px;">${day.windDir}</div>
                </td>
                <td style="padding: 12px 8px; text-align: center; font-size: 18px;">${day.sprayWindow}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 8px; font-size: 10px; color: #6b7280; text-align: center; font-weight: 600;">
          Spray Window: ✅ Ideal · ✓ Good · ⚠️ Marginal · ❌ Poor
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
      <p style="margin-top: 12px; font-size: 9px; color: #6b7280; line-height: 1.3; opacity: 0.6;">
        Your subscription: $2.99/month, billed monthly. Cancel anytime in settings.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function getPlantingConditions(weatherData: any, hourlyForecast: any[]): string {
  const todayForecast = weatherData.forecast.forecastday[0].day;
  const highTemp = todayForecast?.maxtemp_c || 0;
  const lowTemp = todayForecast?.mintemp_c || 0;
  const rainToday = todayForecast?.totalprecip_mm || 0;
  const windSpeed = weatherData.current.wind_kph;

  let rating = 'Good';
  let color = '#059669';
  let bgColor = '#d1fae5';

  if (rainToday > 5 || windSpeed > 25) {
    rating = 'Poor';
    color = '#dc2626';
    bgColor = '#fee2e2';
  } else if (highTemp > 35 || lowTemp < 5 || rainToday > 2) {
    rating = 'Moderate';
    color = '#f59e0b';
    bgColor = '#fef3c7';
  } else if (highTemp >= 15 && highTemp <= 28 && rainToday < 2 && windSpeed < 15) {
    rating = 'Excellent';
    color = '#059669';
    bgColor = '#d1fae5';
  }

  return `
    <div class="spray-metric">
      <span class="metric-label">🌱 Planting Conditions</span>
      <span class="metric-badge" style="background: ${color};">${rating}</span>
    </div>
  `;
}

function getIrrigationAdvice(rainToday: number, rainChance: number, temp: number, humidity: number): string {
  let advice = 'Not Needed';
  let color = '#6b7280';
  let bgColor = '#f3f4f6';

  const evapotranspiration = temp > 25 && humidity < 60;

  if (rainToday < 5 && rainChance < 30) {
    if (evapotranspiration) {
      advice = 'Recommended';
      color = '#2563eb';
      bgColor = '#dbeafe';
    } else if (rainToday < 2) {
      advice = 'Consider';
      color = '#f59e0b';
      bgColor = '#fef3c7';
    }
  }

  return `
    <div class="spray-metric">
      <span class="metric-label">💧 Irrigation</span>
      <span class="metric-badge" style="background: ${color};">${advice}</span>
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
    if (hourWindSpeed >= 3 && hourWindSpeed <= 15 &&
        hourDeltaT >= 2 && hourDeltaT <= 8 &&
        hour.temp >= 8 && hour.temp <= 30) {
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

  const fiveDayForecast = forecast.slice(0, 5).map((day: any) => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
    const avgWind = day.day.maxwind_kph;
    const avgTemp = (day.day.maxtemp_c + day.day.mintemp_c) / 2;
    const avgHumidity = day.hour?.[12]?.humidity || 60;
    const sprayDeltaT = calculateDeltaT(avgTemp, avgHumidity);
    const sprayWindow = getSprayWindowForDay(avgWind, day.day.totalprecip_mm, sprayDeltaT);

    return {
      dayName,
      date: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      high: Math.round(day.day.maxtemp_c),
      low: Math.round(day.day.mintemp_c),
      rain: day.day.totalprecip_mm.toFixed(1),
      rainChance: day.day.daily_chance_of_rain,
      wind: Math.round(avgWind),
      windDir: degreesToDirection(day.hour?.[12]?.wind_deg || 0),
      sprayWindow
    };
  });

  return `
FARMCAST DAILY FORECAST
${cityName}, ${country}
${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

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
  `${day.dayName} ${day.date}: High ${day.high}°C / Low ${day.low}°C | Rain: ${day.rain}mm (${day.rainChance}%) | Wind: ${day.wind} km/h ${day.windDir} | Spray: ${day.sprayWindow}`
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
