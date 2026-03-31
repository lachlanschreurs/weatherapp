/*
  # Fix Function Search Path Security Issues

  1. Changes
    - Drop and recreate SECURITY DEFINER functions with explicit SET search_path
    - Prevents search_path hijacking attacks
    - Ensures functions only access expected schemas

  2. Functions Updated
    - configure_service_role_key
    - trigger_daily_forecast_email
    - trigger_weekly_probe_report
    - get_service_role_key

  3. Security Impact
    - Prevents malicious users from creating objects in other schemas that could be called by these functions
    - Ensures predictable function behavior
*/

-- Drop and recreate configure_service_role_key
DROP FUNCTION IF EXISTS public.configure_service_role_key(text);

CREATE FUNCTION public.configure_service_role_key(key_value text)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.settings.service_role_key', key_value, false);
END;
$$;

-- Drop and recreate trigger_daily_forecast_email
DROP FUNCTION IF EXISTS public.trigger_daily_forecast_email();

CREATE FUNCTION public.trigger_daily_forecast_email()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  function_url text;
  anon_key text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-daily-forecast';
  anon_key := current_setting('app.settings.anon_key', true);
  
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Drop and recreate trigger_weekly_probe_report
DROP FUNCTION IF EXISTS public.trigger_weekly_probe_report();

CREATE FUNCTION public.trigger_weekly_probe_report()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  function_url text;
  anon_key text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-weekly-probe-report';
  anon_key := current_setting('app.settings.anon_key', true);
  
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Drop and recreate get_service_role_key
DROP FUNCTION IF EXISTS public.get_service_role_key();

CREATE FUNCTION public.get_service_role_key()
RETURNS text
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN current_setting('app.settings.service_role_key', true);
END;
$$;
