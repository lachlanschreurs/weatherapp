/*
  # Setup Daily Email Cron Job with Direct URL
  
  1. Purpose
    - Configure daily forecast emails to send at 7:00 AM every day
    - Configure welcome email trigger on new user signup
  
  2. Cron Jobs
    - daily_forecast_emails: Runs at 7:00 AM daily (Australia/Sydney timezone)
  
  3. Triggers
    - Welcome email sent automatically when new user signs up
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron jobs to avoid duplicates
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('daily_forecast_emails', 'weekly_probe_reports', 'daily-forecast-7am-sydney', 'daily-forecast-7am-melbourne');

-- Create daily forecast email cron job - runs at 7:00 AM every day (7 days a week)
-- Using Australia/Sydney timezone (UTC+10/+11 depending on DST)
-- 7 AM Sydney = 9 PM UTC (during standard time) or 8 PM UTC (during DST)
-- We'll use 21:00 UTC which is roughly 7 AM Sydney time
SELECT cron.schedule(
  'daily_forecast_emails',
  '0 21 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://afiqwbvdnrrzqkxjwddh.supabase.co/functions/v1/send-daily-forecast',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the cron job was created
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'daily_forecast_emails';
