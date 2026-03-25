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
    const clientId = Deno.env.get('XWEATHER_CLIENT_ID');
    const clientSecret = Deno.env.get('XWEATHER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'XWeather API credentials not configured' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const url = new URL(req.url);
    const lat = url.searchParams.get('lat') || '-38.6341';
    const lon = url.searchParams.get('lon') || '146.0489';

    const forecastUrl = `https://api.aerisapi.com/forecasts/${lat},${lon}?format=json&filter=day&limit=5&client_id=${clientId}&client_secret=${clientSecret}`;
    const observationsUrl = `https://api.aerisapi.com/observations/${lat},${lon}?format=json&client_id=${clientId}&client_secret=${clientSecret}`;

    const [forecastResponse, observationsResponse] = await Promise.all([
      fetch(forecastUrl),
      fetch(observationsUrl),
    ]);

    if (!forecastResponse.ok || !observationsResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data from XWeather' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const forecastData = await forecastResponse.json();
    const observationsData = await observationsResponse.json();

    return new Response(
      JSON.stringify({
        forecast: forecastData,
        observations: observationsData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
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
