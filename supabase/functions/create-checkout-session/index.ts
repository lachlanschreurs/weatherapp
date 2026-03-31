import Stripe from "npm:stripe@14.11.0";
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
    if (!authHeader) {
      console.error('No Authorization header');
      return new Response(
        JSON.stringify({ error: "Unauthorized - No auth header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received, length:', token.length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Creating Supabase client with anon key');

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    console.log('Attempting to get user');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    console.log('Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: userError?.message,
      errorStatus: userError?.status
    });

    if (userError || !user) {
      console.error('Failed to verify user:', {
        error: userError,
        message: userError?.message,
        status: userError?.status,
        name: userError?.name
      });
      return new Response(
        JSON.stringify({
          error: "Unauthorized - Invalid token",
          details: userError?.message || "No user found",
          hint: "Please try signing out and signing back in"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('User verified successfully:', user.id, user.email);

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      console.error('Missing service role key');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    console.log('Request body received:', { ...requestBody, userEmail: requestBody.userEmail ? 'present' : 'missing' });

    const { priceId, successUrl, cancelUrl, customerId, isNewSignup } = requestBody;
    const userId = user.id;
    const userEmail = user.email;

    // For new signups, we create a subscription directly (payment already collected)
    if (isNewSignup && customerId) {
      console.log('Creating subscription for new signup with customer:', customerId);

      const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
      if (!stripePriceId) {
        throw new Error("STRIPE_PRICE_ID not configured");
      }

      // Calculate trial end date (1 month from now)
      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + 1);
      const trialEndTimestamp = Math.floor(trialEndDate.getTime() / 1000);

      // Get the payment method that was just added
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      });

      if (paymentMethods.data.length === 0) {
        throw new Error('No payment method found for customer');
      }

      // Create subscription with trial period
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        default_payment_method: paymentMethods.data[0].id,
        trial_end: trialEndTimestamp,
        metadata: {
          supabase_user_id: userId,
        },
      });

      console.log('Subscription created for new signup:', subscription.id);

      return new Response(
        JSON.stringify({
          subscriptionId: subscription.id,
          status: subscription.status,
          trialEnd: subscription.trial_end,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Regular checkout flow for existing users
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      console.error('Invalid email format:', userEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email address format. Please use a valid email (e.g., support@farmcastweather.com)" }),
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

    // Create checkout session with 1-month trial
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
        trial_period_days: 30,
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
