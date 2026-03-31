import Stripe from "npm:stripe@14.11.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
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
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const customerEmail = session.customer_details?.email || session.customer_email;

        console.log('Checkout session completed:', { userId, customerId, customerEmail });

        // Get subscription details to check for trial
        let trialEnd = null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (subscription.trial_end) {
            trialEnd = new Date(subscription.trial_end * 1000).toISOString();
          }
        }

        // Case 1: User signed up through website first (has userId in metadata)
        if (userId && customerId) {
          const now = new Date().toISOString();

          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              farmer_joe_subscription_status: "active",
              farmer_joe_subscription_started_at: now,
              farmer_joe_subscription_ends_at: null,
              payment_method_set: true,
              email_subscription_started_at: now,
              probe_report_subscription_started_at: now,
              trial_end_date: trialEnd,
            })
            .eq("id", userId);

          console.log(`Activated subscription for existing user ${userId} with trial until ${trialEnd}`);
        }
        // Case 2: Direct Stripe checkout (no userId) - create auth user
        else if (!userId && customerId && customerEmail) {
          console.log(`No user ID found, checking if auth user exists for: ${customerEmail}`);

          // Check if user already exists
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

          if (listError) {
            console.error('Error listing users:', listError);
          }

          const userExists = existingUsers?.users?.find(u => u.email === customerEmail);

          if (userExists) {
            console.log(`User already exists: ${userExists.id}, updating profile`);

            const now = new Date().toISOString();

            // Update existing user's profile
            await supabase
              .from("profiles")
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                farmer_joe_subscription_status: "active",
                farmer_joe_subscription_started_at: now,
                farmer_joe_subscription_ends_at: null,
                payment_method_set: true,
                email_subscription_started_at: now,
                probe_report_subscription_started_at: now,
                trial_end_date: trialEnd,
              })
              .eq("id", userExists.id);
          } else {
            console.log(`Creating new auth user for Stripe customer: ${customerEmail}`);

            // Create new Supabase auth user
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
              user_metadata: {
                created_via: 'stripe_checkout',
                stripe_customer_id: customerId,
              },
            });

            if (createError) {
              console.error('Error creating user:', createError);
              throw createError;
            }

            if (newUser.user) {
              console.log(`Successfully created user: ${newUser.user.id}`);

              const now = new Date().toISOString();

              // Profile is auto-created by trigger, just update it with Stripe data
              await supabase
                .from("profiles")
                .update({
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  farmer_joe_subscription_status: "active",
                  farmer_joe_subscription_started_at: now,
                  farmer_joe_subscription_ends_at: null,
                  payment_method_set: true,
                  email_subscription_started_at: now,
                  probe_report_subscription_started_at: now,
                  trial_end_date: trialEnd,
                })
                .eq("id", newUser.user.id);

              // Send password reset email so they can set their password
              const { data: resetLink, error: resetError } = await supabase.auth.admin.generateLink({
                type: 'recovery',
                email: customerEmail,
              });

              if (resetError) {
                console.error('Error generating password reset link:', resetError);
              } else {
                console.log(`Password reset link generated for ${customerEmail}`);
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          let status = "active";
          if (subscription.status === "canceled" || subscription.status === "unpaid") {
            status = "cancelled";
          } else if (subscription.status === "past_due") {
            status = "expired";
          }

          await supabase
            .from("profiles")
            .update({
              farmer_joe_subscription_status: status,
              farmer_joe_subscription_ends_at: subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000).toISOString()
                : null,
            })
            .eq("id", profile.id);

          console.log(`Updated subscription status to ${status} for user ${profile.id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              farmer_joe_subscription_status: "cancelled",
              farmer_joe_subscription_ends_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          console.log(`Cancelled subscription for user ${profile.id}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              farmer_joe_subscription_status: "expired",
            })
            .eq("id", profile.id);

          console.log(`Marked subscription as expired for user ${profile.id} due to payment failure`);
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
  } catch (error) {
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
