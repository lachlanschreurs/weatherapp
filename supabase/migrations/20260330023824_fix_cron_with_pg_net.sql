/*
  # Fix Cron Jobs with pg_net Extension
  
  1. Changes
    - Enable pg_net extension for HTTP requests
    - Create wrapper function to call edge functions
    - Recreate cron jobs using the wrapper function
    
  2. Security
    - Service role key must be configured via Supabase dashboard
*/

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing cron jobs
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname IN ('send-daily-forecast-emails', 'send-weekly-probe-reports');

-- Create a wrapper function to call the daily forecast edge function
CREATE OR REPLACE FUNCTION trigger_daily_forecast_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://zesytitlsrdjvhnlgmpm.supabase.co';
  service_key text;
  request_id bigint;
BEGIN
  -- Get service role key from configuration
  BEGIN
    service_key := current_setting('app.settings.service_role_key', false);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Service role key not configured. Please set via: ALTER DATABASE postgres SET app.settings.service_role_key = ''your-key''';
    RETURN;
  END;
  
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

-- Create wrapper function for weekly probe reports
CREATE OR REPLACE FUNCTION trigger_weekly_probe_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://zesytitlsrdjvhnlgmpm.supabase.co';
  service_key text;
  request_id bigint;
BEGIN
  -- Get service role key from configuration
  BEGIN
    service_key := current_setting('app.settings.service_role_key', false);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Service role key not configured';
    RETURN;
  END;
  
  -- Make HTTP request using pg_net
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

-- Schedule daily forecast emails at 7:00 AM AEDT (8:00 PM UTC previous day)
SELECT cron.schedule(
  'send-daily-forecast-emails',
  '0 20 * * *',
  'SELECT trigger_daily_forecast_email();'
);

-- Schedule weekly probe report emails every Monday at 7:00 AM AEDT (8:00 PM UTC Sunday)
SELECT cron.schedule(
  'send-weekly-probe-reports',
  '0 20 * * 0',
  'SELECT trigger_weekly_probe_report();'
);
