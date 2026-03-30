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

    if (!oneCallResponse.ok) {
      const errorText = await oneCallResponse.text();
      throw new Error(`Failed to fetch weather data from OpenWeather One Call API 3.0: ${oneCallResponse.status} - ${errorText}`);
    }

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
