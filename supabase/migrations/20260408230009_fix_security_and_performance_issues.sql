/*
  # Fix Security and Performance Issues

  1. Missing foreign key indexes
    - Add index on chat_messages.user_id
    - Add index on notifications.user_id
    - Add index on probe_apis.user_id
    - Add index on probe_csv_imports.user_id
    - Add index on probe_data.probe_api_id
    - Add index on probe_data.user_id
    - Add index on probe_import_mappings.user_id

  2. RLS policy performance fixes for historical_weather_data
    - Replace auth.uid() with (select auth.uid()) in all policies to avoid per-row re-evaluation

  3. Remove unused indexes on historical_weather_data

  4. Add RLS policy for app_config table (currently has RLS enabled but no policies)
    - Allow service role / admin read access only (no user-level access needed)
*/

-- 1. Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_apis_user_id ON public.probe_apis(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_csv_imports_user_id ON public.probe_csv_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_data_probe_api_id ON public.probe_data(probe_api_id);
CREATE INDEX IF NOT EXISTS idx_probe_data_user_id ON public.probe_data(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_import_mappings_user_id ON public.probe_import_mappings(user_id);

-- 2. Fix RLS policies on historical_weather_data to use (select auth.uid()) for performance
DROP POLICY IF EXISTS "Users can view own historical weather data" ON public.historical_weather_data;
DROP POLICY IF EXISTS "Users can insert own historical weather data" ON public.historical_weather_data;
DROP POLICY IF EXISTS "Users can update own historical weather data" ON public.historical_weather_data;
DROP POLICY IF EXISTS "Users can delete own historical weather data" ON public.historical_weather_data;

CREATE POLICY "Users can view own historical weather data"
  ON public.historical_weather_data FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own historical weather data"
  ON public.historical_weather_data FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own historical weather data"
  ON public.historical_weather_data FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own historical weather data"
  ON public.historical_weather_data FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 3. Remove unused indexes on historical_weather_data
DROP INDEX IF EXISTS idx_historical_weather_user_id;
DROP INDEX IF EXISTS idx_historical_weather_location_id;
DROP INDEX IF EXISTS idx_historical_weather_date;
DROP INDEX IF EXISTS idx_historical_weather_location_year_month;

-- 4. Add policy for app_config table (read-only for authenticated admins, no user-level access)
-- app_config holds system-level settings, so only authenticated users with admin role can read
CREATE POLICY "Admins can read app config"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );
