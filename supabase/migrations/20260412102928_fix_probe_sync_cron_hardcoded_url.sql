/*
  # Fix probe sync cron job

  The probe-data-sync-job was using current_setting('app.settings.supabase_url') which
  returns NULL, causing the HTTP call to fail silently every 30 minutes. This migration
  replaces it with the hardcoded project URL, consistent with how all other cron jobs work.

  Changes:
  - Remove the broken probe-data-sync-job
  - Re-create it with the hardcoded Supabase URL and anon key
*/

SELECT cron.unschedule('probe-data-sync-job');

SELECT cron.schedule(
  'probe-data-sync-job',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://afiqwbvdnrrzqkxjwddh.supabase.co/functions/v1/sync-probe-data?sync_all=true',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE"}'::jsonb,
      body := '{"sync_all": true}'::jsonb
    ) AS request_id;
  $$
);
