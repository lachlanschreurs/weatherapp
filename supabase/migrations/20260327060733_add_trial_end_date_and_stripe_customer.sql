/*
  # Add Trial End Date and Stripe Customer ID

  1. Changes to profiles table
    - Add `trial_end_date` column to track when the 3-month free trial ends
    - Add `stripe_customer_id` column to store the Stripe customer ID
    - Add `payment_method_set` column to track if card details have been provided

  2. Notes
    - Trial end date is automatically set to 3 months from signup
    - Stripe customer ID links user to their Stripe account
    - Payment method flag indicates if user has completed card setup
*/

DO $$
BEGIN
  -- Add trial_end_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_end_date timestamptz;
  END IF;

  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;

  -- Add payment_method_set column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_method_set'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_method_set boolean DEFAULT false;
  END IF;
END $$;

-- Create index on trial_end_date for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);

-- Create index on stripe_customer_id for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
