import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  message: string;
  weatherContext?: {
    location?: string;
    currentWeather?: any;
    forecast?: any;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, weatherContext }: ChatRequest = await req.json();

    if (!message || message.trim().length === 0) {
      throw new Error('Message is required');
    }

    // Build the system prompt for Farmer Joe
    const systemPrompt = `You are Farmer Joe, a friendly and knowledgeable AI farming assistant with years of experience in agriculture. You provide helpful advice about:
- Weather conditions and their impact on farming
- Best times for planting, spraying, and harvesting
- Farm event planning based on weather forecasts
- General farming tips and best practices

You have access to real-time weather data and forecasts. Be conversational, helpful, and use your farming expertise to give practical advice. Keep responses concise but informative. Use a warm, folksy tone but remain professional.`;

    // Build context from weather data if available
    let contextInfo = '';
    if (weatherContext) {
      if (weatherContext.location) {
        contextInfo += `\nCurrent location: ${weatherContext.location}`;
      }
      if (weatherContext.currentWeather) {
        contextInfo += `\nCurrent weather: ${JSON.stringify(weatherContext.currentWeather)}`;
      }
      if (weatherContext.forecast) {
        contextInfo += `\nForecast data: ${JSON.stringify(weatherContext.forecast)}`;
      }
    }

    // Call OpenAI API (using gpt-4 or gpt-3.5-turbo)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      // Fallback response if no API key
      const fallbackResponse = `Howdy! I'm Farmer Joe, your AI farming assistant. I'd love to help you with weather insights and farm planning, but it looks like I need an OpenAI API key to be configured first.

In the meantime, here's some general advice: ${message.toLowerCase().includes('spray') ? 'For spraying, you generally want calm conditions with wind speeds below 10 mph, temperatures between 50-85°F, and no rain in the forecast for at least 6 hours.' : message.toLowerCase().includes('plant') ? 'For planting, check your soil temperature and ensure no hard frost is expected in the next 2 weeks.' : 'Always check your local weather forecast and plan farm activities around optimal conditions!'}`;

      // Save to database
      await supabaseClient.from('chat_messages').insert({
        user_id: user.id,
        message: message,
        response: fallbackResponse,
        weather_context: weatherContext || {},
      });

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

    // Make request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt + contextInfo,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from AI');
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    // Save chat message to database
    await supabaseClient.from('chat_messages').insert({
      user_id: user.id,
      message: message,
      response: aiResponse,
      weather_context: weatherContext || {},
    });

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
