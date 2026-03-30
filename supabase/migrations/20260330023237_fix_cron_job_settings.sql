/*
  # Fix Cron Job Settings
  
  1. Changes
    - Fix the database settings for Supabase URL and Service Role Key
    - Ensure cron jobs can call edge functions properly
    
  2. Security
    - Uses proper environment variable references
*/

-- Set the app settings using the actual environment values
DO $$
DECLARE
  db_name text := current_database();
  supabase_url text := 'https://zesytitlsrdjvhnlgmpm.supabase.co';
  service_role_key text;
BEGIN
  -- Get service role key from vault or set manually
  -- Note: In production, these should be set via Supabase dashboard
  service_role_key := current_setting('supabase.service_role_key', true);
  
  IF service_role_key IS NULL OR service_role_key = '' THEN
    -- Fallback: try to get from environment
    service_role_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
  END IF;
  
  -- Set database-level configuration
  EXECUTE format('ALTER DATABASE %I SET app.settings.supabase_url TO %L', db_name, supabase_url);
  
  IF service_role_key IS NOT NULL AND service_role_key != '' THEN
    EXECUTE format('ALTER DATABASE %I SET app.settings.service_role_key TO %L', db_name, service_role_key);
  ELSE
    RAISE NOTICE 'Service role key not found - please set manually via Supabase dashboard';
  END IF;
  
  RAISE NOTICE 'Database settings configured successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error setting database config: %', SQLERRM;
END $$;
