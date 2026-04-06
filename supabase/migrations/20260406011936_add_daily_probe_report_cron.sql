/*
  # Add Daily Probe Report Cron Job
  
  1. New Cron Jobs
    - Daily probe report emails sent at 8:00 AM AEST (10:00 PM UTC previous day)
  
  2. Changes
    - Creates cron job to trigger send-daily-probe-report function every day at 8 AM
    - Uses existing pg_cron extension
    - Sends comprehensive daily soil health reports to all eligible probe users
*/

DO $$
BEGIN
  -- Remove existing daily probe report job if it exists
  PERFORM cron.unschedule('daily-probe-reports');
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule daily probe reports at 8:00 AM AEST (10:00 PM UTC previous day)
SELECT cron.schedule(
  'daily-probe-reports',
  '0 22 * * *',
  $$
SELECT
net.http_post(
url := 'https://afiqwbvdnrrzqkxjwddh.supabase.co/functions/v1/send-daily-probe-report',
headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE"}'::jsonb,
body := '{"scheduled": true}'::jsonb
) AS request_id;
$$
);
