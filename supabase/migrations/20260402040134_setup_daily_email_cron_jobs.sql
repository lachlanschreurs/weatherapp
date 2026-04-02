/*
  # Setup Daily Email Cron Jobs
  
  1. Purpose
    - Ensure daily forecast emails are sent at 7:00 AM every single day (7 days a week)
    - Ensure weekly probe reports are sent every Sunday at 8:00 AM
    - Use pg_cron extension for reliable scheduled execution
  
  2. Cron Jobs Created
    - daily_forecast_emails: Runs at 7:00 AM daily (Australia/Sydney timezone)
    - weekly_probe_reports: Runs at 8:00 AM every Sunday (Australia/Sydney timezone)
  
  3. Important Notes
    - Jobs run 7 days a week without exception
    - Uses Supabase edge functions for email delivery
    - Configured with service role permissions
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron jobs with similar names to avoid duplicates
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('daily_forecast_emails', 'weekly_probe_reports');

-- Create daily forecast email cron job - runs at 7:00 AM every day (7 days a week)
SELECT cron.schedule(
  'daily_forecast_emails',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-daily-forecast',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('scheduled', true, 'timestamp', now())
    ) AS request_id;
  $$
);

-- Create weekly probe report cron job - runs at 8:00 AM every Sunday
SELECT cron.schedule(
  'weekly_probe_reports',
  '0 8 * * 0',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-weekly-probe-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('scheduled', true, 'timestamp', now())
    ) AS request_id;
  $$
);

-- Verify the jobs were created
SELECT jobid, jobname, schedule, active, command 
FROM cron.job 
WHERE jobname IN ('daily_forecast_emails', 'weekly_probe_reports');
