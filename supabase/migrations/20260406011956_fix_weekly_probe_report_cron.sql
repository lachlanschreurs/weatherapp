/*
  # Fix Weekly Probe Report Cron Job
  
  1. Changes
    - Updates weekly probe report cron to call edge function directly
    - Removes dependency on database trigger function
    - Runs every Sunday at 8:00 PM AEST (10:00 AM UTC)
*/

DO $$
BEGIN
  -- Remove existing weekly probe report job
  PERFORM cron.unschedule('send-weekly-probe-reports');
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule weekly probe reports every Sunday at 8:00 PM AEST (10:00 AM UTC)
SELECT cron.schedule(
  'send-weekly-probe-reports',
  '0 10 * * 0',
  $$
SELECT
net.http_post(
url := 'https://afiqwbvdnrrzqkxjwddh.supabase.co/functions/v1/send-weekly-probe-report',
headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE"}'::jsonb,
body := '{"scheduled": true}'::jsonb
) AS request_id;
$$
);
