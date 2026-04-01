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
    console.log('Square checkout request received');

    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    const squareLocationId = Deno.env.get("SQUARE_LOCATION_ID");
    const squareSubscriptionPlanId = Deno.env.get("SQUARE_SUBSCRIPTION_PLAN_ID");
    const squareEnvironment = Deno.env.get("SQUARE_ENVIRONMENT") || "production";

    if (!squareAccessToken || !squareLocationId || !squareSubscriptionPlanId) {
      console.error('Square credentials not configured');
      throw new Error("Square not configured. Missing SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, or SQUARE_SUBSCRIPTION_PLAN_ID");
    }

    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    if (!authHeader) {
      console.error('MISSING Authorization header');
      return new Response(
        JSON.stringify({
          error: "No authorization header provided",
          details: "The request is missing the Authorization header",
          hint: "Please sign in again"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Missing SUPABASE_URL or SUPABASE_ANON_KEY"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use anon key to validate the user's JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Validating user token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('User verification error:', {
        message: userError.message,
        status: userError.status,
        name: userError.name
      });
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          details: userError.message,
          errorCode: userError.name,
          hint: "Your session may have expired. Please sign out and sign back in"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.error('No user returned from getUser');
      return new Response(
        JSON.stringify({
          error: "No user found",
          details: "Token did not resolve to a user",
          hint: "Please sign out and sign back in"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('User verified successfully:', user.id, user.email);

    const squareApiUrl = squareEnvironment === "sandbox"
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com";

    const idempotencyKey = crypto.randomUUID();

    const checkoutData = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: squareLocationId,
        subscription_plans: [
          {
            subscription_plan_variation_id: squareSubscriptionPlanId,
          },
        ],
      },
      redirect_url: "https://farmcastweather.com/success",
      ask_for_shipping_address: false,
      merchant_support_email: "support@farmcastweather.com",
      pre_populate_buyer_email: user.email,
    };

    console.log('Creating Square checkout with plan:', squareSubscriptionPlanId);

    const squareResponse = await fetch(`${squareApiUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-12-18',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!squareResponse.ok) {
      const errorText = await squareResponse.text();
      console.error('Square API error response:', {
        status: squareResponse.status,
        statusText: squareResponse.statusText,
        body: errorText
      });

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Square API error (${squareResponse.status}): ${errorText}`);
      }

      const errorDetail = errorData.errors?.[0]?.detail || errorData.errors?.[0]?.message || 'Failed to create Square checkout';
      throw new Error(errorDetail);
    }

    const data = await squareResponse.json();
    console.log('Square checkout created:', data.payment_link?.id);

    if (!data.payment_link?.url) {
      throw new Error('No checkout URL returned from Square');
    }

    return new Response(
      JSON.stringify({ url: data.payment_link.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating Square checkout:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });

    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to create checkout",
        details: error?.stack?.split('\n')[0] || 'Unknown error',
        hint: "Please contact support@farmcastweather.com"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
