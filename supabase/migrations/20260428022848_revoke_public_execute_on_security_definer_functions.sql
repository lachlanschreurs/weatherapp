/*
  # Revoke public EXECUTE on SECURITY DEFINER functions

  ## Problem
  20 SECURITY DEFINER functions in the public schema are callable by anon and/or
  authenticated roles via PostgREST `/rpc/`. Most are trigger functions, cron
  wrappers, or internal helpers that should never be invoked directly through the API.

  ## What this migration does
  1. Revokes EXECUTE from `anon` and `authenticated` on 19 functions that must not
     be callable through the REST API.
  2. Leaves `check_phone_trial_used(text)` accessible to `anon` — it is intentionally
     called from the frontend during signup to validate phone-based trial reuse.

  ## Functions locked down (19)
  - configure_service_role_key(text) — edge function uses service_role, not anon
  - create_email_subscription_on_signup() — trigger only
  - create_probe_report_subscription_on_signup() — trigger only
  - get_probe_connection_safe(uuid) — internal helper
  - get_service_role_key() — internal helper (exposes secrets!)
  - get_user_location_for_email(uuid) — internal helper
  - handle_new_user() — auth trigger only
  - handle_new_user_signup() — auth trigger only
  - record_trial_phone_number() — trigger only
  - search_pests_ranked(...) — unused, if exists
  - search_products_ranked(...) — unused, if exists
  - search_treatments_for_pest(...) — unused, if exists
  - send_welcome_email_on_signup() — trigger only
  - trigger_daily_forecast_email() — cron only
  - trigger_weekly_probe_report() — cron only
  - trigger_welcome_email() — trigger only
  - update_email_subscription_location() — trigger only
  - update_historical_weather_updated_at() — trigger only, if exists
  - update_probe_connection_timestamp() — trigger only

  ## Function left accessible
  - check_phone_trial_used(text) — anon access required for signup validation

  ## Security notes
  - Trigger/cron functions are invoked by the database engine itself which bypasses
    EXECUTE grants, so revoking access does not break any existing functionality.
  - Service-role callers bypass EXECUTE grants, so edge functions using
    supabaseAdmin are unaffected.
*/

-- Helper: safely revoke execute only if the function exists
-- This avoids errors for functions that may not exist in this database

DO $$ BEGIN
  -- configure_service_role_key(text)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'configure_service_role_key') THEN
    REVOKE EXECUTE ON FUNCTION public.configure_service_role_key(text) FROM anon, authenticated;
  END IF;

  -- create_email_subscription_on_signup()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_email_subscription_on_signup') THEN
    REVOKE EXECUTE ON FUNCTION public.create_email_subscription_on_signup() FROM anon, authenticated;
  END IF;

  -- create_probe_report_subscription_on_signup()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_probe_report_subscription_on_signup') THEN
    REVOKE EXECUTE ON FUNCTION public.create_probe_report_subscription_on_signup() FROM anon, authenticated;
  END IF;

  -- get_probe_connection_safe(uuid)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_probe_connection_safe') THEN
    REVOKE EXECUTE ON FUNCTION public.get_probe_connection_safe(uuid) FROM anon, authenticated;
  END IF;

  -- get_service_role_key()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_service_role_key') THEN
    REVOKE EXECUTE ON FUNCTION public.get_service_role_key() FROM anon, authenticated;
  END IF;

  -- get_user_location_for_email(uuid)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_user_location_for_email') THEN
    REVOKE EXECUTE ON FUNCTION public.get_user_location_for_email(uuid) FROM anon, authenticated;
  END IF;

  -- handle_new_user()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
  END IF;

  -- handle_new_user_signup()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user_signup') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user_signup() FROM anon, authenticated;
  END IF;

  -- record_trial_phone_number()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'record_trial_phone_number') THEN
    REVOKE EXECUTE ON FUNCTION public.record_trial_phone_number() FROM anon, authenticated;
  END IF;

  -- search_pests_ranked(text, text, uuid, integer, integer)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'search_pests_ranked') THEN
    REVOKE EXECUTE ON FUNCTION public.search_pests_ranked(text, text, uuid, integer, integer) FROM anon, authenticated;
  END IF;

  -- search_products_ranked(text, uuid, text, text, integer, integer)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'search_products_ranked') THEN
    REVOKE EXECUTE ON FUNCTION public.search_products_ranked(text, uuid, text, text, integer, integer) FROM anon, authenticated;
  END IF;

  -- search_treatments_for_pest(text, text, uuid, integer)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'search_treatments_for_pest') THEN
    REVOKE EXECUTE ON FUNCTION public.search_treatments_for_pest(text, text, uuid, integer) FROM anon, authenticated;
  END IF;

  -- send_welcome_email_on_signup()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'send_welcome_email_on_signup') THEN
    REVOKE EXECUTE ON FUNCTION public.send_welcome_email_on_signup() FROM anon, authenticated;
  END IF;

  -- trigger_daily_forecast_email()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'trigger_daily_forecast_email') THEN
    REVOKE EXECUTE ON FUNCTION public.trigger_daily_forecast_email() FROM anon, authenticated;
  END IF;

  -- trigger_weekly_probe_report()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'trigger_weekly_probe_report') THEN
    REVOKE EXECUTE ON FUNCTION public.trigger_weekly_probe_report() FROM anon, authenticated;
  END IF;

  -- trigger_welcome_email()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'trigger_welcome_email') THEN
    REVOKE EXECUTE ON FUNCTION public.trigger_welcome_email() FROM anon, authenticated;
  END IF;

  -- update_email_subscription_location()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_email_subscription_location') THEN
    REVOKE EXECUTE ON FUNCTION public.update_email_subscription_location() FROM anon, authenticated;
  END IF;

  -- update_historical_weather_updated_at()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_historical_weather_updated_at') THEN
    REVOKE EXECUTE ON FUNCTION public.update_historical_weather_updated_at() FROM anon, authenticated;
  END IF;

  -- update_probe_connection_timestamp()
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_probe_connection_timestamp') THEN
    REVOKE EXECUTE ON FUNCTION public.update_probe_connection_timestamp() FROM anon, authenticated;
  END IF;
END $$;
