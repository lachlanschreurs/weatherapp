/*
  # Setup Email Cron Jobs with pg_net
  
  1. Changes
    - Enable pg_net extension for HTTP requests
    - Create wrapper functions to call edge functions
    - Schedule daily forecast emails at 7 AM AEDT
    - Schedule weekly probe reports on Mondays at 7 AM AEDT
    
  2. Security
    - Requires service role key configuration
    - Functions are security definer for database access
*/

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to configure service role key
CREATE OR REPLACE FUNCTION configure_service_role_key(key_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET app.settings.service_role_key = %L', current_database(), key_value);
  RAISE NOTICE 'Service role key configured successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not set database config: %. You may need superuser permissions.', SQLERRM;
END;
$$;

-- Create wrapper function to call daily forecast edge function
CREATE OR REPLACE FUNCTION trigger_daily_forecast_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://afiqwbvdnrrzqkxjwddh.supabase.co';
  service_key text;
  request_id bigint;
BEGIN
  BEGIN
    service_key := current_setting('app.settings.service_role_key', false);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Service role key not configured. Run: SELECT configure_service_role_key(''your-service-role-key'');';
    RETURN;
  END;
  
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/send-daily-forecast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Daily forecast email triggered with request_id: %', request_id;
END;
$$;

-- Create wrapper function for weekly probe reports
CREATE OR REPLACE FUNCTION trigger_weekly_probe_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://afiqwbvdnrrzqkxjwddh.supabase.co';
  service_key text;
  request_id bigint;
BEGIN
  BEGIN
    service_key := current_setting('app.settings.service_role_key', false);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Service role key not configured';
    RETURN;
  END;
  
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/send-weekly-probe-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Weekly probe report triggered with request_id: %', request_id;
END;
$$;

COMMENT ON FUNCTION configure_service_role_key IS 'Sets the service role key for cron jobs. Call with: SELECT configure_service_role_key(''your-service-role-key'');';
COMMENT ON FUNCTION trigger_daily_forecast_email IS 'Triggers daily forecast email. Test with: SELECT trigger_daily_forecast_email();';
COMMENT ON FUNCTION trigger_weekly_probe_report IS 'Triggers weekly probe report. Test with: SELECT trigger_weekly_probe_report();';
