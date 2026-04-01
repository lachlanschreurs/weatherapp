/*
  # Remove Square and Finalize Stripe Integration

  1. Changes
    - Drop square_customer_id and square_subscription_id columns from profiles
    - Drop Square-related indexes
    - Ensure stripe_customer_id and stripe_subscription_id columns exist
    - Add stripe_subscription_status for tracking subscription state
    - Add indexes for Stripe fields for efficient lookups

  2. Security
    - No RLS changes needed as profiles table already has proper policies
*/

-- Drop Square columns and indexes
DROP INDEX IF EXISTS idx_profiles_square_customer_id;
DROP INDEX IF EXISTS idx_profiles_square_subscription_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'square_customer_id'
  ) THEN
    ALTER TABLE profiles DROP COLUMN square_customer_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'square_subscription_id'
  ) THEN
    ALTER TABLE profiles DROP COLUMN square_subscription_id;
  END IF;
END $$;

-- Ensure Stripe columns exist with proper types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_status text DEFAULT 'inactive';
  END IF;
END $$;

-- Create indexes for efficient Stripe lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_status ON profiles(stripe_subscription_status);
