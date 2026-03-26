# Stripe Integration Setup Guide

This guide will help you set up Stripe for the FarmCast subscription system.

## Overview

FarmCast uses Stripe to process the $5.99/month subscription for:
- Unlimited Farmer Joe AI chat access
- Email alerts (after 3-month free trial)

## Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign in or create a new account
3. Navigate to **Developers** → **API keys**
4. Copy both:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

⚠️ **Important**: Use test mode keys (starts with `pk_test_` and `sk_test_`) for development.

## Step 2: Create a Subscription Product

1. In Stripe Dashboard, go to **Products** → **Add product**
2. Fill in the details:
   - **Name**: Farmer Joe Premium
   - **Description**: Unlimited AI farming assistant + email alerts
   - **Pricing**:
     - Type: Recurring
     - Price: $5.99 USD
     - Billing period: Monthly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)

## Step 3: Configure Environment Variables

### Local Development (.env file)

Add to your `.env` file:
```
VITE_STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
```

### Supabase Edge Functions (Production)

The following secrets need to be configured for your Supabase project:

```bash
# Your Stripe secret key (from Step 1)
STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx

# Create a webhook endpoint first (see Step 4), then add the signing secret here
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Note: The edge functions will automatically use these secrets once deployed.

## Step 4: Set Up Stripe Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter the webhook URL:
   ```
   https://ryohnlsfnbuizblcpbyd.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add this to your Supabase project secrets as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test the Integration

### Test Cards (Test Mode Only)

Use these test card numbers in Stripe test mode:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any 5-digit postal code.

### Testing Flow

1. Sign in to your app
2. Click "Subscribe Now" button
3. Complete checkout with a test card
4. Verify subscription is activated in your profile
5. Test Farmer Joe chat (should work unlimited)
6. Check Stripe Dashboard for the subscription

## Step 6: Go Live

When ready for production:

1. **Switch to Live Mode** in Stripe Dashboard
2. Get your **live API keys** (starts with `pk_live_` and `sk_live_`)
3. Update your environment variables with live keys
4. Update the webhook endpoint to use live mode
5. Test with a real card (you can cancel immediately)

## Deployed Edge Functions

The following Stripe-related edge functions are already deployed:

1. **create-checkout-session**
   - Creates Stripe checkout sessions
   - Handles subscription signup
   - Returns checkout URL

2. **stripe-webhook**
   - Receives Stripe events
   - Updates subscription status in database
   - Handles subscription lifecycle

3. **create-customer-portal-session**
   - Creates Stripe customer portal sessions
   - Allows users to manage their subscriptions
   - Handles cancellations and payment updates

## Subscription Flow

### New User Journey

1. User signs up → Email subscription created automatically (3-month free trial starts)
2. User tries Farmer Joe chat → Prompted to subscribe ($5.99/month)
3. User clicks "Subscribe Now" → Redirected to Stripe Checkout
4. User completes payment → Webhook updates database
5. User gets unlimited Farmer Joe access
6. After 3 months → Email alerts require active subscription

### Subscription Status

The system tracks subscription status in the `profiles` table:
- `farmer_joe_subscription_status`: 'none', 'active', 'cancelled', 'expired'
- `farmer_joe_subscription_started_at`: When subscription started
- `farmer_joe_subscription_ends_at`: When subscription ends (if cancelled)
- `stripe_customer_id`: Stripe customer ID
- `stripe_subscription_id`: Stripe subscription ID

## Managing Subscriptions

Users can manage their subscriptions through:
1. **User Menu** → "Manage Subscription"
2. This opens the Subscription Manager UI
3. Active subscribers can click "Manage Subscription" to access Stripe's customer portal
4. In the portal, users can:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Update billing information

## Troubleshooting

### Webhook Not Working
- Verify the webhook URL is correct
- Check that all required events are selected
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Supabase logs for errors

### Checkout Not Opening
- Verify `VITE_STRIPE_PRICE_ID` is set in .env
- Check browser console for errors
- Ensure user is authenticated
- Verify Stripe secret key is configured

### Subscription Not Activating
- Check webhook is receiving events
- Verify database permissions
- Check Supabase logs for edge function errors
- Ensure metadata contains correct `supabase_user_id`

## Security Notes

⚠️ **Never expose your Stripe secret key in client-side code**
⚠️ **Always use environment variables for sensitive keys**
⚠️ **Test thoroughly in test mode before going live**
⚠️ **Monitor your Stripe webhook logs regularly**

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For FarmCast integration issues:
- Check Supabase logs
- Review edge function logs
- Test webhooks in Stripe dashboard
