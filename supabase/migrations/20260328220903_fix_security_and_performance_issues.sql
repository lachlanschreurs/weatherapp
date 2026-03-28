/*
  # Fix Security and Performance Issues

  1. RLS Performance Optimization
    - Fix `user_roles` table RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
  
  2. Remove Duplicate Policies
    - Drop duplicate policy "Users can view own role" (older version)
    - Keep "Users can view own roles" (newer version) and optimize it
  
  3. Remove Unused Indexes
    - Drop `idx_chat_messages_user_id` (unused)
    - Drop `idx_moisture_probes_user_id` (unused)
    - Drop `idx_moisture_readings_probe_id` (unused)
    - Drop `idx_probe_api_endpoints_user_id` (unused)
    - Drop `idx_profiles_default_location_id` (unused)
  
  4. Auth Configuration Notes
    - Auth DB Connection Strategy: Manual change required in Supabase Dashboard
      Navigate to: Project Settings > Database > Connection Pooling
      Change from fixed number (10) to percentage-based allocation
    
    - Leaked Password Protection: Manual change required in Supabase Dashboard
      Navigate to: Authentication > Policies
      Enable "Block leaked passwords" feature
*/

-- ============================================================================
-- 1. Fix RLS Performance Issues on user_roles table
-- ============================================================================

-- Drop existing policies that use auth.uid() directly
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;

-- Recreate policies with optimized auth function calls using (select auth.uid())
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- 2. Remove Unused Indexes
-- ============================================================================

-- Drop unused indexes to reduce storage and maintenance overhead
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_profiles_default_location_id;
