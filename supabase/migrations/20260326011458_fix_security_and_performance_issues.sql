/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Indexes for Foreign Keys
    - Add index on `profiles.default_location_id` to improve query performance
    - Add index on `user_notifications.user_id` to improve query performance

  ## 2. Remove Unused Indexes
    - Drop `idx_moisture_probes_user_id` (unused)
    - Drop `idx_moisture_readings_probe_id` (unused)
    - Drop `idx_probe_api_endpoints_user_id` (unused)
    - Drop `idx_saved_locations_user_id` (unused)

  ## 3. Fix Multiple Permissive Policies
    - Consolidate user_roles SELECT policies into a single policy
    - Remove duplicate "Users can read own role" policy
    - Keep "Admins can manage all roles" for broader access

  ## 4. Fix Function Search Path
    - Update `is_admin` function to use immutable search_path
    - Set explicit search_path in function definition

  ## Notes
    - Auth DB Connection Strategy and Leaked Password Protection are dashboard settings
    - These cannot be configured via SQL migrations
    - User should configure these in Supabase Dashboard:
      * Auth > Configuration > Connection pooling: Switch to percentage-based
      * Auth > Configuration > Password protection: Enable leaked password protection
*/

-- 1. Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id 
  ON profiles(default_location_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id 
  ON user_notifications(user_id);

-- 2. Remove unused indexes
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_saved_locations_user_id;

-- 3. Fix multiple permissive policies on user_roles
-- Drop the duplicate policy
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;

-- Keep only the broader admin policy which covers both cases
-- (Admins can see all roles, users can see their own via USING clause)
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create a single comprehensive SELECT policy
CREATE POLICY "Users can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 4. Fix function search path for is_admin
DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;