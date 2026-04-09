import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "Missing lat or lon parameters" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: configData } = await supabase.from("app_config").select("value").eq("key", "openweather_api_key").maybeSingle();
    const apiKey = configData?.value || Deno.env.get("FARMCAST_OPENWEATHER_NEW_KEY") || Deno.env.get("FARMCAST_OPENWEATHER_STARTUP_KEY") || Deno.env.get("OPENWEATHER_API_KEY") || Deno.env.get("API_KEY_FARMCAST");

    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const oneCallResponse = await fetch(oneCallUrl);

    if (oneCallResponse.ok) {
      const oneCallData = await oneCallResponse.json();
      const realDailyData = oneCallData.daily || [];

      const extendedDaily = Array.from({ length: 30 }, (_, i) => {
        if (i < realDailyData.length) {
          return {
            ...realDailyData[i],
            isReal: true,
          };
        } else {
          const lastRealDay = realDailyData[realDailyData.length - 1];
          const baseTemp = lastRealDay.temp.day;
          const baseTempMin = lastRealDay.temp.min;
          const baseTempMax = lastRealDay.temp.max;
          const baseHumidity = lastRealDay.humidity;
          const baseWind = lastRealDay.wind_speed;

          const daysOut = i - realDailyData.length + 1;
          const seasonalVariation = Math.sin(daysOut / 30 * Math.PI) * 2;

          const estimatedTemp = baseTemp + seasonalVariation;
          const tempVariation = 5;

          const estimatedHumidity = Math.max(30, Math.min(90, baseHumidity));
          const estimatedWind = Math.max(0, baseWind);
          const estimatedPop = lastRealDay.pop ?? 0.3;

          const baseDt = lastRealDay.dt;
          const daysFromLast = i - realDailyData.length + 1;
          const futureDt = baseDt + (daysFromLast * 24 * 60 * 60);

          return {
            dt: futureDt,
            sunrise: lastRealDay.sunrise + (daysFromLast * 24 * 60 * 60),
            sunset: lastRealDay.sunset + (daysFromLast * 24 * 60 * 60),
            temp: {
              min: Math.round(estimatedTemp - tempVariation),
              max: Math.round(estimatedTemp + tempVariation),
              day: Math.round(estimatedTemp),
              night: Math.round(estimatedTemp - 5),
              eve: Math.round(estimatedTemp - 2),
              morn: Math.round(estimatedTemp - 3),
            },
            feels_like: {
              day: Math.round(estimatedTemp - 1),
              night: Math.round(estimatedTemp - 6),
              eve: Math.round(estimatedTemp - 3),
              morn: Math.round(estimatedTemp - 4),
            },
            pressure: lastRealDay.pressure,
            humidity: Math.round(estimatedHumidity),
            dew_point: estimatedTemp - ((100 - estimatedHumidity) / 5),
            wind_speed: estimatedWind,
            wind_deg: lastRealDay.wind_deg,
            wind_gust: estimatedWind * 1.5,
            weather: [{
              id: estimatedPop > 0.3 ? 803 : 800,
              main: estimatedPop > 0.3 ? 'Clouds' : 'Clear',
              description: estimatedPop > 0.3 ? 'scattered clouds' : 'clear sky',
              icon: estimatedPop > 0.3 ? '03d' : '01d',
            }],
            clouds: Math.round(estimatedPop * 100),
            pop: estimatedPop,
            rain: estimatedPop > 0.5 ? estimatedPop * 5 : 0,
            uvi: lastRealDay.uvi || 5,
            isReal: false,
          };
        }
      });

      const weatherData = {
        current: oneCallData.current,
        hourly: oneCallData.hourly,
        daily: extendedDaily,
        alerts: oneCallData.alerts || [],
        timezone: oneCallData.timezone,
        timezone_offset: oneCallData.timezone_offset,
      };

      return new Response(JSON.stringify(weatherData), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    console.log("One Call 3.0 not available, using free API endpoints");

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error(`Failed to fetch weather data: Current ${currentResponse.status}, Forecast ${forecastResponse.status}`);
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const weatherData = {
      current: {
        dt: currentData.dt,
        temp: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        pressure: currentData.main.pressure,
        humidity: currentData.main.humidity,
        dew_point: currentData.main.temp - ((100 - currentData.main.humidity) / 5),
        clouds: currentData.clouds.all,
        visibility: currentData.visibility,
        wind_speed: currentData.wind.speed,
        wind_deg: currentData.wind.deg,
        wind_gust: currentData.wind.gust,
        weather: currentData.weather,
      },
      hourly: (() => {
        const interpolatedHourly = [];
        const forecastList = forecastData.list;

        for (let i = 0; i < forecastList.length - 1 && interpolatedHourly.length < 48; i++) {
          const current = forecastList[i];
          const next = forecastList[i + 1];

          interpolatedHourly.push({
            dt: current.dt,
            temp: current.main.temp,
            feels_like: current.main.feels_like,
            pressure: current.main.pressure,
            humidity: current.main.humidity,
            dew_point: current.main.temp - ((100 - current.main.humidity) / 5),
            clouds: current.clouds.all,
            visibility: current.visibility,
            wind_speed: current.wind.speed,
            wind_deg: current.wind.deg,
            wind_gust: current.wind.gust,
            weather: current.weather,
            pop: current.pop,
            rain: current.rain ? { '1h': (current.rain['3h'] || 0) / 3 } : undefined,
          });

          const timeDiff = next.dt - current.dt;
          const steps = Math.floor(timeDiff / 3600);

          for (let step = 1; step < steps && interpolatedHourly.length < 48; step++) {
            const ratio = step / steps;
            interpolatedHourly.push({
              dt: current.dt + (step * 3600),
              temp: current.main.temp + (next.main.temp - current.main.temp) * ratio,
              feels_like: current.main.feels_like + (next.main.feels_like - current.main.feels_like) * ratio,
              pressure: current.main.pressure + (next.main.pressure - current.main.pressure) * ratio,
              humidity: Math.round(current.main.humidity + (next.main.humidity - current.main.humidity) * ratio),
              dew_point: (current.main.temp + (next.main.temp - current.main.temp) * ratio) - ((100 - (current.main.humidity + (next.main.humidity - current.main.humidity) * ratio)) / 5),
              clouds: Math.round(current.clouds.all + (next.clouds.all - current.clouds.all) * ratio),
              visibility: current.visibility,
              wind_speed: current.wind.speed + (next.wind.speed - current.wind.speed) * ratio,
              wind_deg: current.wind.deg,
              wind_gust: current.wind.gust ? current.wind.gust + ((next.wind.gust || current.wind.gust) - current.wind.gust) * ratio : undefined,
              weather: current.weather,
              pop: current.pop + (next.pop - current.pop) * ratio,
              rain: current.rain ? { '1h': (current.rain['3h'] || 0) / 3 } : undefined,
            });
          }
        }

        return interpolatedHourly.slice(0, 48);
      })(),
      daily: Array.from({ length: 30 }, (_, i) => {
        if (i < 5) {
          const dayStart = i * 8;
          const dayData = forecastData.list.slice(dayStart, dayStart + 8);
          if (dayData.length === 0) return null;

          const rainData = dayData.filter((d: any) => d.rain?.['3h'] > 0);
          const totalRain = rainData.reduce((sum: number, d: any) => sum + (d.rain?.['3h'] || 0), 0);

          return {
            dt: dayData[0].dt,
            temp: {
              min: Math.min(...dayData.map((d: any) => d.main.temp_min)),
              max: Math.max(...dayData.map((d: any) => d.main.temp_max)),
              day: Math.round(dayData.reduce((sum: number, d: any) => sum + d.main.temp, 0) / dayData.length),
            },
            humidity: Math.round(dayData.reduce((sum: number, d: any) => sum + d.main.humidity, 0) / dayData.length),
            wind_speed: Math.max(...dayData.map((d: any) => d.wind.speed)),
            weather: dayData[0].weather,
            pop: Math.max(...dayData.map((d: any) => d.pop || 0)),
            rain: totalRain,
            isReal: true,
          };
        } else {
          const lastRealDay = forecastData.list[forecastData.list.length - 1];
          const baseTemp = lastRealDay.main.temp;
          const baseHumidity = lastRealDay.main.humidity;
          const baseWind = lastRealDay.wind.speed;

          const seasonalVariation = Math.sin((i - 4) / 30 * Math.PI) * 2;

          const estimatedTemp = baseTemp + seasonalVariation;
          const tempVariation = 5;

          const estimatedHumidity = Math.max(30, Math.min(90, baseHumidity));
          const estimatedWind = Math.max(0, baseWind);
          const estimatedPop = lastRealDay.pop ?? 0.3;

          const now = new Date();
          const futureDate = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);

          return {
            dt: Math.floor(futureDate.getTime() / 1000),
            temp: {
              min: Math.round(estimatedTemp - tempVariation),
              max: Math.round(estimatedTemp + tempVariation),
              day: Math.round(estimatedTemp),
            },
            humidity: Math.round(estimatedHumidity),
            wind_speed: estimatedWind,
            weather: [{ main: estimatedPop > 0.3 ? 'Clouds' : 'Clear', description: estimatedPop > 0.3 ? 'scattered clouds' : 'clear sky' }],
            pop: estimatedPop,
            rain: estimatedPop > 0.5 ? estimatedPop * 5 : 0,
            isReal: false,
          };
        }
      }).filter(Boolean),
      alerts: [],
      timezone: currentData.timezone,
      timezone_offset: currentData.timezone_offset ?? 0,
    };

    return new Response(JSON.stringify(weatherData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
