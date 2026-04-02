# Payment Flow Documentation

## Overview
FarmCast uses Stripe for subscription payments with a 30-day free trial period. Users get immediate access to premium features upon signup and are only charged after the trial ends.

## Subscription Details
- **Price**: $2.99/month
- **Trial Period**: 30 days (1 month) free
- **Billing**: Automatic recurring monthly after trial
- **Cancellation**: Users can cancel anytime

## Premium Features (Subscriber-Only Access)
1. **30-Day Extended Forecast** - Detailed weather predictions up to 30 days ahead
2. **Weather Alerts & Notifications** - Real-time alerts for important weather conditions
3. **Email Notifications** - Daily forecast and weekly probe reports via email
4. **Best Planting Days** - AI-powered recommendations for optimal planting conditions
5. **Irrigation Schedule** - Smart irrigation planning based on weather patterns
6. **Probe Monitoring** - Connect and monitor farm probes with real-time updates
7. **Farmer Joe AI Assistant** - Interactive AI chat for farm planning advice

## Free Tier Features
1. 7-day basic weather forecast
2. Current weather conditions
3. Hourly forecasts (next 48 hours)
4. Spray window recommendations
5. Delta T calculations
6. Rain radar
7. Basic spray conditions guide

## Payment Flow

### 1. User Signup
```
User creates account → Profile created with trial_end_date = now() + 30 days
                     → farmer_joe_subscription_status = 'active'
                     → User has immediate access to all premium features
```

### 2. Payment Method Addition (During Trial)
```
User clicks "Add Payment" → create-checkout-session Edge Function called
                         → Stripe Checkout Session created with 30-day trial
                         → User redirected to Stripe
                         → User enters payment details
                         → Stripe webhook: checkout.session.completed
                         → stripe_subscription_id saved to profile
                         → Trial continues, no charge yet
```

### 3. Trial Period (30 Days)
- User has full access to all premium features
- No charges during trial
- User can cancel anytime without being charged
- `trial_end_date` tracks when trial expires
- Stripe subscription status = 'trialing'

### 4. Trial Ends (Day 31)
```
Trial expires → Stripe automatically charges $2.99
             → Stripe webhook: invoice.payment_succeeded
             → Subscription continues as 'active'
             → User charged $2.99 monthly going forward
```

### 5. Payment Failure
```
Payment fails → Stripe webhook: invoice.payment_failed
             → farmer_joe_subscription_status = 'expired'
             → User loses access to premium features
             → Free tier access remains
```

### 6. Cancellation
```
User cancels → Stripe webhook: customer.subscription.deleted
            → farmer_joe_subscription_status = 'expired'
            → Access until end of billing period
            → Then downgraded to free tier
```

## Database Schema

### Profiles Table (Payment Fields)
- `stripe_customer_id` - Stripe customer identifier
- `stripe_subscription_id` - Stripe subscription identifier
- `farmer_joe_subscription_status` - 'active', 'cancelled', or 'expired'
- `trial_end_date` - When the free trial expires (30 days from signup)
- `farmer_joe_subscription_started_at` - When subscription started
- `farmer_joe_subscription_ends_at` - When subscription ends (for cancelled)

## Subscription Status Checking

The app checks subscription status using:
```typescript
function checkSubscriptionStatus(userId: string): Promise<boolean> {
  // 1. Check if trial is still active (trial_end_date > now)
  // 2. Check if Stripe subscription is active (farmer_joe_subscription_status = 'active')
  // 3. Return true if either condition is met
}
```

## Edge Functions

### 1. create-checkout-session
- **Purpose**: Creates Stripe checkout session for payment method collection
- **Trigger**: User clicks "Add Payment" or "Subscribe Now"
- **Trial**: Sets 30-day trial period in Stripe
- **Returns**: Stripe checkout URL

### 2. stripe-webhook
- **Purpose**: Handles Stripe webhook events to sync subscription status
- **Events Handled**:
  - `checkout.session.completed` - Payment method added
  - `customer.subscription.updated` - Subscription status changed
  - `customer.subscription.deleted` - Subscription cancelled
  - `invoice.payment_failed` - Payment failed
- **Security**: Validates webhook signature using STRIPE_WEBHOOK_SECRET

## Environment Variables

### Frontend (.env)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID=price_...
```

### Backend (Supabase Secrets)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

## UI Components

### SubscriptionManager
- Displays subscription pricing and features
- Creates checkout session
- Redirects to Stripe for payment
- Shows $2.99/month with 30-day free trial

### Premium Feature Gates
All premium features check `hasActiveSubscription` state:
- Shows feature if active subscription
- Shows upgrade prompt if no subscription
- Prompts include "Start Free Trial - $2.99/month after"

## Testing Checklist

- [ ] New user signup creates profile with trial_end_date
- [ ] Trial users have full premium access
- [ ] Payment flow redirects to Stripe correctly
- [ ] Webhook updates subscription status
- [ ] Trial expiration removes premium access
- [ ] Payment failure removes premium access
- [ ] Cancellation maintains access until period ends
- [ ] Free tier users see upgrade prompts
- [ ] Premium users see all features

## Next Steps for Production

1. Replace test Stripe keys with production keys
2. Set up Stripe webhook endpoint in production
3. Configure STRIPE_WEBHOOK_SECRET from Stripe dashboard
4. Test full payment flow end-to-end
5. Set up monitoring for failed payments
6. Configure email notifications for payment events
