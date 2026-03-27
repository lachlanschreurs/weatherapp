import Stripe from "npm:stripe@14.11.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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
    console.log('Checkout session request received');

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('No Authorization header');
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header. Please sign in." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables not configured');
      throw new Error("Server configuration error");
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error('Auth error:', userError.message);
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          details: "Invalid or expired session. Please sign in again."
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.error('No user found from token');
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "User not found. Please sign in."
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('User verified:', user.id, user.email);

    const requestBody = await req.json();
    console.log('Request body received:', { ...requestBody, userEmail: requestBody.userEmail ? 'present' : 'missing' });

    const { priceId, successUrl, cancelUrl } = requestBody;
    const userId = user.id;
    const userEmail = user.email;

    if (!priceId || !userId || !userEmail) {
      console.error('Missing required fields:', { priceId: !!priceId, userId: !!userId, userEmail: !!userEmail });
      return new Response(
        JSON.stringify({ error: "Missing required fields: priceId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Creating/retrieving Stripe customer for:', userEmail);

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
      console.log('Created new customer:', customerId);
    }

    // Ensure we have valid URLs
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('?')[0];
    const baseUrl = origin || "https://farmcast.app";
    const finalSuccessUrl = successUrl || `${baseUrl}?subscription=success`;
    const finalCancelUrl = cancelUrl || baseUrl;

    console.log('Creating checkout session with URLs:', { finalSuccessUrl, finalCancelUrl });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
    });

    console.log('Checkout session created:', session.id);

    console.log('Checkout session created successfully:', { sessionId: session.id, hasUrl: !!session.url });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create checkout session",
        type: error.type || "unknown_error",
        details: error.code || error.statusCode || "No additional details"
      }),
      {
        status: error.statusCode || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
