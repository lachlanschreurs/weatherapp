/*
  # Auto-create Email Subscription on User Signup

  ## Overview
  Consolidates user signup and email subscription into one process.
  When a user signs up, automatically create their email subscription record
  with their authenticated email address.

  ## Changes

  1. Add unique constraint on user_id in email_subscriptions table
    - Ensures one email subscription per user

  2. Create trigger function to auto-create email subscription
    - Runs when a new profile is created
    - Sets up email subscription with user's email
    - Enables both daily forecast and weekly probe reports by default
    - Sets email_subscription_started_at to track 3-month free trial

  3. Security
    - Function runs as SECURITY DEFINER with proper permissions
    - Only creates subscription if one doesn't already exist

  ## Impact
  - Users no longer need separate email subscription signup
  - Email trial period starts immediately upon account creation
  - Simplified onboarding flow
*/

-- Add unique constraint on user_id
ALTER TABLE email_subscriptions 
  DROP CONSTRAINT IF EXISTS email_subscriptions_user_id_unique;

ALTER TABLE email_subscriptions 
  ADD CONSTRAINT email_subscriptions_user_id_unique UNIQUE (user_id);

-- Function to auto-create email subscription when user signs up
CREATE OR REPLACE FUNCTION create_email_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create email subscription automatically
  INSERT INTO email_subscriptions (
    user_id,
    email,
    daily_forecast_enabled,
    weekly_probe_report_enabled,
    location,
    timezone
  )
  VALUES (
    NEW.id,
    NEW.email,
    true,
    true,
    'Sydney, Australia',
    'Australia/Sydney'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Set email subscription start date in profile
  UPDATE profiles
  SET email_subscription_started_at = now()
  WHERE id = NEW.id
  AND email_subscription_started_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created_create_email_subscription ON profiles;

-- Create trigger that fires when a new profile is created
CREATE TRIGGER on_profile_created_create_email_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_email_subscription_on_signup();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_email_subscription_on_signup() TO authenticated;

-- Backfill existing users who don't have email subscriptions
INSERT INTO email_subscriptions (
  user_id,
  email,
  daily_forecast_enabled,
  weekly_probe_report_enabled,
  location,
  timezone
)
SELECT 
  p.id,
  p.email,
  true,
  true,
  'Sydney, Australia',
  'Australia/Sydney'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM email_subscriptions es WHERE es.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Set email subscription start date for existing users who don't have it
UPDATE profiles
SET email_subscription_started_at = now()
WHERE email_subscription_started_at IS NULL;