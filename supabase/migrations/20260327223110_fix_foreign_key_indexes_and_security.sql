/*
  # Fix Foreign Key Indexes and Security Issues

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys:
      - `chat_messages.user_id`
      - `moisture_probes.user_id`
      - `moisture_readings.probe_id`
      - `probe_api_endpoints.user_id`
      - `profiles.default_location_id`
    - Remove unused index `idx_profiles_stripe_subscription_id`

  2. Security Fixes
    - Fix function search path for `set_email_subscription_trial`
    - Fix function search path for `create_email_subscription_on_signup`
    - Fix overly permissive RLS policy on `user_roles` table

  3. Notes
    - Auth DB connection strategy and leaked password protection must be configured in Supabase Dashboard
    - Foreign key indexes improve JOIN and lookup performance
*/

-- Add missing foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id ON moisture_probes(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id ON moisture_readings(probe_id);
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id ON probe_api_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id ON profiles(default_location_id);

-- Remove unused index
DROP INDEX IF EXISTS idx_profiles_stripe_subscription_id;

-- Fix function search path security issues
-- Drop triggers first, then functions, then recreate everything

-- Drop triggers
DROP TRIGGER IF EXISTS set_trial_dates_on_email_subscription ON email_subscriptions;
DROP TRIGGER IF EXISTS create_email_subscription_trigger ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS set_email_subscription_trial() CASCADE;
DROP FUNCTION IF EXISTS create_email_subscription_on_signup() CASCADE;

-- Recreate set_email_subscription_trial function with secure search_path
CREATE OR REPLACE FUNCTION set_email_subscription_trial()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_start_date = now();
    NEW.trial_end_date = now() + INTERVAL '14 days';
    NEW.trial_active = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger for set_email_subscription_trial
CREATE TRIGGER set_trial_dates_on_email_subscription
  BEFORE INSERT ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_email_subscription_trial();

-- Recreate create_email_subscription_on_signup function with secure search_path
CREATE OR REPLACE FUNCTION create_email_subscription_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO email_subscriptions (
    user_id,
    email,
    daily_forecast_enabled,
    weekly_probe_report_enabled,
    requires_subscription,
    trial_active,
    trial_start_date,
    trial_end_date
  ) VALUES (
    NEW.id,
    NEW.email,
    true,
    true,
    true,
    true,
    now(),
    now() + INTERVAL '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for create_email_subscription_on_signup
CREATE TRIGGER create_email_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_email_subscription_on_signup();

-- Fix overly permissive RLS policy on user_roles table
-- Drop the insecure policy and replace with a proper one
DROP POLICY IF EXISTS "Allow user role creation on signup" ON user_roles;

-- Only allow service role to create user roles
CREATE POLICY "Service role can manage user roles"
  ON user_roles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can read their own roles
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
