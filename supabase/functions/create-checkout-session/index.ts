import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const authHeader = req.headers.get('Authorization');

    console.log('[Edge] auth header exists:', !!authHeader);
    console.log('[Edge] auth header preview:', authHeader?.slice(0, 30));

    let user = null;
    let profile = null;
    let customerId = null;

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );

      const {
        data: { user: authUser },
        error: userError,
      } = await supabaseClient.auth.getUser();

      console.log('[Edge] user found:', !!authUser);
      console.log('[Edge] user validation error:', userError?.message ?? null);

      if (!userError && authUser) {
        user = authUser;

        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('stripe_customer_id, email, full_name')
          .eq('id', user.id)
          .maybeSingle();

        profile = profileData;
        customerId = profile?.stripe_customer_id;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email || profile?.email,
            name: profile?.full_name,
            metadata: {
              supabase_user_id: user.id,
            },
          });

          customerId = customer.id;

          await supabaseClient
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        }
      }
    } else {
      console.log('[Edge] no auth header provided, creating anonymous checkout session');
    }

    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: Deno.env.get('STRIPE_PRICE_ID'),
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}?subscription=success`,
      cancel_url: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}?subscription=cancelled`,
      subscription_data: {
        trial_period_days: 30,
      },
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    }

    if (user) {
      sessionConfig.metadata = {
        supabase_user_id: user.id,
      };
      sessionConfig.subscription_data.metadata = {
        supabase_user_id: user.id,
      };
      console.log('[Edge] Added user metadata to session and subscription:', user.id);
    } else {
      console.log('[Edge] No user found, creating session without metadata');
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
