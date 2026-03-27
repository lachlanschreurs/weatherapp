# Automatic Billing Flow

## Overview

FarmCast now collects payment details **upfront during signup** and automatically converts trials to paid subscriptions when the 3-month free period ends.

## How It Works

### 1. Signup Flow (Day 1)

When a user signs up:

1. User enters name, email, password, and phone number
2. **Payment card details are collected immediately** via Stripe Elements
3. Card is **saved but NOT charged** (SetupIntent)
4. Stripe Customer is created
5. Trial end date is set to **3 months from signup**
6. User gets full access to all features

**Database Updates:**
```sql
trial_end_date: now() + 3 months
stripe_customer_id: cus_xxxxx
payment_method_set: true
farmer_joe_subscription_status: NULL (in trial)
```

### 2. Trial Period (Months 1-3)

During the trial:
- User has **full access** to all features
- Daily weather emails sent
- Weekly probe reports sent
- Farmer Joe AI chat available
- **No charges made**

### 3. Trial Expiration (Day 90)

The `process-trial-expirations` edge function runs daily to check for expired trials:

**What it does:**
1. Queries all profiles where:
   - `trial_end_date <= today`
   - `payment_method_set = true`
   - `farmer_joe_subscription_status IS NULL`

2. For each expired trial:
   - Retrieves Stripe customer
   - Gets saved payment method
   - **Creates Stripe subscription** automatically
   - First charge happens immediately

3. Updates database:
```sql
stripe_subscription_id: sub_xxxxx
farmer_joe_subscription_status: 'active'
farmer_joe_subscription_started_at: now()
farmer_joe_subscription_ends_at: NULL
```

### 4. Ongoing Billing

After conversion:
- Stripe **automatically charges $5.99/month**
- User continues to receive all services
- Webhooks update subscription status
- User can manage billing via Stripe Portal

## Edge Functions

### process-trial-expirations

**Endpoint:** `/functions/v1/process-trial-expirations`

**Schedule:** Run daily via cron job (needs to be set up)

**What it does:**
- Finds all trials that expired today
- Creates Stripe subscriptions for users with saved payment methods
- Updates database with subscription details
- Handles errors gracefully (logs users without payment methods)

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "failed": 2,
  "errors": [
    "User abc123: No payment method"
  ]
}
```

## User Experience

### Before Trial Ends
- User sees "X months remaining" in subscription manager
- Email reminders can be sent (optional enhancement)

### After Trial Ends
- Automatic charge of $5.99
- User receives Stripe email receipt
- No interruption to service
- Can cancel or update payment via Stripe Portal

## Database Schema

### profiles table

| Column | Type | Description |
|--------|------|-------------|
| trial_end_date | timestamptz | When free trial ends |
| stripe_customer_id | text | Stripe customer ID |
| stripe_subscription_id | text | Active subscription ID |
| payment_method_set | boolean | Has saved card |
| farmer_joe_subscription_status | text | active/cancelled/expired |
| farmer_joe_subscription_started_at | timestamptz | When paid sub started |

## Webhook Events

The system handles these Stripe webhooks:

1. **checkout.session.completed** - Manual subscription purchase
2. **customer.subscription.updated** - Subscription changes
3. **customer.subscription.deleted** - Cancellation
4. **invoice.payment_failed** - Failed payment

## Setting Up Daily Cron Job

To run the trial expiration check daily, you need to:

### Option 1: Supabase Cron (Recommended)

Create a database cron job:

```sql
SELECT cron.schedule(
  'process-trial-expirations',
  '0 2 * * *', -- Run at 2 AM daily
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/process-trial-expirations',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### Option 2: External Cron Service

Use services like:
- GitHub Actions (scheduled workflow)
- Cron-job.org
- EasyCron
- Your own server's crontab

Call the endpoint daily:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-trial-expirations \
  -H "Content-Type: application/json"
```

## Testing

### Test Trial Expiration

To test locally, manually update a user's trial end date:

```sql
UPDATE profiles
SET trial_end_date = now() - interval '1 day',
    payment_method_set = true
WHERE email = 'test@example.com';
```

Then call the edge function:
```bash
curl -X POST http://localhost:54321/functions/v1/process-trial-expirations
```

### Verify Subscription Created

Check Stripe Dashboard for new subscription and database for updated status.

## Error Handling

The system handles these scenarios:

1. **No payment method** - Marks user as cancelled, stops emails
2. **Deleted customer** - Logs error, skips user
3. **Card declined** - Stripe retries, webhook marks as expired
4. **General errors** - Logged but doesn't stop processing other users

## Benefits

1. **Higher conversion rate** - Users less likely to forget/abandon
2. **Seamless transition** - No service interruption
3. **Better cash flow** - Automatic payments
4. **Reduced churn** - No manual re-entry required
5. **Industry standard** - Same as Netflix, Spotify, etc.

## Migration Notes

This is now the **default flow** for all new signups. Existing users without payment methods on file will need to manually subscribe when their trial ends.
