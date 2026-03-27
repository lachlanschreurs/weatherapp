/*
  # Fix RLS Performance and Security Issues

  1. Performance Optimizations
    - Fix RLS policies on user_sessions to use (SELECT auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth functions for each row
    - Remove unused indexes to reduce storage and maintenance overhead

  2. Security Improvements
    - Set immutable search_path for security functions
    - Prevents search path hijacking attacks

  3. Changes Made
    - Drop 4 RLS policies on user_sessions table and recreate with optimized queries
    - Remove 7 unused indexes that are not being utilized
    - Update search_path for 3 security functions to be immutable
*/

-- Drop and recreate RLS policies with optimized auth function calls
DROP POLICY IF EXISTS "Users can read own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

CREATE POLICY "Users can read own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Remove unused indexes
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_profiles_default_location_id;
DROP INDEX IF EXISTS idx_saved_locations_user_id;
DROP INDEX IF EXISTS idx_user_sessions_user_id;

-- Fix function search paths to be immutable (with correct signatures)
ALTER FUNCTION public.deactivate_other_sessions() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_session_valid(text) SET search_path = public, pg_temp;
