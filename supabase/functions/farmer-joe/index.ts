import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  message: string;
  image?: string;
  imageData?: string;
  weatherContext?: {
    location?: string;
    currentWeather?: any;
    forecast?: any;
    daily?: any[];
    rainfall?: {
      current1h: number;
      todayExpectedMm: number;
      todayChancePct: number;
    };
    wind?: {
      speedKmh: number;
      gustKmh: number | null;
      direction: string;
    };
    deltaT?: number;
    deltaTRating?: string;
    humidity?: number;
    tempC?: number;
    dewpointC?: number;
    uvIndex?: number;
    pressure?: number;
    feelsLike?: number;
    soilTempC?: number;
    soilMoisturePct?: number;
    probeIsLive?: boolean;
    sprayWindow?: { start: string; end: string; rating: string } | null;
    frostRisk?: boolean;
    frostWarning?: boolean;
    minTempNext24h?: number;
  };
  chatHistory?: any[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header (optional for guest users)
    const authHeader = req.headers.get('Authorization');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader ? {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      } : {}
    );

    // Try to verify user (optional - may be guest)
    let user = null;
    if (authHeader) {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (!userError && authUser) {
        user = authUser;
      }
    }

    const { message, image, imageData: imageDataParam, weatherContext, chatHistory }: ChatRequest = await req.json();

    // Support both 'image' and 'imageData' parameter names
    let imageData = image || imageDataParam;

    // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if (imageData && imageData.startsWith('data:')) {
      const base64Index = imageData.indexOf('base64,');
      if (base64Index !== -1) {
        imageData = imageData.substring(base64Index + 7);
      }
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message is required');
    }

    // Build the system prompt for Farmer Joe
    const systemPrompt = `You are Farmer Joe, a friendly and knowledgeable AI assistant with a warm, folksy personality. While you have extensive expertise in agriculture and farming, you can help with absolutely anything the user asks about.

Your farming expertise includes:
- Weather conditions and their impact on farming
- Best times for planting, spraying, and harvesting
- Farm event planning based on weather forecasts
- Pest and disease identification from photos
- Chemical and treatment recommendations for pests and diseases
- General farming tips and best practices

But you're not limited to farming! You can also help with:
- General knowledge questions on any topic
- Image analysis and identification of anything in photos
- Advice on technology, science, business, cooking, and more
- Problem-solving and creative thinking
- Writing, coding, math, and educational topics
- Casual conversation and friendly chat

When analyzing images:
- Provide detailed descriptions of what you see
- Answer specific questions about the image
- Identify objects, animals, plants, problems, or anything else visible
- Offer relevant advice or information based on the image content

You have access to real-time weather data and forecasts when available. Be conversational, helpful, and friendly. Use a warm, approachable tone while remaining knowledgeable and professional. Don't limit yourself - help with whatever the user needs!`;

    // Build context from weather data if available — formatted as readable text
    let contextInfo = '';
    if (weatherContext) {
      contextInfo += '\n\n--- LIVE WEATHER DATA FOR THIS USER ---';

      if (weatherContext.location) {
        contextInfo += `\nLocation: ${weatherContext.location}`;
      }

      if (weatherContext.tempC !== undefined) {
        contextInfo += `\nCurrent temperature: ${Math.round(weatherContext.tempC)}°C`;
      }
      if (weatherContext.feelsLike !== undefined) {
        contextInfo += ` (feels like ${weatherContext.feelsLike}°C)`;
      }
      if (weatherContext.currentWeather?.weather?.[0]) {
        contextInfo += `\nConditions: ${weatherContext.currentWeather.weather[0].description}`;
      }
      if (weatherContext.humidity !== undefined) {
        contextInfo += `\nHumidity: ${weatherContext.humidity}%`;
      }
      if (weatherContext.dewpointC !== undefined) {
        contextInfo += ` | Dew point: ${weatherContext.dewpointC}°C`;
      }
      if (weatherContext.pressure !== undefined) {
        contextInfo += `\nPressure: ${weatherContext.pressure} hPa`;
      }
      if (weatherContext.uvIndex !== undefined) {
        contextInfo += `\nUV Index: ${weatherContext.uvIndex}`;
      }

      if (weatherContext.wind) {
        contextInfo += `\nWind: ${Math.round(weatherContext.wind.speedKmh)} km/h from the ${weatherContext.wind.direction}`;
        if (weatherContext.wind.gustKmh) {
          contextInfo += ` (gusts to ${Math.round(weatherContext.wind.gustKmh)} km/h)`;
        }
      }

      if (weatherContext.rainfall) {
        const r = weatherContext.rainfall;
        contextInfo += `\nRainfall today: ${r.todayExpectedMm.toFixed(1)} mm expected, ${r.todayChancePct}% chance of rain`;
        if (r.current1h > 0) {
          contextInfo += ` | Currently raining: ${r.current1h.toFixed(1)} mm in last hour`;
        }
      }

      if (weatherContext.deltaT !== undefined) {
        contextInfo += `\nDelta T: ${weatherContext.deltaT.toFixed(1)}°C (${weatherContext.deltaTRating || 'unknown'} for spraying)`;
      }

      if (weatherContext.sprayWindow) {
        contextInfo += `\nBest spray window today: ${weatherContext.sprayWindow.start} to ${weatherContext.sprayWindow.end} (${weatherContext.sprayWindow.rating})`;
      } else {
        contextInfo += `\nSpray window today: No suitable window found`;
      }

      if (weatherContext.frostRisk) {
        contextInfo += `\nFROST RISK: Yes — minimum ${weatherContext.minTempNext24h}°C expected in next 24 hours`;
      } else if (weatherContext.frostWarning) {
        contextInfo += `\nFrost warning: Minimum ${weatherContext.minTempNext24h}°C expected — monitor overnight`;
      } else if (weatherContext.minTempNext24h !== undefined) {
        contextInfo += `\nOvernight minimum: ${weatherContext.minTempNext24h}°C (no frost risk)`;
      }

      if (weatherContext.soilTempC !== undefined) {
        contextInfo += `\nSoil temperature: ${weatherContext.soilTempC.toFixed(1)}°C${weatherContext.probeIsLive ? ' (live probe reading)' : ' (estimated)'}`;
      }
      if (weatherContext.soilMoisturePct !== undefined) {
        contextInfo += `\nSoil moisture: ${weatherContext.soilMoisturePct.toFixed(1)}%${weatherContext.probeIsLive ? ' (live probe reading)' : ' (estimated)'}`;
      }

      if (weatherContext.daily && weatherContext.daily.length > 0) {
        contextInfo += '\n\n7-Day Forecast:';
        weatherContext.daily.slice(0, 7).forEach((day: any, i: number) => {
          const date = new Date(day.dt * 1000);
          const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
          const rainMm = (day.rain || 0).toFixed(1);
          const rainPct = Math.round((day.pop || 0) * 100);
          const windKmh = Math.round((day.wind_speed || 0) * 3.6);
          contextInfo += `\n  ${dayName}: High ${Math.round(day.temp?.max || 0)}°C / Low ${Math.round(day.temp?.min || 0)}°C, ${day.weather?.[0]?.description || 'unknown'}, Rain: ${rainMm}mm (${rainPct}% chance), Wind: ${windKmh} km/h, Humidity: ${day.humidity || 0}%`;
        });
      }

      if (weatherContext.forecast && weatherContext.forecast.length > 0) {
        contextInfo += '\n\nNext 24-hour hourly rainfall summary:';
        let totalRain = 0;
        const rainyHours: string[] = [];
        weatherContext.forecast.slice(0, 24).forEach((h: any) => {
          const rain1h = h.rain?.['1h'] || 0;
          totalRain += rain1h;
          if (rain1h > 0.1) {
            const t = new Date(h.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
            rainyHours.push(`${t}: ${rain1h.toFixed(1)}mm`);
          }
        });
        contextInfo += `\n  Total forecast rain next 24h: ${totalRain.toFixed(1)} mm`;
        if (rainyHours.length > 0) {
          contextInfo += `\n  Rain hours: ${rainyHours.join(', ')}`;
        } else {
          contextInfo += `\n  No rain expected in next 24 hours`;
        }
      }

      contextInfo += '\n--- END WEATHER DATA ---';
    }

    // Call OpenAI API (using gpt-4 or gpt-3.5-turbo)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      // Fallback response if no API key
      const fallbackResponse = `Howdy! I'm Farmer Joe, your AI farming assistant. I'd love to help you with weather insights, pest identification, and farm planning, but it looks like I need an OpenAI API key to be configured first.

In the meantime, here's some general advice: ${message.toLowerCase().includes('spray') ? 'For spraying, you generally want calm conditions with wind speeds below 10 mph, temperatures between 50-85°F, and no rain in the forecast for at least 6 hours.' : message.toLowerCase().includes('plant') ? 'For planting, check your soil temperature and ensure no hard frost is expected in the next 2 weeks.' : imageData ? 'For pest and disease identification, I need to analyze your photo. Please configure the OpenAI API key to enable this feature.' : 'Always check your local weather forecast and plan farm activities around optimal conditions!'}`;

      // Save to database (only for authenticated users)
      if (user) {
        await supabaseClient.from('chat_messages').insert([
          {
            user_id: user.id,
            role: 'user',
            content: message,
            image_url: imageData ? 'data:image/jpeg;base64,...' : null,
          },
          {
            user_id: user.id,
            role: 'assistant',
            content: fallbackResponse,
          }
        ]);
      }

      return new Response(
        JSON.stringify({ response: fallbackResponse }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Use provided chat history or load from database
    let conversationHistory: any[] = chatHistory || [];

    // If no history provided and user is authenticated, load from database
    if (conversationHistory.length === 0 && user) {
      const { data: dbChatHistory, error: historyError } = await supabaseClient
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20);

      if (!historyError && dbChatHistory) {
        conversationHistory = dbChatHistory;
      }
    }

    // Prepare messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt + contextInfo,
      },
    ];

    // Add conversation history to context
    for (const chat of conversationHistory) {
      messages.push({
        role: chat.role,
        content: chat.content,
      });
    }

    // If image is provided, use vision model with image
    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: message,
      });
    }

    // Make request to OpenAI (use gpt-4o for all requests)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText,
      });

      // Try to parse the error for better user feedback
      let errorMessage = 'Failed to get response from AI';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // Use default error message
      }

      throw new Error(errorMessage);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    // Save chat message to database (only for authenticated users)
    if (user) {
      await supabaseClient.from('chat_messages').insert([
        {
          user_id: user.id,
          role: 'user',
          content: message,
          image_url: imageData ? `data:image/jpeg;base64,${imageData.substring(0, 50)}...` : null,
        },
        {
          user_id: user.id,
          role: 'assistant',
          content: aiResponse,
        }
      ]);
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in farmer-joe function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
