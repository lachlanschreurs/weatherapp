/*
  # Remove Payment System Fields

  This migration removes all payment-related fields from the profiles table
  to make the service completely free.

  ## Changes
  
  1. Profiles Table Changes
    - Remove stripe_customer_id column
    - Remove stripe_subscription_id column
    - Remove payment_method_set column
    - Remove trial_end_date column
    - Remove farmer_joe_subscription_ends_at column
    - Set all users to active status
    
  2. Security
    - Maintains existing RLS policies
    - No data loss for user profiles
    
  ## Notes
  
  - All existing users will have active subscriptions
  - Email and probe report subscriptions remain active for all users
*/

-- Remove payment-related columns
DO $$
BEGIN
  -- Remove Stripe fields
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles DROP COLUMN stripe_customer_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles DROP COLUMN stripe_subscription_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_method_set'
  ) THEN
    ALTER TABLE profiles DROP COLUMN payment_method_set;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE profiles DROP COLUMN trial_end_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'farmer_joe_subscription_ends_at'
  ) THEN
    ALTER TABLE profiles DROP COLUMN farmer_joe_subscription_ends_at;
  END IF;
END $$;

-- Set all users to active status with no end date
UPDATE profiles 
SET farmer_joe_subscription_status = 'active'
WHERE farmer_joe_subscription_status IS NULL 
   OR farmer_joe_subscription_status = 'none'
   OR farmer_joe_subscription_status = 'trial';

-- Ensure all users have active email subscriptions
UPDATE profiles
SET email_subscription_started_at = COALESCE(email_subscription_started_at, NOW())
WHERE email_subscription_started_at IS NULL;

-- Ensure all users have active probe report subscriptions
UPDATE profiles
SET probe_report_subscription_started_at = COALESCE(probe_report_subscription_started_at, NOW())
WHERE probe_report_subscription_started_at IS NULL;