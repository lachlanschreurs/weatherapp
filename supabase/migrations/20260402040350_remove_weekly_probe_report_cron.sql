/*
  # Remove Weekly Probe Report Cron Job
  
  1. Purpose
    - Remove the weekly soil moisture report cron job
    - Soil moisture reports are now included in daily emails at 7:00 AM
    - Keep only the daily forecast email cron job running at 7:00 AM
  
  2. Changes
    - Unschedule weekly_probe_reports cron job
    - Keep daily_forecast_emails cron job active
  
  3. Important Notes
    - Daily emails at 7:00 AM include soil moisture analysis
    - No separate weekly reports needed
*/

-- Remove the weekly probe report cron job
SELECT cron.unschedule('weekly_probe_reports');

-- Verify only daily forecast job remains
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE jobname IN ('daily_forecast_emails', 'weekly_probe_reports');
