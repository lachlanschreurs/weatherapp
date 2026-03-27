/*
  # Fix Subscription Triggers and Backfill Missing Data

  ## Problem
  Multiple issues preventing proper user signup:
  1. Conflicting triggers with outdated column references
  2. Missing profiles for users created after certain migrations
  3. Missing email subscriptions for existing users

  ## Changes
  1. Remove conflicting trial trigger that uses old columns
  2. Update profile creation trigger to work correctly
  3. Backfill missing profiles from auth.users
  4. Backfill missing email subscriptions for all profiles

  ## Impact
  - All existing users will have proper profiles and email subscriptions
  - New signups will automatically create both profile and email subscription
*/

-- Drop the conflicting trigger that's causing issues
DROP TRIGGER IF EXISTS set_trial_dates_on_email_subscription ON email_subscriptions;

-- Update the trigger function to set trial dates correctly
CREATE OR REPLACE FUNCTION set_email_subscription_trial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_start_date IS NULL THEN
    NEW.trial_start_date := now();
  END IF;
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date := now() + interval '3 months';
  END IF;
  IF NEW.trial_active IS NULL THEN
    NEW.trial_active := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER set_trial_dates_on_email_subscription
  BEFORE INSERT ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_email_subscription_trial();

-- Fix the profile creation trigger
CREATE OR REPLACE FUNCTION create_email_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create email subscription automatically with trial dates
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create missing profiles for users without them
INSERT INTO profiles (id, email, email_subscription_started_at, trial_end_date)
SELECT 
  au.id, 
  au.email,
  au.created_at,
  au.created_at + interval '3 months'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Create missing email subscriptions for all profiles that don't have one
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
