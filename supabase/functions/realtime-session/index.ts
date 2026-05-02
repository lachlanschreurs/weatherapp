import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.100.0";

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
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const authHeader = req.headers.get("Authorization");
    const { weatherContext } = await req.json();

    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Try to get authenticated user and their data
    let user = null;
    let profileData = null;
    let probeData: any[] = [];
    let savedLocations: any[] = [];
    let fieldNotes: any[] = [];

    if (authHeader) {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (authUser) {
        user = authUser;

        const [profileRes, probeRes, locationsRes, notesRes] = await Promise.all([
          serviceClient.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabaseClient.from("probe_readings").select("*").order("recorded_at", { ascending: false }).limit(5),
          supabaseClient.from("saved_locations").select("*").eq("user_id", user.id),
          supabaseClient.from("field_notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        ]);

        profileData = profileRes.data;
        probeData = probeRes.data || [];
        savedLocations = locationsRes.data || [];
        fieldNotes = notesRes.data || [];
      }
    }

    // Build rich context
    let contextInfo = "";

    if (weatherContext) {
      contextInfo += "\n\n--- LIVE WEATHER DATA ---";
      if (weatherContext.location) contextInfo += `\nLocation: ${weatherContext.location}`;
      if (weatherContext.tempC !== undefined) contextInfo += `\nTemperature: ${Math.round(weatherContext.tempC)}°C`;
      if (weatherContext.feelsLike !== undefined) contextInfo += ` (feels like ${weatherContext.feelsLike}°C)`;
      if (weatherContext.currentWeather?.weather?.[0]) contextInfo += `\nConditions: ${weatherContext.currentWeather.weather[0].description}`;
      if (weatherContext.humidity !== undefined) contextInfo += `\nHumidity: ${weatherContext.humidity}%`;
      if (weatherContext.dewpointC !== undefined) contextInfo += ` | Dew point: ${weatherContext.dewpointC}°C`;
      if (weatherContext.pressure !== undefined) contextInfo += `\nPressure: ${weatherContext.pressure} hPa`;
      if (weatherContext.uvIndex !== undefined) contextInfo += `\nUV Index: ${weatherContext.uvIndex}`;

      if (weatherContext.wind) {
        contextInfo += `\nWind: ${Math.round(weatherContext.wind.speedKmh)} km/h from ${weatherContext.wind.direction}`;
        if (weatherContext.wind.gustKmh) contextInfo += ` (gusts ${Math.round(weatherContext.wind.gustKmh)} km/h)`;
      }

      if (weatherContext.rainfall) {
        contextInfo += `\nRainfall: ${weatherContext.rainfall.todayExpectedMm?.toFixed(1)} mm expected, ${weatherContext.rainfall.todayChancePct}% chance`;
        if (weatherContext.rainfall.current1h > 0) contextInfo += ` | Currently raining: ${weatherContext.rainfall.current1h.toFixed(1)} mm/hr`;
      }

      if (weatherContext.deltaT !== undefined) {
        contextInfo += `\nDelta T: ${weatherContext.deltaT.toFixed(1)}°C (${weatherContext.deltaTRating || "unknown"} for spraying)`;
      }

      if (weatherContext.sprayWindow) {
        contextInfo += `\nBest spray window: ${weatherContext.sprayWindow.start} to ${weatherContext.sprayWindow.end} (${weatherContext.sprayWindow.rating})`;
      } else {
        contextInfo += `\nSpray window: No suitable window found today`;
      }

      if (weatherContext.frostRisk) {
        contextInfo += `\nFROST RISK: Min ${weatherContext.minTempNext24h}°C expected`;
      } else if (weatherContext.frostWarning) {
        contextInfo += `\nFrost warning: Min ${weatherContext.minTempNext24h}°C overnight`;
      }

      if (weatherContext.soilTempC !== undefined) {
        contextInfo += `\nSoil temp: ${weatherContext.soilTempC.toFixed(1)}°C${weatherContext.probeIsLive ? " (live probe)" : " (estimated)"}`;
      }
      if (weatherContext.soilMoisturePct !== undefined) {
        contextInfo += `\nSoil moisture: ${weatherContext.soilMoisturePct.toFixed(1)}%${weatherContext.probeIsLive ? " (live probe)" : " (estimated)"}`;
      }

      if (weatherContext.daily && weatherContext.daily.length > 0) {
        contextInfo += "\n\n7-day forecast:";
        weatherContext.daily.slice(0, 7).forEach((day: any, i: number) => {
          const date = new Date(day.dt * 1000);
          const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-AU", { weekday: "short" });
          contextInfo += `\n  ${dayName}: ${Math.round(day.temp?.max || 0)}/${Math.round(day.temp?.min || 0)}°C, ${day.weather?.[0]?.description || ""}, rain ${((day.pop || 0) * 100).toFixed(0)}%`;
        });
      }
      contextInfo += "\n--- END WEATHER ---";
    }

    if (probeData.length > 0) {
      contextInfo += "\n\n--- PROBE SENSOR DATA (latest readings) ---";
      for (const reading of probeData) {
        contextInfo += `\n${reading.recorded_at}: Soil temp ${reading.soil_temp_c?.toFixed(1) ?? "N/A"}°C, Moisture ${reading.moisture_percent?.toFixed(1) ?? "N/A"}%`;
        if (reading.moisture_10cm != null) contextInfo += `, 10cm: ${reading.moisture_10cm}%`;
        if (reading.moisture_30cm != null) contextInfo += `, 30cm: ${reading.moisture_30cm}%`;
        if (reading.moisture_60cm != null) contextInfo += `, 60cm: ${reading.moisture_60cm}%`;
      }
      contextInfo += "\n--- END PROBE DATA ---";
    }

    if (savedLocations.length > 0) {
      contextInfo += `\n\nUser's saved farm locations: ${savedLocations.map((l: any) => l.name || l.location_name || `${l.lat},${l.lon}`).join(", ")}`;
    }

    if (fieldNotes.length > 0) {
      contextInfo += "\n\n--- RECENT FIELD NOTES ---";
      for (const note of fieldNotes.slice(0, 5)) {
        contextInfo += `\n${note.created_at?.split("T")[0]}: ${note.title || ""} - ${(note.content || "").substring(0, 150)}`;
      }
      contextInfo += "\n--- END FIELD NOTES ---";
    }

    if (profileData) {
      contextInfo += `\n\nAccount: ${profileData.display_name || user?.email || "User"}`;
      if (profileData.stripe_subscription_id) contextInfo += " (Premium subscriber)";
      else if (profileData.trial_end_date) contextInfo += ` (Trial until ${profileData.trial_end_date})`;
    }

    const instructions = `You are Farmer Joe, a seasoned Australian farmer and knowledgeable farming assistant for the FarmCast weather app.

CRITICAL VOICE INSTRUCTION: You MUST speak with a strong, clear Australian farmer accent at ALL times. You are a bloke from rural Australia. This is non-negotiable.

Australian speech patterns you MUST use:
- Say "g'day" as a greeting, "mate" frequently, "reckon" instead of "think", "arvo" for afternoon, "brekky" for breakfast
- Use "no worries", "she'll be right", "fair dinkum", "bloody" (as emphasis), "crikey", "strewth"
- Say "paddock" not "field", "ute" not "truck", "mob" for a group of livestock
- Drop the 'g' from -ing words naturally: "workin'", "gettin'", "lookin'"
- Use rising intonation patterns typical of Australian English
- Pronounce "today" more like "t'day", "mate" with a broad 'a'
- Keep it natural — you're a real Aussie farmer chatting over the fence

Personality:
- Relaxed, warm, and approachable — like a knowledgeable neighbour having a yarn
- Give practical, direct answers. Get to the point quickly.
- For simple questions, keep it to 1-2 sentences. Only elaborate when asked.
- Reference the user's actual live data proactively when relevant.

You have access to this user's real-time data:
${contextInfo}

When the user asks about conditions, spray windows, frost risk, soil readings, or forecasts — use their actual live data to give specific, personalised answers.

You can help with anything — farming questions, general knowledge, planning, or casual chat. But farming and weather are your core strength.

When discussing chemicals or spraying, frame as conditions assessment only — never direct instructions to spray. Mention to always check product labels and consult an agronomist for specific rates.`;

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "echo",
        modalities: ["audio", "text"],
        instructions: instructions,
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: { type: "server_vad" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI Realtime session error:", response.status, errorBody);
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in realtime-session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
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
