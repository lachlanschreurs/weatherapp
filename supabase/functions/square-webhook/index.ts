import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-square-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const squareSignatureKey = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY");
    const squareWebhookUrl = Deno.env.get("SQUARE_WEBHOOK_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!squareSignatureKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("x-square-signature");
    const body = await req.text();

    if (signature && squareWebhookUrl) {
      const hmac = createHmac('sha256', squareSignatureKey);
      hmac.update(squareWebhookUrl + body);
      const hash = hmac.digest('base64');

      if (hash !== signature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Processing Square event:", event.type);

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const subscription = event.data.object.subscription;
        const customerId = subscription.customer_id;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        console.log('Subscription event:', { customerId, subscriptionId, status });

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("square_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          let dbStatus = "active";
          if (status === "CANCELED" || status === "DEACTIVATED") {
            dbStatus = "cancelled";
          } else if (status === "PAUSED") {
            dbStatus = "expired";
          }

          const now = new Date().toISOString();
          const updateData: any = {
            square_subscription_id: subscriptionId,
            farmer_joe_subscription_status: dbStatus,
          };

          if (dbStatus === "active" && event.type === "subscription.created") {
            updateData.farmer_joe_subscription_started_at = now;
            updateData.farmer_joe_subscription_ends_at = null;
            updateData.email_subscription_started_at = now;
            updateData.probe_report_subscription_started_at = now;
          }

          if (subscription.canceled_date) {
            updateData.farmer_joe_subscription_ends_at = subscription.canceled_date;
          }

          await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id);

          console.log(`Updated subscription status to ${dbStatus} for user ${profile.id}`);
        }
        break;
      }

      case "payment.created":
      case "payment.updated": {
        const payment = event.data.object.payment;

        if (payment.status === "COMPLETED") {
          console.log('Payment completed:', payment.id);
        }
        break;
      }

      case "invoice.created":
      case "invoice.updated": {
        const invoice = event.data.object.invoice;
        const subscriptionId = invoice.subscription_id;

        if (invoice.status === "UNPAID" || invoice.status === "PAYMENT_PENDING") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("square_subscription_id", subscriptionId)
            .maybeSingle();

          if (profile && invoice.status === "UNPAID") {
            await supabase
              .from("profiles")
              .update({
                farmer_joe_subscription_status: "expired",
              })
              .eq("id", profile.id);

            console.log(`Marked subscription as expired for user ${profile.id} due to unpaid invoice`);
          }
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
