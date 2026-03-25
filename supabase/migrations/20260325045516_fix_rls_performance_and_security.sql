/*
  # Fix RLS Performance and Function Security Issues

  ## Changes Made

  1. **RLS Policy Performance Optimization**
     - Replace all `auth.uid()` calls with `(select auth.uid())` in RLS policies
     - This prevents re-evaluation for each row, significantly improving query performance at scale
     - Affects policies on: profiles, saved_locations, favorite_locations tables

  2. **Function Security Hardening**
     - Add `SET search_path = ''` to all functions to prevent search_path injection attacks
     - Affects: handle_new_user(), handle_updated_at() functions

  3. **Tables Modified**
     - `profiles`: 3 policies optimized (read, update, create)
     - `saved_locations`: 4 policies optimized (read, insert, update, delete)
     - `favorite_locations`: 4 policies optimized (read, insert, update, delete)

  ## Security Impact
     - **Performance**: Queries will execute faster as auth.uid() is evaluated once per query instead of per row
     - **Security**: Functions are now protected against search_path manipulation attacks
*/

-- Drop and recreate all RLS policies with optimized auth.uid() calls

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- SAVED_LOCATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own saved locations" ON saved_locations;
CREATE POLICY "Users can read own saved locations"
  ON saved_locations
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own saved locations" ON saved_locations;
CREATE POLICY "Users can insert own saved locations"
  ON saved_locations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own saved locations" ON saved_locations;
CREATE POLICY "Users can update own saved locations"
  ON saved_locations
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own saved locations" ON saved_locations;
CREATE POLICY "Users can delete own saved locations"
  ON saved_locations
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- FAVORITE_LOCATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own favorites" ON favorite_locations;
CREATE POLICY "Users can view own favorites"
  ON favorite_locations
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorite_locations;
CREATE POLICY "Users can insert own favorites"
  ON favorite_locations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own favorites" ON favorite_locations;
CREATE POLICY "Users can update own favorites"
  ON favorite_locations
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorite_locations;
CREATE POLICY "Users can delete own favorites"
  ON favorite_locations
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- FUNCTION SECURITY HARDENING
-- ============================================================================

-- Recreate handle_new_user with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_started_at, trial_ends_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now() + interval '14 days'
  );
  RETURN new;
END;
$$;

-- Recreate handle_updated_at with secure search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
