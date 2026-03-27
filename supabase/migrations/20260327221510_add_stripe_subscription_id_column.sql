/*
  # Add Stripe Subscription ID Column
  
  1. Changes
    - Add `stripe_subscription_id` column to profiles table to track active Stripe subscriptions
    - This enables automatic billing after trial period ends
    - Create index for efficient lookups
  
  2. Notes
    - Subscription ID is populated when trial converts to paid subscription
    - Used by webhook handlers to update subscription status
    - NULL value indicates no active subscription
*/

DO $$
BEGIN
  -- Add stripe_subscription_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Create index on stripe_subscription_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
