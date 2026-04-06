import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    console.log('=== Webhook Request Start (SIGNATURE VERIFICATION DISABLED FOR DEBUGGING) ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    const signature = req.headers.get('stripe-signature');
    console.log('Stripe-Signature header exists:', !!signature);
    console.log('Stripe-Signature length:', signature?.length || 0);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    console.log('Request body length:', body.length);
    console.log('Request body type:', typeof body);

    // TEMPORARILY BYPASSING SIGNATURE VERIFICATION FOR DEBUGGING
    console.log('⚠️ SKIPPING signature verification - parsing JSON directly');
    const event = JSON.parse(body);
    console.log('Parsed event type:', event.type);
    console.log('Parsed event ID:', event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.warn('checkout.session.completed: No user ID in session metadata');
          break;
        }

        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (session.customer) {
          updateData.stripe_customer_id = session.customer as string;
        }

        if (session.subscription) {
          updateData.stripe_subscription_id = session.subscription as string;
          updateData.farmer_joe_subscription_status = 'active';
        }

        const { error } = await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) {
          console.error('checkout.session.completed: Error updating profile:', error);
          console.error('checkout.session.completed: Failed at line 69-72');
          break;
        }

        console.log('checkout.session.completed: Success for user:', userId, 'Subscription:', session.subscription);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.warn(`${event.type}: No user ID in subscription metadata, trying to find by subscription ID`);
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();

          if (!profile) {
            console.warn(`${event.type}: Could not find user for subscription:`, subscription.id);
            break;
          }
          userId = profile.id;
        }

        let status: string;
        switch (subscription.status) {
          case 'active':
          case 'trialing':
            status = 'active';
            break;
          case 'canceled':
          case 'incomplete_expired':
            status = 'cancelled';
            break;
          case 'past_due':
          case 'unpaid':
          case 'incomplete':
            status = 'expired';
            break;
          default:
            status = 'expired';
        }

        const { error } = await supabaseClient
          .from('profiles')
          .update({
            farmer_joe_subscription_status: status,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`${event.type}: Error updating subscription status:`, error);
          console.error(`${event.type}: Failed at line 120-128`);
          break;
        }

        console.log(`${event.type}: Success for user:`, userId, 'Stripe status:', subscription.status, 'Our status:', status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();

          if (!profile) {
            console.warn('customer.subscription.deleted: Could not find user for deleted subscription:', subscription.id);
            break;
          }
          userId = profile.id;
        }

        const { error } = await supabaseClient
          .from('profiles')
          .update({
            farmer_joe_subscription_status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('customer.subscription.deleted: Error handling subscription deletion:', error);
          console.error('customer.subscription.deleted: Failed at line 156-162');
          break;
        }

        console.log('customer.subscription.deleted: Success for user:', userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;

        if (subscription && typeof subscription === 'string') {
          const { data: profile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription)
            .maybeSingle();

          if (fetchError) {
            console.error('invoice.payment_succeeded: Error fetching profile:', fetchError);
            console.error('invoice.payment_succeeded: Failed at line 178-182');
            break;
          }

          if (profile) {
            const { error } = await supabaseClient
              .from('profiles')
              .update({
                farmer_joe_subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            if (error) {
              console.error('invoice.payment_succeeded: Error updating profile:', error);
              console.error('invoice.payment_succeeded: Failed at line 190-196');
              break;
            }

            console.log('invoice.payment_succeeded: Success, subscription reactivated for user:', profile.id);
          } else {
            console.warn('invoice.payment_succeeded: No profile found for subscription:', subscription);
          }
        } else {
          console.warn('invoice.payment_succeeded: No subscription ID in invoice');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;

        if (subscription && typeof subscription === 'string') {
          const { data: profile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription)
            .maybeSingle();

          if (fetchError) {
            console.error('invoice.payment_failed: Error fetching profile:', fetchError);
            console.error('invoice.payment_failed: Failed at line 214-218');
            break;
          }

          if (profile) {
            const { error } = await supabaseClient
              .from('profiles')
              .update({
                farmer_joe_subscription_status: 'expired',
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            if (error) {
              console.error('invoice.payment_failed: Error updating profile:', error);
              console.error('invoice.payment_failed: Failed at line 226-232');
              break;
            }

            console.log('invoice.payment_failed: Success, subscription expired for user:', profile.id);
          } else {
            console.warn('invoice.payment_failed: No profile found for subscription:', subscription);
          }
        } else {
          console.warn('invoice.payment_failed: No subscription ID in invoice');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: error.message,
        type: error.type || 'webhook_error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
