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

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Webhook error: No signature header');
      return new Response('No signature', { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('Webhook error: Webhook secret not configured');
      throw new Error('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Stripe webhook event:', event.type, 'ID:', event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.warn('No user ID in session metadata');
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
          console.error('Error updating profile on checkout completion:', error);
          throw error;
        }

        console.log('Checkout completed for user:', userId, 'Subscription:', session.subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.warn('No user ID in subscription metadata, trying to find by subscription ID');
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();

          if (!profile) {
            console.warn('Could not find user for subscription:', subscription.id);
            break;
          }
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
          .eq('id', userId || '');

        if (error) {
          console.error('Error updating subscription status:', error);
          throw error;
        }

        console.log('Subscription updated for user:', userId, 'Stripe status:', subscription.status, 'Our status:', status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();

          if (!profile) {
            console.warn('Could not find user for deleted subscription:', subscription.id);
            break;
          }
        }

        const { error } = await supabaseClient
          .from('profiles')
          .update({
            farmer_joe_subscription_status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId || '');

        if (error) {
          console.error('Error handling subscription deletion:', error);
          throw error;
        }

        console.log('Subscription deleted for user:', userId);
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
            console.error('Error fetching profile for payment success:', fetchError);
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
              console.error('Error updating profile on payment success:', error);
              throw error;
            }

            console.log('Payment succeeded, subscription reactivated for user:', profile.id);
          }
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
            console.error('Error fetching profile for payment failure:', fetchError);
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
              console.error('Error updating profile on payment failure:', error);
              throw error;
            }

            console.log('Payment failed, subscription expired for user:', profile.id);
          }
        }
        break;
      }
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
