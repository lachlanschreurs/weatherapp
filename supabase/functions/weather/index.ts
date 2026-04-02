import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

    const apiKey = Deno.env.get("OPENWEATHER_API_KEY") || "205a644e0f57ecf98260a957076e46db";

    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const oneCallResponse = await fetch(oneCallUrl);

    if (oneCallResponse.ok) {
      const oneCallData = await oneCallResponse.json();
      const weatherData = {
        current: oneCallData.current,
        hourly: oneCallData.hourly,
        daily: oneCallData.daily,
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
      hourly: forecastData.list.map((item: any) => ({
        dt: item.dt,
        temp: item.main.temp,
        feels_like: item.main.feels_like,
        pressure: item.main.pressure,
        humidity: item.main.humidity,
        dew_point: item.main.temp - ((100 - item.main.humidity) / 5),
        clouds: item.clouds.all,
        visibility: item.visibility,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        wind_gust: item.wind.gust,
        weather: item.weather,
        pop: item.pop,
      })),
      daily: Array.from({ length: 8 }, (_, i) => {
        const dayStart = i * 8;
        const dayData = forecastData.list.slice(dayStart, dayStart + 8);
        if (dayData.length === 0) return null;

        return {
          dt: dayData[0].dt,
          temp: {
            min: Math.min(...dayData.map((d: any) => d.main.temp_min)),
            max: Math.max(...dayData.map((d: any) => d.main.temp_max)),
          },
          humidity: Math.round(dayData.reduce((sum: number, d: any) => sum + d.main.humidity, 0) / dayData.length),
          wind_speed: Math.max(...dayData.map((d: any) => d.wind.speed)),
          weather: dayData[0].weather,
          pop: Math.max(...dayData.map((d: any) => d.pop || 0)),
        };
      }).filter(Boolean),
      alerts: [],
      timezone: currentData.timezone,
      timezone_offset: currentData.timezone,
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
