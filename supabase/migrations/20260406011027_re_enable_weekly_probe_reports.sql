/*
  # Re-enable Weekly Probe Reports

  1. Changes
    - Re-enables the weekly probe report cron job
    - Runs every Sunday at 8:00 PM
    - Sends comprehensive 7-day analysis to all probe subscribers
    
  2. Security
    - Uses existing trigger function with proper authentication
*/

-- Re-enable the weekly probe report cron job
SELECT cron.schedule(
  'send-weekly-probe-reports',
  '0 20 * * 0',  -- Every Sunday at 8:00 PM
  $$SELECT trigger_weekly_probe_report();$$
);
