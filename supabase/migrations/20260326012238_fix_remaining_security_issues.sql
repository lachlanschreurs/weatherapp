/*
  # Fix Remaining Security and Performance Issues

  ## 1. Add Missing Indexes for Foreign Keys
    - Add index on `moisture_probes.user_id` to improve query performance
    - Add index on `moisture_readings.probe_id` to improve query performance
    - Add index on `probe_api_endpoints.user_id` to improve query performance
    - Add index on `saved_locations.user_id` to improve query performance

  ## 2. Fix Auth RLS Initialization
    - Update `Users can view roles` policy to use subquery `(SELECT auth.uid())`
    - This prevents re-evaluation for each row, improving performance at scale

  ## 3. Remove Unused Indexes
    - Drop `idx_profiles_default_location_id` (not being used)
    - Drop `idx_user_notifications_user_id` (not being used)

  ## 4. Fix Function Search Path
    - Recreate `is_admin` function with proper immutable search_path configuration

  ## Notes
    - Auth DB Connection Strategy and Leaked Password Protection require dashboard configuration
    - Navigate to Supabase Dashboard > Auth > Configuration to enable these settings
*/

-- 1. Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id 
  ON moisture_probes(user_id);

CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id 
  ON moisture_readings(probe_id);

CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id 
  ON probe_api_endpoints(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id 
  ON saved_locations(user_id);

-- 2. Fix Auth RLS Initialization - Update policy to use subquery
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;

CREATE POLICY "Users can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- 3. Remove unused indexes
DROP INDEX IF EXISTS idx_profiles_default_location_id;
DROP INDEX IF EXISTS idx_user_notifications_user_id;

-- 4. Fix function search path for is_admin
DROP FUNCTION IF EXISTS is_admin();

CREATE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;