/*
  # Fix RLS Performance and Security Issues

  1. Performance Improvements
    - Fix all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
    - Applies to all tables: profiles, probe_connections, probe_csv_imports, probe_import_mappings, probe_readings_latest

  2. Index Cleanup
    - Remove unused indexes that are not being utilized
    - Keeps the database lean and reduces maintenance overhead

  3. Security Fixes
    - Fix function search_path for `update_probe_connection_timestamp`
    - Set immutable search_path to prevent security vulnerabilities
*/

-- Fix RLS policies on profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Fix RLS policies on probe_connections table
DROP POLICY IF EXISTS "Users can view own probe connections" ON public.probe_connections;
CREATE POLICY "Users can view own probe connections"
  ON public.probe_connections
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own probe connections" ON public.probe_connections;
CREATE POLICY "Users can insert own probe connections"
  ON public.probe_connections
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own probe connections" ON public.probe_connections;
CREATE POLICY "Users can update own probe connections"
  ON public.probe_connections
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own probe connections" ON public.probe_connections;
CREATE POLICY "Users can delete own probe connections"
  ON public.probe_connections
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix RLS policies on probe_csv_imports table
DROP POLICY IF EXISTS "Users can view own CSV imports" ON public.probe_csv_imports;
CREATE POLICY "Users can view own CSV imports"
  ON public.probe_csv_imports
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own CSV imports" ON public.probe_csv_imports;
CREATE POLICY "Users can insert own CSV imports"
  ON public.probe_csv_imports
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own CSV imports" ON public.probe_csv_imports;
CREATE POLICY "Users can update own CSV imports"
  ON public.probe_csv_imports
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own CSV imports" ON public.probe_csv_imports;
CREATE POLICY "Users can delete own CSV imports"
  ON public.probe_csv_imports
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix RLS policies on probe_import_mappings table
DROP POLICY IF EXISTS "Users can view own import mappings" ON public.probe_import_mappings;
CREATE POLICY "Users can view own import mappings"
  ON public.probe_import_mappings
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own import mappings" ON public.probe_import_mappings;
CREATE POLICY "Users can insert own import mappings"
  ON public.probe_import_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own import mappings" ON public.probe_import_mappings;
CREATE POLICY "Users can update own import mappings"
  ON public.probe_import_mappings
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own import mappings" ON public.probe_import_mappings;
CREATE POLICY "Users can delete own import mappings"
  ON public.probe_import_mappings
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix RLS policies on probe_readings_latest table
DROP POLICY IF EXISTS "Users can view own probe readings" ON public.probe_readings_latest;
CREATE POLICY "Users can view own probe readings"
  ON public.probe_readings_latest
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Remove unused indexes
DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;
DROP INDEX IF EXISTS idx_profiles_stripe_subscription_id;
DROP INDEX IF EXISTS idx_probe_apis_user_id;
DROP INDEX IF EXISTS idx_probe_data_probe_api_id;
DROP INDEX IF EXISTS idx_probe_data_user_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_probe_import_mappings_user_id;
DROP INDEX IF EXISTS idx_probe_import_mappings_provider;
DROP INDEX IF EXISTS idx_probe_csv_imports_user_id;
DROP INDEX IF EXISTS idx_probe_csv_imports_status;

-- Fix function search_path security issue
-- Drop the trigger first, then the function, then recreate both
DROP TRIGGER IF EXISTS probe_connections_updated_at ON public.probe_connections;
DROP FUNCTION IF EXISTS public.update_probe_connection_timestamp();

CREATE OR REPLACE FUNCTION public.update_probe_connection_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER probe_connections_updated_at
  BEFORE UPDATE ON public.probe_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_probe_connection_timestamp();