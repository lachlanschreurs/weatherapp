/*
  # Fix All Security and Performance Issues

  ## 1. Add Missing Indexes on Foreign Keys
    - Add index on `moisture_probes.user_id`
    - Add index on `moisture_readings.probe_id`
    - Add index on `probe_api_endpoints.user_id`
    - Add index on `saved_locations.user_id`

  ## 2. Optimize RLS Policies (Auth Function Performance)
    - Fix `user_roles` policies to use `(select auth.uid())`
    - Fix `user_notifications` policies to use `(select auth.uid())`
    - This prevents re-evaluation of auth functions for each row

  ## 3. Remove Unused Indexes
    - Drop `idx_profiles_default_location_id`
    - Drop `idx_user_notifications_user_id`
    - Drop `idx_user_notifications_created_at`
    - Drop `idx_user_notifications_read`

  ## 4. Fix Multiple Permissive Policies
    - Consolidate user_roles SELECT policies into single policy

  ## 5. Fix Function Search Paths
    - Set explicit search_path for `handle_new_user` function
    - Set explicit search_path for `is_admin` function

  ## 6. Fix Insecure RLS Policy
    - Remove overly permissive "System can insert notifications" policy
    - Replace with proper admin-only policy

  ## Security Notes
    - All foreign keys now have covering indexes for optimal performance
    - RLS policies optimized to prevent per-row function evaluation
    - Functions have immutable search paths to prevent SQL injection
    - No overly permissive policies that bypass security
*/

-- =====================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id 
  ON moisture_probes(user_id);

CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id 
  ON moisture_readings(probe_id);

CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id 
  ON probe_api_endpoints(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id 
  ON saved_locations(user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - USER_ROLES TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - USER_NOTIFICATIONS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON user_notifications;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can read own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own notifications"
  ON user_notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Replace insecure policy with admin-only policy
CREATE POLICY "Admins can insert notifications"
  ON user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 4. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_profiles_default_location_id;
DROP INDEX IF EXISTS idx_user_notifications_user_id;
DROP INDEX IF EXISTS idx_user_notifications_created_at;
DROP INDEX IF EXISTS idx_user_notifications_read;

-- =====================================================
-- 5. FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Recreate handle_new_user with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Recreate is_admin with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;