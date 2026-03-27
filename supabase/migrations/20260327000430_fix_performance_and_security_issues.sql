/*
  # Fix Performance and Security Issues

  ## Performance Improvements
  
  1. **Add Missing Indexes on Foreign Keys**
     - Add index on `chat_messages.user_id` for faster user message queries
     - Add index on `moisture_probes.user_id` for faster user probe lookups
     - Add index on `moisture_readings.probe_id` for faster probe reading queries
     - Add index on `probe_api_endpoints.user_id` for faster user API endpoint queries
     - Add index on `profiles.default_location_id` for faster location lookups
     - Add index on `saved_locations.user_id` for faster user location queries
     - Add index on `user_notifications.user_id` for faster user notification queries

  2. **Optimize RLS Policies**
     - Fix `auth.uid()` calls to use `(select auth.uid())` to avoid re-evaluation per row
     - Consolidate multiple permissive policies into single policies

  3. **Remove Unused Indexes**
     - Drop `idx_profiles_probe_report_subscription` (unused)
     - Drop `idx_profiles_phone_number` (unused)

  ## Security Improvements

  1. **Fix Function Search Path**
     - Make `is_email_subscription_free` function search path immutable

  ## Changes Not Applied (Require Manual Configuration)

  1. **Auth DB Connection Strategy** - Requires Supabase dashboard configuration
  2. **Leaked Password Protection** - Requires Supabase dashboard configuration in Auth settings
*/

-- Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id ON public.moisture_probes(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id ON public.moisture_readings(probe_id);
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id ON public.probe_api_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id ON public.profiles(default_location_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_profiles_probe_report_subscription;
DROP INDEX IF EXISTS idx_profiles_phone_number;

-- Consolidate and optimize RLS policies for profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own phone number" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own phone number" ON public.profiles;

-- Create optimized consolidated policies
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Fix function search path
DROP FUNCTION IF EXISTS public.is_email_subscription_free(uuid);

CREATE OR REPLACE FUNCTION public.is_email_subscription_free(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  subscription_record RECORD;
  trial_end_date timestamptz;
BEGIN
  -- Get the subscription record
  SELECT * INTO subscription_record
  FROM public.email_subscriptions
  WHERE user_id = user_id_param
  LIMIT 1;

  -- If no subscription exists, return true (free tier)
  IF subscription_record IS NULL THEN
    RETURN true;
  END IF;

  -- If they have an active paid subscription, return false
  IF subscription_record.subscription_status = 'active' AND subscription_record.tier != 'free' THEN
    RETURN false;
  END IF;

  -- Check if still in trial period (7 days from account creation)
  SELECT created_at + INTERVAL '7 days' INTO trial_end_date
  FROM auth.users
  WHERE id = user_id_param;

  -- If in trial period, return true (free during trial)
  IF trial_end_date > now() THEN
    RETURN true;
  END IF;

  -- Otherwise, they're on free tier
  RETURN true;
END;
$$;
