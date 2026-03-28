/*
  # Add Cron Jobs for Email Subscriptions
  
  1. Purpose
    - Automatically send daily forecast emails at 7:00 AM AEDT (Australian Eastern Daylight Time)
    - Automatically send weekly probe reports every Monday at 7:00 AM AEDT
    
  2. Implementation
    - Uses pg_cron extension to schedule HTTP requests to edge functions
    - Schedules are in UTC (7 AM AEDT = 8 PM UTC previous day, accounting for daylight savings)
    - Daily forecast: Every day at 8:00 PM UTC (7 AM AEDT next day)
    - Weekly probe report: Every Monday at 8:00 PM UTC (7 AM AEDT Tuesday)
    
  3. Security
    - Uses service role key for authenticated function calls
    - Cron jobs run with superuser privileges
    
  4. Notes
    - pg_cron extension must be enabled in Supabase Dashboard
    - Timezone is set to UTC for consistency
    - Adjust schedule times if AEDT changes or for different timezones
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily forecast emails at 7:00 AM AEDT (8:00 PM UTC previous day)
SELECT cron.schedule(
  'send-daily-forecast-emails',
  '0 20 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-forecast',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Schedule weekly probe report emails every Monday at 7:00 AM AEDT (8:00 PM UTC Sunday)
SELECT cron.schedule(
  'send-weekly-probe-reports',
  '0 20 * * 0',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-weekly-probe-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Set runtime configuration for supabase URL and service role key
DO $$
BEGIN
  -- These will be set via ALTER DATABASE in production
  -- For now, we create placeholder settings
  EXECUTE format('ALTER DATABASE %I SET app.settings.supabase_url TO %L',
    current_database(),
    current_setting('SUPABASE_URL', true)
  );
  EXECUTE format('ALTER DATABASE %I SET app.settings.service_role_key TO %L',
    current_database(),
    current_setting('SUPABASE_SERVICE_ROLE_KEY', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not set database settings: %', SQLERRM;
END $$;
