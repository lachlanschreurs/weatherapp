/*
  # Configure Cron Jobs to Use Environment Service Role Key
  
  1. Changes
    - Update trigger functions to use hardcoded service role key reference
    - This works because the functions run with SECURITY DEFINER
    
  2. Notes
    - The service role key is stored as an edge function secret
    - We'll reference it directly in the trigger functions
*/

-- Note: In Supabase, we need to store the service role key directly
-- This is a one-time setup that will be configured via the Supabase dashboard

-- For now, create a helper function that edge functions can call
-- The actual service role key will be passed from the edge function environment

CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be set via ALTER DATABASE command after deployment
  RETURN current_setting('app.settings.service_role_key', true);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Update the trigger functions to use a stored config
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
  service_key := get_service_role_key();
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not configured';
    RETURN;
  END IF;
  
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
  service_key := get_service_role_key();
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not configured';
    RETURN;
  END IF;
  
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
