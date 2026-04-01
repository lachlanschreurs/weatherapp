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
    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    const squareEnvironment = Deno.env.get("SQUARE_ENVIRONMENT") || "production";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!squareAccessToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users whose trial has ended but don't have active subscription
    const { data: expiredTrials, error: queryError } = await supabase
      .from("profiles")
      .select("id, square_customer_id, email, trial_end_date, farmer_joe_subscription_status, square_subscription_id")
      .lte("trial_end_date", today.toISOString())
      .eq("payment_method_set", true)
      .or("farmer_joe_subscription_status.is.null,farmer_joe_subscription_status.eq.trialing")
      .is("square_subscription_id", null);

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

    // For Square, subscriptions are created at checkout time with trial period
    // This function marks users as expired if they haven't completed checkout
    for (const profile of expiredTrials || []) {
      try {
        // Mark subscription as expired since trial ended and no active subscription
        await supabase
          .from("profiles")
          .update({
            farmer_joe_subscription_status: "expired",
          })
          .eq("id", profile.id);

        console.log(`Marked trial as expired for user ${profile.id}`);
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
