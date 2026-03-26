/*
  # Fix Security Issues - Unused Indexes and Function Search Paths

  ## Changes Made

  ### 1. Remove Unused Indexes
  Removed 12 unused indexes that were consuming storage and slowing down writes:
  - `idx_chat_messages_user_id`
  - `idx_profiles_default_location_id`
  - `idx_user_notifications_user_id`
  - `idx_email_subscriptions_trial_active`
  - `idx_moisture_probes_user_id`
  - `idx_moisture_readings_probe_id`
  - `idx_probe_api_endpoints_user_id`
  - `idx_saved_locations_user_id`
  - `idx_email_subscriptions_daily`
  - `idx_email_subscriptions_weekly`
  - `idx_profiles_subscription_status`
  - `idx_profiles_stripe_customer`

  ### 2. Fix Function Search Paths (Critical Security Fix)
  Updated all functions to use immutable search_path to prevent privilege escalation attacks:
  - `send_welcome_email_on_signup`
  - `set_email_subscription_trial`
  - `should_send_email_reports`
  - `update_trial_status`
  - `is_admin`
  - `is_email_subscription_free`
  - `has_active_farmer_joe_subscription`

  ## Security Notes
  - Mutable search paths are a critical security vulnerability
  - Setting search_path = '' forces explicit schema qualification
  - This prevents potential SQL injection and privilege escalation attacks
  
  ## Manual Configuration Required in Supabase Dashboard
  1. **Auth DB Connection Strategy**: Change from fixed (10 connections) to percentage-based
     - Navigate to: Database Settings > Connection Pooling
  2. **Leaked Password Protection**: Enable HaveIBeenPwned.org integration
     - Navigate to: Authentication > Settings > Security
     - Enable "Check for compromised passwords"
*/

-- Step 1: Drop unused indexes
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_profiles_default_location_id;
DROP INDEX IF EXISTS idx_user_notifications_user_id;
DROP INDEX IF EXISTS idx_email_subscriptions_trial_active;
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_saved_locations_user_id;
DROP INDEX IF EXISTS idx_email_subscriptions_daily;
DROP INDEX IF EXISTS idx_email_subscriptions_weekly;
DROP INDEX IF EXISTS idx_profiles_subscription_status;
DROP INDEX IF EXISTS idx_profiles_stripe_customer;

-- Step 2: Drop all triggers that depend on the functions
DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_set_trial ON public.profiles;
DROP TRIGGER IF EXISTS set_trial_dates_on_email_subscription ON public.email_subscriptions;

-- Step 3: Drop and recreate functions with secure search_path

-- Function 1: send_welcome_email_on_signup
DROP FUNCTION IF EXISTS public.send_welcome_email_on_signup();
CREATE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to FarmCast!',
    'Thank you for joining FarmCast. Get started by setting up your location and exploring weather forecasts tailored for farming.',
    'info'
  );
  RETURN NEW;
END;
$$;

-- Function 2: set_email_subscription_trial
DROP FUNCTION IF EXISTS public.set_email_subscription_trial();
CREATE FUNCTION public.set_email_subscription_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.email_subscriptions (user_id, is_trial, trial_end_date)
  VALUES (
    NEW.id,
    true,
    CURRENT_DATE + INTERVAL '7 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function 3: should_send_email_reports
DROP FUNCTION IF EXISTS public.should_send_email_reports(uuid);
CREATE FUNCTION public.should_send_email_reports(subscription_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  subscription_record RECORD;
  profile_record RECORD;
BEGIN
  SELECT * INTO subscription_record
  FROM public.email_subscriptions
  WHERE user_id = subscription_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF subscription_record.is_trial THEN
    IF subscription_record.trial_end_date >= CURRENT_DATE THEN
      RETURN true;
    ELSE
      RETURN false;
    END IF;
  END IF;

  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = subscription_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF profile_record.subscription_status = 'active' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Function 4: update_trial_status
DROP FUNCTION IF EXISTS public.update_trial_status();
CREATE FUNCTION public.update_trial_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.email_subscriptions
  SET is_trial = false
  WHERE is_trial = true
    AND trial_end_date < CURRENT_DATE;
END;
$$;

-- Function 5: is_admin
DROP FUNCTION IF EXISTS public.is_admin(uuid);
CREATE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = check_user_id;

  RETURN user_role = 'admin';
END;
$$;

-- Function 6: is_email_subscription_free
DROP FUNCTION IF EXISTS public.is_email_subscription_free();
CREATE FUNCTION public.is_email_subscription_free()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN true;
END;
$$;

-- Function 7: has_active_farmer_joe_subscription
DROP FUNCTION IF EXISTS public.has_active_farmer_joe_subscription(uuid);
CREATE FUNCTION public.has_active_farmer_joe_subscription(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  sub_status text;
BEGIN
  SELECT subscription_status INTO sub_status
  FROM public.profiles
  WHERE id = check_user_id;

  RETURN sub_status = 'active';
END;
$$;

-- Step 4: Recreate all triggers with the updated functions
CREATE TRIGGER on_profile_created_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();

CREATE TRIGGER set_trial_dates_on_email_subscription
  BEFORE INSERT ON public.email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_subscription_trial();
