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
    console.log('Portal session request received');

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Failed to verify user:', userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody = await req.json();
    console.log('Request body received:', { ...requestBody, userEmail: requestBody.userEmail ? 'present' : 'missing' });

    const { returnUrl } = requestBody;
    const userId = user.id;
    const userEmail = user.email;

    if (!userId || !userEmail) {
      console.error('Missing user information:', { userId: !!userId, userEmail: !!userEmail });
      return new Response(
        JSON.stringify({ error: "Missing user information" }),
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

    console.log('Fetching customer ID for user:', userId);

    // Get or create customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;
    console.log('Profile stripe_customer_id:', customerId || 'none');

    if (!customerId) {
      console.log('No customer ID found, searching Stripe by email:', userEmail);
      // Create new customer if doesn't exist
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found existing Stripe customer:', customerId);
      } else {
        console.log('Creating new Stripe customer');
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            supabase_user_id: userId,
          },
        });
        customerId = customer.id;
        console.log('Created new customer:', customerId);
      }

      // Save customer ID
      console.log('Saving customer ID to profile');
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Ensure we have a valid return URL
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('?')[0];
    const finalReturnUrl = returnUrl || origin || "https://farmcast.app";

    console.log('Creating portal session with:', {
      customerId,
      returnUrl: finalReturnUrl
    });

    // Create billing portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: finalReturnUrl,
      });

      console.log('Portal session created successfully:', {
        sessionId: session.id,
        url: session.url,
        returnUrl: finalReturnUrl
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (stripeError: any) {
      console.error("Stripe portal error:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code
      });

      // Check if it's a billing portal not activated error
      if (stripeError.type === 'invalid_request_error' &&
          stripeError.message?.includes('billing portal')) {
        return new Response(
          JSON.stringify({
            error: "Billing portal not activated. Please activate it in your Stripe Dashboard: https://dashboard.stripe.com/settings/billing/portal",
            errorType: "portal_not_activated"
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw stripeError;
    }
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create billing portal session",
        details: error.type || "unknown_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
