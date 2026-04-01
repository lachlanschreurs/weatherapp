import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      console.error("No stripe signature provided");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const signedPayload = `${signature.split(',').find(s => s.startsWith('t='))?.split('=')[1]}.${body}`;
    const expectedSignature = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];

    const hmac = createHmac('sha256', stripeWebhookSecret);
    hmac.update(signedPayload);
    const computedSignature = hmac.digest('hex');

    if (computedSignature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const event = JSON.parse(body);
    console.log("Processing Stripe event:", event.type);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        console.log('Subscription event:', { customerId, subscriptionId, status });

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          let dbStatus = "active";
          if (status === "canceled" || status === "incomplete_expired") {
            dbStatus = "cancelled";
          } else if (status === "past_due" || status === "unpaid") {
            dbStatus = "expired";
          } else if (status === "trialing") {
            dbStatus = "trial";
          }

          const now = new Date().toISOString();
          const updateData: any = {
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: dbStatus,
            farmer_joe_subscription_status: dbStatus,
          };

          if (dbStatus === "active" && event.type === "customer.subscription.created") {
            updateData.farmer_joe_subscription_started_at = now;
            updateData.farmer_joe_subscription_ends_at = null;
            updateData.email_subscription_started_at = now;
            updateData.probe_report_subscription_started_at = now;
            updateData.payment_method_set = true;
          }

          if (subscription.cancel_at) {
            updateData.farmer_joe_subscription_ends_at = new Date(subscription.cancel_at * 1000).toISOString();
          }

          await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id);

          if (dbStatus === "active" && event.type === "customer.subscription.created") {
            const { data: existingEmailSub } = await supabase
              .from("email_subscriptions")
              .select("id")
              .eq("user_id", profile.id)
              .maybeSingle();

            if (existingEmailSub) {
              await supabase
                .from("email_subscriptions")
                .update({
                  daily_forecast_enabled: true,
                  weekly_probe_report_enabled: true,
                  trial_active: true,
                  trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  requires_subscription: false,
                  updated_at: now,
                })
                .eq("user_id", profile.id);

              console.log(`Updated email subscription for user ${profile.id}`);
            } else {
              const { data: userAuth } = await supabase.auth.admin.getUserById(profile.id);

              if (userAuth?.user?.email) {
                const { data: favoriteLocation } = await supabase
                  .from("saved_locations")
                  .select("name")
                  .eq("user_id", profile.id)
                  .or("is_primary.eq.true,is_favorite.eq.true")
                  .order("is_primary", { ascending: false })
                  .order("last_accessed_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                await supabase
                  .from("email_subscriptions")
                  .insert({
                    user_id: profile.id,
                    email: userAuth.user.email,
                    daily_forecast_enabled: true,
                    weekly_probe_report_enabled: true,
                    location: favoriteLocation?.name || "Sydney, Australia",
                    trial_active: true,
                    trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    requires_subscription: false,
                    created_at: now,
                    updated_at: now,
                  });

                console.log(`Created email subscription for user ${profile.id}`);
              }
            }
          }

          console.log(`Updated subscription status to ${dbStatus} for user ${profile.id}`);
        } else {
          console.log(`No profile found for customer ${customerId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              stripe_subscription_status: "cancelled",
              farmer_joe_subscription_status: "cancelled",
              farmer_joe_subscription_ends_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          console.log(`Cancelled subscription for user ${profile.id}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              stripe_subscription_status: "expired",
              farmer_joe_subscription_status: "expired",
            })
            .eq("id", profile.id);

          console.log(`Marked subscription as expired for user ${profile.id} due to payment failure`);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              stripe_subscription_id: subscriptionId,
              payment_method_set: true,
            })
            .eq("id", profile.id);

          console.log(`Updated payment method for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
