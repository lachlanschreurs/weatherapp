import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const weatherApiKey = Deno.env.get('FARMCAST_OPENWEATHER_NEW_KEY') || Deno.env.get('OPENWEATHER_API_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const results: any = {
      weatherApiKey: weatherApiKey ? `present (${weatherApiKey.slice(0, 6)}...)` : 'MISSING',
      resendApiKey: resendApiKey ? `present (${resendApiKey.slice(0, 6)}...)` : 'MISSING',
      farmcastNewKey: Deno.env.get('FARMCAST_OPENWEATHER_NEW_KEY') ? 'present' : 'MISSING',
      openweatherKey: Deno.env.get('OPENWEATHER_API_KEY') ? 'present' : 'MISSING',
    };

    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=Melbourne,AU&limit=1&appid=${weatherApiKey}`
    );
    results.geoStatus = geoResponse.status;
    const geoText = await geoResponse.text();
    results.geoResponse = geoText.slice(0, 200);

    if (geoResponse.ok) {
      const geoData = JSON.parse(geoText);
      if (geoData.length > 0) {
        const { lat, lon } = geoData[0];
        const oneCallResponse = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
        );
        results.oneCallStatus = oneCallResponse.status;
        const oneCallText = await oneCallResponse.text();
        results.oneCallResponse = oneCallText.slice(0, 200);
      }
    }

    if (resendApiKey) {
      const testEmail = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'FarmCast Weather <support@mail.farmcastweather.com>',
          to: 'adam@schreurs.com.au',
          subject: 'FarmCast Debug Test',
          html: '<p>This is a debug test email to confirm delivery is working.</p>',
          text: 'This is a debug test email to confirm delivery is working.',
        }),
      });
      results.resendStatus = testEmail.status;
      const resendText = await testEmail.text();
      results.resendResponse = resendText.slice(0, 300);
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
