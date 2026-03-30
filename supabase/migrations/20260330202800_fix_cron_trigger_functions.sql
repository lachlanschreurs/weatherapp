/*
  # Fix Cron Trigger Functions

  1. Updates trigger functions to use pg_net correctly
  2. Changes from extensions.http_post to net.http_post
  3. Ensures daily emails are sent at 6 AM AEST (20:00 UTC)
*/

-- Drop and recreate the daily forecast trigger function with correct pg_net usage
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
  
  -- Use net.http_post from pg_net extension
  SELECT net.http_post(
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

-- Drop and recreate the weekly probe report trigger function with correct pg_net usage
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
  
  -- Use net.http_post from pg_net extension
  SELECT net.http_post(
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
