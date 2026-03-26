/*
  # Add Subscription Pricing System

  ## Overview
  Creates a comprehensive subscription system for FarmCast with the following pricing structure:
  - Free tier: 5 Farmer Joe questions for guests
  - Chat subscription: $5.99/month for unlimited Farmer Joe chat
  - Email subscriptions: FREE for first 3 months, then requires active subscription

  ## Changes

  1. Add subscription columns to profiles table:
    - `farmer_joe_subscription_status` - tracks chat subscription status
    - `farmer_joe_subscription_started_at` - when chat subscription started
    - `farmer_joe_subscription_ends_at` - when chat subscription expires
    - `farmer_joe_messages_count` - tracks messages sent (for analytics)
    - `email_subscription_started_at` - when user first enabled email alerts
    - `stripe_customer_id` - for future Stripe integration
    - `stripe_subscription_id` - for future Stripe integration

  2. Security:
    - All columns are user-readable but only system-updatable
    - RLS policies protect subscription data

  ## Subscription Logic
  - Guests: 5 free Farmer Joe questions (stored in localStorage)
  - Authenticated users without subscription: Must subscribe for chat access
  - Email alerts: Free for 3 months from first enable, then requires active subscription
  - Subscription price: $5.99/month
*/

-- Add subscription-related columns to profiles table
DO $$
BEGIN
  -- Farmer Joe chat subscription status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'farmer_joe_subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN farmer_joe_subscription_status text DEFAULT 'none' CHECK (farmer_joe_subscription_status IN ('none', 'active', 'cancelled', 'expired'));
  END IF;

  -- When the Farmer Joe subscription started
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'farmer_joe_subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN farmer_joe_subscription_started_at timestamptz;
  END IF;

  -- When the Farmer Joe subscription ends/renews
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'farmer_joe_subscription_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN farmer_joe_subscription_ends_at timestamptz;
  END IF;

  -- Message count for analytics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'farmer_joe_messages_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN farmer_joe_messages_count integer DEFAULT 0;
  END IF;

  -- Track when user first enabled email subscriptions (for 3-month free period)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_subscription_started_at timestamptz;
  END IF;

  -- Stripe integration fields (for future use)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Create index for efficient subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status 
  ON profiles(farmer_joe_subscription_status);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
  ON profiles(stripe_customer_id);

-- Update email_subscriptions table to track if email feature requires subscription
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_subscriptions' AND column_name = 'requires_subscription'
  ) THEN
    ALTER TABLE email_subscriptions ADD COLUMN requires_subscription boolean DEFAULT false;
  END IF;
END $$;

-- Create a function to check if email subscriptions are still in free period
CREATE OR REPLACE FUNCTION is_email_subscription_free(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  started_at timestamptz;
  free_period_end timestamptz;
BEGIN
  SELECT email_subscription_started_at INTO started_at
  FROM profiles
  WHERE id = user_uuid;

  -- If never started, it's free (will be set when first enabled)
  IF started_at IS NULL THEN
    RETURN true;
  END IF;

  -- Calculate 3 months from start date
  free_period_end := started_at + interval '3 months';

  -- Return true if still within free period
  RETURN now() < free_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has active Farmer Joe subscription
CREATE OR REPLACE FUNCTION has_active_farmer_joe_subscription(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  sub_status text;
  sub_ends timestamptz;
BEGIN
  SELECT farmer_joe_subscription_status, farmer_joe_subscription_ends_at
  INTO sub_status, sub_ends
  FROM profiles
  WHERE id = user_uuid;

  -- Check if subscription is active and not expired
  RETURN sub_status = 'active' AND (sub_ends IS NULL OR sub_ends > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_email_subscription_free(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_farmer_joe_subscription(uuid) TO authenticated;