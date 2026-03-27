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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !stripePriceId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: expiredTrials, error: queryError } = await supabase
      .from("profiles")
      .select("id, stripe_customer_id, email, trial_end_date, farmer_joe_subscription_status")
      .lte("trial_end_date", today.toISOString())
      .eq("payment_method_set", true)
      .is("farmer_joe_subscription_status", null);

    if (queryError) {
      console.error("Error querying expired trials:", queryError);
      throw queryError;
    }

    console.log(`Found ${expiredTrials?.length || 0} expired trials to process`);

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const profile of expiredTrials || []) {
      try {
        if (!profile.stripe_customer_id) {
          console.error(`User ${profile.id} has no Stripe customer ID`);
          results.failed++;
          results.errors.push(`User ${profile.id}: No Stripe customer ID`);
          continue;
        }

        const customer = await stripe.customers.retrieve(profile.stripe_customer_id);

        if (customer.deleted) {
          console.error(`Customer ${profile.stripe_customer_id} has been deleted`);
          results.failed++;
          results.errors.push(`User ${profile.id}: Customer deleted`);
          continue;
        }

        const paymentMethods = await stripe.paymentMethods.list({
          customer: profile.stripe_customer_id,
          type: "card",
          limit: 1,
        });

        if (paymentMethods.data.length === 0) {
          console.error(`No payment method found for customer ${profile.stripe_customer_id}`);

          await supabase
            .from("profiles")
            .update({
              payment_method_set: false,
              farmer_joe_subscription_status: "cancelled",
            })
            .eq("id", profile.id);

          results.failed++;
          results.errors.push(`User ${profile.id}: No payment method`);
          continue;
        }

        const subscription = await stripe.subscriptions.create({
          customer: profile.stripe_customer_id,
          items: [{ price: stripePriceId }],
          default_payment_method: paymentMethods.data[0].id,
          metadata: {
            supabase_user_id: profile.id,
          },
        });

        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: subscription.id,
            farmer_joe_subscription_status: "active",
            farmer_joe_subscription_started_at: new Date().toISOString(),
            farmer_joe_subscription_ends_at: null,
          })
          .eq("id", profile.id);

        console.log(`Created subscription ${subscription.id} for user ${profile.id}`);
        results.processed++;

      } catch (error: any) {
        console.error(`Error processing user ${profile.id}:`, error);
        results.failed++;
        results.errors.push(`User ${profile.id}: ${error.message}`);
      }
    }

    console.log("Processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.processed,
        failed: results.failed,
        errors: results.errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing trial expirations:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process trial expirations"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
