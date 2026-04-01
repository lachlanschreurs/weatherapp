import { createClient } from "npm:@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !stripePriceId) {
      throw new Error("Stripe not configured. Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID");
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase not configured");
    }

    console.log('=== CHECKOUT SESSION DEBUG START ===');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key present:', !!supabaseServiceRoleKey);

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value:', authHeader?.substring(0, 20) + '...');

    if (!authHeader) {
      console.log('ERROR: No authorization header provided');
      return new Response(
        JSON.stringify({ error: "Missing authorization header. Please sign in." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', !!token);
    console.log('Token length:', token.length);
    console.log('Token first 20 chars:', token.substring(0, 20) + '...');

    console.log('Creating Supabase client with SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Calling supabase.auth.getUser(token)...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.log('ERROR: JWT verification failed');
      console.log('Error object:', JSON.stringify(userError, null, 2));
      return new Response(
        JSON.stringify({ error: "Invalid JWT", details: userError.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.log('ERROR: No user found from token');
      return new Response(
        JSON.stringify({ error: "User not found. Please sign in again." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('SUCCESS: User verified:', user.id);
    console.log('User email:', user.email);
    console.log('=== CHECKOUT SESSION DEBUG END ===');

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email || "",
          metadata: JSON.stringify({ supabase_user_id: user.id }),
        }),
      });

      if (!customerResponse.ok) {
        throw new Error("Failed to create Stripe customer");
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = req.headers.get('origin') || 'https://farmcastweather.com';

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        mode: "subscription",
        "line_items[0][price]": stripePriceId,
        "line_items[0][quantity]": "1",
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        "subscription_data[trial_period_days]": "30",
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("Stripe API error:", errorText);
      throw new Error("Failed to create checkout session");
    }

    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create checkout" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
