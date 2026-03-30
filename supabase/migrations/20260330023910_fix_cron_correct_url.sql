/*
  # Fix Cron Jobs with Correct Supabase URL
  
  1. Changes
    - Update wrapper functions to use correct Supabase URL
    - Service role key is already configured in edge function secrets
    
  2. Security
    - Uses SUPABASE_SERVICE_ROLE_KEY from environment
*/

-- Drop and recreate wrapper function with correct URL
CREATE OR REPLACE FUNCTION trigger_daily_forecast_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://ryohnlsfnbuizblcpbyd.supabase.co';
  service_key text;
  request_id bigint;
BEGIN
  -- Try to get service role key from database config first
  BEGIN
    service_key := current_setting('app.settings.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    service_key := NULL;
  END;
  
  -- Fallback to getting from environment (available in edge functions)
  IF service_key IS NULL OR service_key = '' THEN
    BEGIN
      -- Use the supabase service role key from vault
      service_key := current_setting('supabase.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      -- Last resort: check if SUPABASE_SERVICE_ROLE_KEY is set
      BEGIN
        service_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Service role key not found in any location';
        RETURN;
      END;
    END;
  END IF;
  
  IF service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'Service role key is empty or null';
    RETURN;
  END IF;
  
  -- Make HTTP request using pg_net
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

-- Update weekly probe report function
CREATE OR REPLACE FUNCTION trigger_weekly_probe_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://ryohnlsfnbuizblcpbyd.supabase.co';
  service_key text;
  request_id bigint;
BEGIN
  -- Try to get service role key
  BEGIN
    service_key := current_setting('app.settings.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    service_key := NULL;
  END;
  
  IF service_key IS NULL OR service_key = '' THEN
    BEGIN
      service_key := current_setting('supabase.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        service_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Service role key not found';
        RETURN;
      END;
    END;
  END IF;
  
  IF service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'Service role key is empty';
    RETURN;
  END IF;
  
  -- Make HTTP request
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
