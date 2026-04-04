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
    const { publicKey, privateKey, stationId } = await req.json();

    if (!publicKey || !privateKey || !stationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: publicKey, privateKey, stationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const debugInfo: any = {
      stationId,
      publicKeyLength: publicKey.length,
      privateKeyLength: privateKey.length,
      timestamp: new Date().toISOString(),
    };

    const route = `/data/${stationId}/raw/last/0`;
    const method = 'GET';

    const now = new Date();
    const dateHeader = now.toUTCString();

    const stringToSign = method + route + dateHeader + publicKey;

    debugInfo.request = {
      method,
      route,
      dateHeader,
      publicKey,
      stringToSign,
      stringToSignLength: stringToSign.length,
    };

    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey);
    const messageData = encoder.encode(stringToSign);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hmacHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    debugInfo.signature = {
      hmacHex,
      signatureLength: hmacHex.length,
    };

    const authHeader = `hmac ${publicKey}:${hmacHex}`;
    const url = `https://api.fieldclimate.com${route}`;

    debugInfo.request.url = url;
    debugInfo.request.authorizationHeader = authHeader;

    const headers = {
      'Accept': 'application/json',
      'Authorization': authHeader,
      'Request-Date': dateHeader,
    };

    debugInfo.request.allHeaders = headers;

    console.log('=== FIELDCLIMATE TEST REQUEST ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    const response = await fetch(url, { method, headers });

    const responseText = await response.text();

    debugInfo.response = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyLength: responseText.length,
      body: responseText,
    };

    let parsedBody = null;
    try {
      parsedBody = JSON.parse(responseText);
      debugInfo.response.parsedBody = parsedBody;
    } catch (e) {
      debugInfo.response.parseError = 'Response is not valid JSON';
    }

    console.log('=== FIELDCLIMATE TEST RESPONSE ===');
    console.log(JSON.stringify(debugInfo.response, null, 2));

    return new Response(
      JSON.stringify(debugInfo, null, 2),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in test-fieldclimate function:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
