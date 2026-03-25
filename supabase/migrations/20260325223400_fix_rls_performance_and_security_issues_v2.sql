/*
  # Fix RLS Performance and Security Issues

  This migration addresses critical security and performance issues identified in the database:

  ## 1. RLS Performance Optimization
  - Updates all RLS policies to use `(SELECT auth.uid())` instead of `auth.uid()`
  - Prevents re-evaluation of auth functions for each row, improving query performance at scale
  - Affects policies on:
    - `profiles` table (read, update, create policies)
    - `saved_locations` table (read, insert, update, delete policies)

  ## 2. Function Security Hardening
  - Adds `SECURITY DEFINER` and explicit `search_path` to all functions
  - Prevents SQL injection via search_path manipulation
  - Affects functions:
    - `handle_new_user()`
    - `handle_updated_at()`

  ## 3. Index Cleanup
  - Removes unused index `idx_saved_locations_user_id` (redundant with foreign key index)

  ## Security Notes
  - All changes maintain existing access control rules
  - Performance improvements have no functional impact on application behavior
  - Search path hardening prevents privilege escalation attacks
*/

-- =====================================================
-- 1. DROP AND RECREATE RLS POLICIES WITH PERFORMANCE OPTIMIZATION
-- =====================================================

-- PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- SAVED_LOCATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can read own saved locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can insert own saved locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can update own saved locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can delete own saved locations" ON public.saved_locations;

CREATE POLICY "Users can read own saved locations"
  ON public.saved_locations
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own saved locations"
  ON public.saved_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own saved locations"
  ON public.saved_locations
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own saved locations"
  ON public.saved_locations
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- 2. HARDEN FUNCTION SECURITY WITH EXPLICIT SEARCH_PATH
-- =====================================================

-- Recreate handle_new_user function with security hardening
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate handle_updated_at function with security hardening
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

-- Drop unused index on saved_locations.user_id 
-- The foreign key constraint already creates an index, making this redundant
DROP INDEX IF EXISTS public.idx_saved_locations_user_id;
