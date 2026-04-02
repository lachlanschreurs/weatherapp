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

    // Make request to OpenAI (use gpt-4o for vision, gpt-3.5-turbo for text)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: imageData ? 'gpt-4o' : 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: imageData ? 1000 : 500,
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
