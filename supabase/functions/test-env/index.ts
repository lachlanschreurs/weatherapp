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

  const envVars = {
    XWEATHER_CLIENT_ID: Deno.env.get('XWEATHER_CLIENT_ID') ? 'SET' : 'NOT SET',
    XWEATHER_CLIENT_SECRET: Deno.env.get('XWEATHER_CLIENT_SECRET') ? 'SET' : 'NOT SET',
    allEnvKeys: Object.keys(Deno.env.toObject()).filter(key => key.includes('XWEATHER')),
  };

  return new Response(
    JSON.stringify(envVars, null, 2),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
});
