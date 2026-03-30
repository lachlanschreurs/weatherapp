/*
  # Fix Cron Jobs with Anon Key

  1. Updates trigger functions to use anon key instead of service role
  2. Edge functions are public so anon key is sufficient
  3. Ensures daily emails are sent properly
*/

-- Update the daily forecast trigger function to use anon key
CREATE OR REPLACE FUNCTION trigger_daily_forecast_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://afiqwbvdnrrzqkxjwddh.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE';
  request_id bigint;
BEGIN
  -- Use net.http_post from pg_net extension
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-daily-forecast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Daily forecast email triggered with request_id: %', request_id;
END;
$$;

-- Update the weekly probe report trigger function to use anon key
CREATE OR REPLACE FUNCTION trigger_weekly_probe_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text := 'https://afiqwbvdnrrzqkxjwddh.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE';
  request_id bigint;
BEGIN
  -- Use net.http_post from pg_net extension
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-weekly-probe-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Weekly probe report triggered with request_id: %', request_id;
END;
$$;
