/*
  # Add Stripe Payment Fields to Profiles

  This migration adds Stripe integration fields to the profiles table to track
  customer and subscription information.

  ## Changes
  
  1. New Columns
    - `stripe_customer_id` - Stores Stripe customer ID
    - `stripe_subscription_id` - Stores Stripe subscription ID
    
  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - No data migration needed as these are new fields
    - Fields are nullable to support users without Stripe accounts
*/

-- Add stripe_customer_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Add stripe_subscription_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Create index on stripe_subscription_id for webhook processing
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);