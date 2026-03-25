import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const { weather, location } = await req.json();

    if (!weather || !location) {
      return new Response(
        JSON.stringify({ error: "Missing weather or location data" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const current = weather.current;
    const forecast = weather.forecast?.list || [];

    const temp = Math.round(current.main.temp);
    const humidity = current.main.humidity;
    const windSpeed = Math.round(current.wind.speed * 3.6);
    const conditions = current.weather[0]?.description || "unknown";

    const next24Hours = forecast.slice(0, 8);
    const avgTemp = next24Hours.reduce((sum: number, item: any) => sum + item.main.temp, 0) / next24Hours.length;
    const totalRain = next24Hours.reduce((sum: number, item: any) => sum + (item.rain?.['3h'] || 0), 0);
    const maxWind = Math.max(...next24Hours.map((item: any) => item.wind.speed * 3.6));

    let explanation = `Current weather in ${location}:\n\n`;
    explanation += `Temperature is ${temp}°C with ${conditions}. `;

    if (temp < 5) {
      explanation += "Cold conditions may slow crop growth and increase frost risk. ";
    } else if (temp > 30) {
      explanation += "High temperatures may stress plants and increase water requirements. ";
    } else {
      explanation += "Temperature is within a good range for most farming operations. ";
    }

    if (humidity > 80) {
      explanation += `High humidity (${humidity}%) increases disease pressure and may delay spraying operations. `;
    } else if (humidity < 40) {
      explanation += `Low humidity (${humidity}%) may increase evaporation rates and plant stress. `;
    }

    if (windSpeed < 10) {
      explanation += `Light winds (${windSpeed} km/h) are ideal for spraying operations. `;
    } else if (windSpeed < 20) {
      explanation += `Moderate winds (${windSpeed} km/h) - use caution with drift-sensitive sprays. `;
    } else {
      explanation += `Strong winds (${windSpeed} km/h) make spraying operations risky due to drift concerns. `;
    }

    explanation += `\n\nLooking ahead 24 hours:\n`;
    explanation += `Average temperature will be around ${Math.round(avgTemp)}°C. `;

    if (totalRain > 10) {
      explanation += `Significant rainfall expected (${totalRain.toFixed(1)}mm) - delay field operations and avoid spraying. `;
    } else if (totalRain > 2) {
      explanation += `Light rain possible (${totalRain.toFixed(1)}mm) - monitor conditions closely. `;
    } else {
      explanation += "Dry conditions expected - good window for field work. ";
    }

    if (maxWind > 25) {
      explanation += "Strong winds are forecast - secure equipment and postpone sensitive operations.";
    }

    explanation += "\n\nRecommendations: ";

    if (windSpeed < 15 && totalRain < 2) {
      explanation += "Good conditions for spraying and field operations. ";
    }

    if (totalRain < 5 && temp > 10 && temp < 25) {
      explanation += "Favorable planting conditions if soil moisture is adequate. ";
    }

    if (totalRain > 10) {
      explanation += "Ideal time to postpone operations and allow soil to drain properly.";
    }

    return new Response(
      JSON.stringify({ explanation }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating explanation:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate weather explanation",
        explanation: "Unable to analyze weather data at this time. Please try again later."
      }),
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
