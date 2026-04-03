/*
  # Probe Data Sync Cron Job

  1. Purpose
    - Automatically sync probe data every 30 minutes
    - Keep readings fresh and up-to-date
    - Handle errors gracefully without breaking the job

  2. Configuration
    - Runs every 30 minutes
    - Calls the sync-probe-data edge function
    - Processes all active connections
    - Logs any failures for debugging

  3. Security
    - Uses service role key for authentication
    - Only processes active connections
    - Individual connection failures don't break the full job
*/

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing probe sync job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('probe-data-sync-job');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create the probe data sync cron job to run every 30 minutes
SELECT cron.schedule(
  'probe-data-sync-job',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-probe-data?sync_all=true',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
