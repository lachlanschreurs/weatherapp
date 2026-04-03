/*
  # Fix Duplicate Cron Jobs and Update Schedule

  1. Changes
    - Remove duplicate daily forecast cron job (send-daily-forecast-emails)
    - Update daily_forecast_emails to run at 7:00 AM AEDT (20:00 UTC)
    - Keep only one active daily forecast job

  2. Notes
    - 7:00 AM AEDT = 20:00 UTC (during daylight saving)
    - This fixes the issue of 2 emails being sent at 8:00 AM
*/

-- Unschedule the old duplicate job
SELECT cron.unschedule('send-daily-forecast-emails');

-- Update the active job to run at 7:00 AM AEDT (20:00 UTC)
SELECT cron.unschedule('daily_forecast_emails');

SELECT cron.schedule(
  'daily_forecast_emails',
  '0 20 * * *',
  $$
SELECT
net.http_post(
url := 'https://afiqwbvdnrrzqkxjwddh.supabase.co/functions/v1/send-daily-forecast',
headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE"}'::jsonb,
body := '{"scheduled": true}'::jsonb
) AS request_id;
$$
);
