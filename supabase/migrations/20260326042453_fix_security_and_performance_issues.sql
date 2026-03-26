/*
  # Fix Security and Performance Issues

  This migration addresses several critical security and performance issues:

  ## 1. Performance Optimizations
  
  ### Added Indexes for Foreign Keys
  - `idx_moisture_probes_user_id` - Improves query performance for user's moisture probes
  - `idx_moisture_readings_probe_id` - Improves query performance for probe readings
  - `idx_probe_api_endpoints_user_id` - Improves query performance for user's API endpoints
  - `idx_saved_locations_user_id` - Improves query performance for user's saved locations

  ### Removed Unused Indexes
  - Dropped `idx_profiles_default_location_id` (not being used)
  - Dropped `idx_user_notifications_user_id` (not being used)
  - Dropped `idx_chat_messages_user_id` (not being used)
  - Dropped `idx_chat_messages_created_at` (not being used)

  ## 2. RLS Policy Optimizations

  ### Chat Messages Policies
  - Updated all chat_messages RLS policies to use `(select auth.uid())` instead of `auth.uid()`
  - This prevents re-evaluation of auth function for each row, significantly improving performance at scale

  ## 3. Security Improvements

  ### Function Search Path
  - Fixed `is_admin` function to have immutable search_path
  - Prevents potential security vulnerabilities from search_path manipulation

  ## Important Notes
  - Auth DB Connection Strategy and Leaked Password Protection are server-level configurations
  - These cannot be changed via SQL migrations and must be configured in Supabase Dashboard
  - All other security and performance issues are resolved in this migration
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- Index for moisture_probes.user_id
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id 
ON public.moisture_probes(user_id);

-- Index for moisture_readings.probe_id
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id 
ON public.moisture_readings(probe_id);

-- Index for probe_api_endpoints.user_id
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id 
ON public.probe_api_endpoints(user_id);

-- Index for saved_locations.user_id
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id 
ON public.saved_locations(user_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_profiles_default_location_id;
DROP INDEX IF EXISTS public.idx_user_notifications_user_id;
DROP INDEX IF EXISTS public.idx_chat_messages_user_id;
DROP INDEX IF EXISTS public.idx_chat_messages_created_at;

-- ============================================================================
-- 3. FIX RLS POLICIES - OPTIMIZE AUTH FUNCTION CALLS
-- ============================================================================

-- Drop and recreate chat_messages policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

-- Recreate policies with (select auth.uid()) for better performance
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Drop and recreate is_admin function with secure search_path
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
