import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Open-Meteo ERA5 climate normals — 30-year historical averages, no API key needed.
// Returns daily temp max/min, precipitation and windspeed for the next 30 days.
async function fetchClimateNormals(lat: string, lon: string): Promise<any[]> {
  const today = new Date();
  const startDate = today.toISOString().split("T")[0];
  const end = new Date(today);
  end.setDate(end.getDate() + 29);
  const endDate = end.toISOString().split("T")[0];

  const url =
    `https://climate-api.open-meteo.com/v1/climate` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&models=CMIP6_MRI_ESM2_0` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_mean`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log("Climate API failed:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const days: string[] = data.daily?.time || [];
    return days.map((date: string, i: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max?.[i] ?? null,
      tempMin: data.daily.temperature_2m_min?.[i] ?? null,
      precipitation: data.daily.precipitation_sum?.[i] ?? 0,
      windspeedKmh: data.daily.windspeed_10m_mean?.[i] ?? 10,
    }));
  } catch (e) {
    console.log("Climate API error:", e);
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      return new Response(JSON.stringify({ error: "Missing lat or lon parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: configData } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "openweather_api_key")
      .maybeSingle();

    const apiKey =
      configData?.value ||
      Deno.env.get("FARMCAST_OPENWEATHER_NEW_KEY") ||
      Deno.env.get("FARMCAST_OPENWEATHER_STARTUP_KEY") ||
      Deno.env.get("OPENWEATHER_API_KEY") ||
      Deno.env.get("API_KEY_FARMCAST");

    // Fetch real forecast and climate normals in parallel
    const [climateNormals, oneCallResponse] = await Promise.all([
      fetchClimateNormals(lat, lon),
      fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
    ]);

    console.log(`Climate normals fetched: ${climateNormals.length} days`);

    const buildHistoricalDay = (i: number, norm: any, baseDt: number, daysFromLast: number, lastReal: any) => {
      let tempMax: number;
      let tempMin: number;
      let windSpeedMs: number;
      let pop: number;
      const isHistorical = norm?.tempMax !== null && norm?.tempMax !== undefined;

      if (isHistorical) {
        // Small natural jitter so days don't all look identical
        const jitter = Math.sin(i * 2.7) * 0.8;
        tempMax = Math.round((norm.tempMax + jitter) * 10) / 10;
        tempMin = Math.round((norm.tempMin + jitter * 0.6) * 10) / 10;
        // Open-Meteo gives km/h, OpenWeather uses m/s
        windSpeedMs = Math.max(0.5, (norm.windspeedKmh ?? 10) / 3.6);
        // Derive rain chance from mm precipitation (10mm → ~100%)
        pop = Math.min(0.95, Math.max(0, (norm.precipitation ?? 0) / 10));
      } else {
        // Last resort fallback — use last real day with minimal sine variation
        const variation = Math.sin(daysFromLast / 60 * Math.PI) * 1;
        tempMax = Math.round(lastReal.temp.max + variation);
        tempMin = Math.round(lastReal.temp.min + variation * 0.5);
        windSpeedMs = lastReal.wind_speed;
        pop = lastReal.pop ?? 0.3;
      }

      const tempDay = Math.round((tempMax + tempMin) / 2);

      return {
        dt: baseDt + daysFromLast * 86400,
        sunrise: lastReal.sunrise + daysFromLast * 86400,
        sunset: lastReal.sunset + daysFromLast * 86400,
        temp: {
          min: tempMin,
          max: tempMax,
          day: tempDay,
          night: Math.round(tempMin - 1),
          eve: Math.round(tempMax - 2),
          morn: Math.round(tempMin + 1),
        },
        feels_like: {
          day: tempDay - 1,
          night: tempMin - 2,
          eve: tempMax - 3,
          morn: tempMin,
        },
        pressure: lastReal.pressure,
        humidity: lastReal.humidity,
        dew_point: tempMin - 2,
        wind_speed: windSpeedMs,
        wind_deg: lastReal.wind_deg,
        wind_gust: windSpeedMs * 1.4,
        weather: [{
          id: pop > 0.4 ? 803 : 800,
          main: pop > 0.4 ? "Clouds" : "Clear",
          description: pop > 0.4 ? "scattered clouds" : "clear sky",
          icon: pop > 0.4 ? "03d" : "01d",
        }],
        clouds: Math.round(pop * 90),
        pop,
        rain: pop > 0.5 ? pop * 4 : 0,
        uvi: lastReal.uvi || 5,
        isReal: false,
        isHistorical,
      };
    };

    if (oneCallResponse.ok) {
      const oneCallData = await oneCallResponse.json();
      const realDailyData: any[] = oneCallData.daily || [];
      const lastReal = realDailyData[realDailyData.length - 1];

      const extendedDaily = Array.from({ length: 30 }, (_, i) => {
        if (i < realDailyData.length) {
          return { ...realDailyData[i], isReal: true, isHistorical: false };
        }
        const daysFromLast = i - realDailyData.length + 1;
        return buildHistoricalDay(i, climateNormals[i], lastReal.dt, daysFromLast, lastReal);
      });

      return new Response(JSON.stringify({
        current: oneCallData.current,
        hourly: oneCallData.hourly,
        daily: extendedDaily,
        alerts: oneCallData.alerts || [],
        timezone: oneCallData.timezone,
        timezone_offset: oneCallData.timezone_offset,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to free OpenWeather 2.5 API
    console.log("One Call 3.0 not available, using free API endpoints");

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error(`Weather fetch failed: ${currentResponse.status} / ${forecastResponse.status}`);
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const hourly = (() => {
      const out: any[] = [];
      const list = forecastData.list;
      for (let i = 0; i < list.length - 1 && out.length < 48; i++) {
        const curr = list[i];
        const next = list[i + 1];
        out.push({
          dt: curr.dt,
          temp: curr.main.temp,
          feels_like: curr.main.feels_like,
          pressure: curr.main.pressure,
          humidity: curr.main.humidity,
          dew_point: curr.main.temp - ((100 - curr.main.humidity) / 5),
          clouds: curr.clouds.all,
          visibility: curr.visibility,
          wind_speed: curr.wind.speed,
          wind_deg: curr.wind.deg,
          wind_gust: curr.wind.gust,
          weather: curr.weather,
          pop: curr.pop,
          rain: curr.rain ? { "1h": (curr.rain["3h"] || 0) / 3 } : undefined,
        });
        const steps = Math.floor((next.dt - curr.dt) / 3600);
        for (let step = 1; step < steps && out.length < 48; step++) {
          const r = step / steps;
          out.push({
            dt: curr.dt + step * 3600,
            temp: curr.main.temp + (next.main.temp - curr.main.temp) * r,
            feels_like: curr.main.feels_like + (next.main.feels_like - curr.main.feels_like) * r,
            pressure: curr.main.pressure + (next.main.pressure - curr.main.pressure) * r,
            humidity: Math.round(curr.main.humidity + (next.main.humidity - curr.main.humidity) * r),
            dew_point: (curr.main.temp + (next.main.temp - curr.main.temp) * r) - ((100 - (curr.main.humidity + (next.main.humidity - curr.main.humidity) * r)) / 5),
            clouds: Math.round(curr.clouds.all + (next.clouds.all - curr.clouds.all) * r),
            visibility: curr.visibility,
            wind_speed: curr.wind.speed + (next.wind.speed - curr.wind.speed) * r,
            wind_deg: curr.wind.deg,
            wind_gust: curr.wind.gust ? curr.wind.gust + ((next.wind.gust || curr.wind.gust) - curr.wind.gust) * r : undefined,
            weather: curr.weather,
            pop: curr.pop + (next.pop - curr.pop) * r,
            rain: curr.rain ? { "1h": (curr.rain["3h"] || 0) / 3 } : undefined,
          });
        }
      }
      return out.slice(0, 48);
    })();

    // Fake lastReal object from free API for historical fallback
    const freeLastItem = forecastData.list[forecastData.list.length - 1];
    const freeLastReal = {
      temp: { max: freeLastItem.main.temp_max, min: freeLastItem.main.temp_min },
      wind_speed: freeLastItem.wind.speed,
      pop: freeLastItem.pop ?? 0.3,
      pressure: freeLastItem.main.pressure,
      humidity: freeLastItem.main.humidity,
      sunrise: 0,
      sunset: 0,
      wind_deg: freeLastItem.wind.deg,
      uvi: 5,
    };
    const now = Date.now() / 1000;

    const daily = Array.from({ length: 30 }, (_, i) => {
      if (i < 5) {
        const dayStart = i * 8;
        const dayData = forecastData.list.slice(dayStart, dayStart + 8);
        if (dayData.length === 0) return null;
        const totalRain = dayData
          .filter((d: any) => d.rain?.["3h"] > 0)
          .reduce((sum: number, d: any) => sum + (d.rain?.["3h"] || 0), 0);
        return {
          dt: dayData[0].dt,
          temp: {
            min: Math.min(...dayData.map((d: any) => d.main.temp_min)),
            max: Math.max(...dayData.map((d: any) => d.main.temp_max)),
            day: Math.round(dayData.reduce((s: number, d: any) => s + d.main.temp, 0) / dayData.length),
          },
          humidity: Math.round(dayData.reduce((s: number, d: any) => s + d.main.humidity, 0) / dayData.length),
          wind_speed: Math.max(...dayData.map((d: any) => d.wind.speed)),
          weather: dayData[0].weather,
          pop: Math.max(...dayData.map((d: any) => d.pop || 0)),
          rain: totalRain,
          isReal: true,
          isHistorical: false,
        };
      }

      const norm = climateNormals[i];
      const daysFromNow = i + 1;
      return buildHistoricalDay(i, norm, now, daysFromNow, freeLastReal);
    }).filter(Boolean);

    return new Response(JSON.stringify({
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
      hourly,
      daily,
      alerts: [],
      timezone: currentData.timezone,
      timezone_offset: currentData.timezone_offset ?? 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching weather:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
