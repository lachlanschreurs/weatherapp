/*
  # Add Square Subscription Fields

  1. Changes
    - Add square_customer_id column to profiles table for tracking Square customers
    - Add square_subscription_id column to profiles table for tracking Square subscriptions
    - Add indexes for efficient lookups by Square IDs

  2. Notes
    - These fields will replace Stripe fields for subscription management
    - Existing stripe_customer_id and stripe_subscription_id columns will be removed in a future migration after full transition
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'square_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN square_customer_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'square_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN square_subscription_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_square_customer_id ON profiles(square_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_square_subscription_id ON profiles(square_subscription_id);
