/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses critical security and performance issues identified in the database audit.

  ## Changes Made

  ### 1. RLS Policy Performance Optimization
  All RLS policies are updated to use `(SELECT auth.uid())` instead of `auth.uid()` directly.
  This prevents re-evaluation of the auth function for each row, significantly improving query performance at scale.

  Tables affected:
  - `moisture_probes` - 4 policies updated (SELECT, INSERT, UPDATE, DELETE)
  - `moisture_readings` - 1 policy updated (SELECT)
  - `probe_api_endpoints` - 4 policies updated (SELECT, INSERT, UPDATE, DELETE)

  ### 2. Foreign Key Index Addition
  Added missing index on `profiles.default_location_id` foreign key to improve query performance.

  ### 3. Unused Index Cleanup
  Removed unused indexes that are not being utilized by queries:
  - `idx_saved_locations_last_accessed`
  - `idx_moisture_probes_user_id`
  - `idx_moisture_probes_active`
  - `idx_moisture_readings_probe_id`
  - `idx_moisture_readings_timestamp`
  - `idx_probe_api_endpoints_user_id`
  - `idx_probe_api_endpoints_active`
  - `idx_probe_api_endpoints_last_poll`

  ### 4. Function Search Path Security
  Updated trigger functions to have immutable search paths to prevent security vulnerabilities:
  - `update_moisture_probe_updated_at`
  - `update_probe_api_endpoint_updated_at`

  ### 5. RLS Policy Security Fix
  Removed the overly permissive `Service role can insert readings` policy that had `WITH CHECK (true)`.
  This policy bypassed RLS and allowed any authenticated user to insert readings into any probe.
  Service role operations should use the service role key which bypasses RLS automatically.

  ## Security Notes
  - All auth.uid() calls are now wrapped in SELECT for performance
  - Foreign keys are properly indexed
  - Overly permissive policies have been removed
  - Function search paths are now secure and immutable
*/

-- =====================================================
-- 1. DROP AND RECREATE RLS POLICIES WITH OPTIMIZED AUTH CHECKS
-- =====================================================

-- Drop existing policies for moisture_probes
DROP POLICY IF EXISTS "Users can view own probes" ON moisture_probes;
DROP POLICY IF EXISTS "Users can insert own probes" ON moisture_probes;
DROP POLICY IF EXISTS "Users can update own probes" ON moisture_probes;
DROP POLICY IF EXISTS "Users can delete own probes" ON moisture_probes;

-- Recreate moisture_probes policies with optimized auth checks
CREATE POLICY "Users can view own probes"
  ON moisture_probes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own probes"
  ON moisture_probes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own probes"
  ON moisture_probes FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own probes"
  ON moisture_probes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Drop existing policies for moisture_readings
DROP POLICY IF EXISTS "Users can view readings from own probes" ON moisture_readings;
DROP POLICY IF EXISTS "Service role can insert readings" ON moisture_readings;

-- Recreate moisture_readings policies with optimized auth checks
CREATE POLICY "Users can view readings from own probes"
  ON moisture_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM moisture_probes
      WHERE moisture_probes.id = moisture_readings.probe_id
      AND moisture_probes.user_id = (SELECT auth.uid())
    )
  );

-- Note: Service role operations bypass RLS automatically when using the service role key
-- No need for a separate policy with WITH CHECK (true)

-- Drop existing policies for probe_api_endpoints
DROP POLICY IF EXISTS "Users can view own endpoints" ON probe_api_endpoints;
DROP POLICY IF EXISTS "Users can insert own endpoints" ON probe_api_endpoints;
DROP POLICY IF EXISTS "Users can update own endpoints" ON probe_api_endpoints;
DROP POLICY IF EXISTS "Users can delete own endpoints" ON probe_api_endpoints;

-- Recreate probe_api_endpoints policies with optimized auth checks
CREATE POLICY "Users can view own endpoints"
  ON probe_api_endpoints FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own endpoints"
  ON probe_api_endpoints FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own endpoints"
  ON probe_api_endpoints FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own endpoints"
  ON probe_api_endpoints FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 2. ADD MISSING FOREIGN KEY INDEX
-- =====================================================

-- Add index for profiles.default_location_id foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id 
  ON profiles(default_location_id) 
  WHERE default_location_id IS NOT NULL;

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_saved_locations_last_accessed;
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_probes_active;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_moisture_readings_timestamp;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_active;
DROP INDEX IF EXISTS idx_probe_api_endpoints_last_poll;

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATH SECURITY
-- =====================================================

-- Recreate update_moisture_probe_updated_at with secure search path
CREATE OR REPLACE FUNCTION update_moisture_probe_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate update_probe_api_endpoint_updated_at with secure search path
CREATE OR REPLACE FUNCTION update_probe_api_endpoint_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;