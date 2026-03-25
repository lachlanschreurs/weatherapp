/*
  # Fix RLS Performance and Function Security Issues

  ## Changes Made

  1. RLS Performance Optimization
     - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
     - This prevents re-evaluation of auth functions for each row, improving query performance at scale
     - Affects policies on: profiles, saved_locations tables

  2. Function Security Fixes
     - Set explicit search_path for all functions to prevent search path injection attacks
     - Affects: handle_new_user, handle_updated_at

  3. Index Optimization
     - Remove unused indexes that are not being utilized
     - Keeps: idx_saved_locations_user_id (will be used with optimized policies)
     - Removes: idx_saved_locations_is_primary (not used)

  ## Security Impact
     - Improved query performance for RLS policies
     - Protection against search path injection attacks
     - Reduced overhead from unused indexes
*/

-- Drop existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Recreate profiles policies with optimized auth function calls
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- Drop existing RLS policies on saved_locations table
DROP POLICY IF EXISTS "Users can read own saved locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can insert own saved locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can update own saved locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can delete own saved locations" ON saved_locations;

-- Recreate saved_locations policies with optimized auth function calls
CREATE POLICY "Users can read own saved locations"
  ON saved_locations
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own saved locations"
  ON saved_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own saved locations"
  ON saved_locations
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own saved locations"
  ON saved_locations
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix function security - set explicit search_path to prevent injection attacks
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Remove unused index
DROP INDEX IF EXISTS idx_saved_locations_is_primary;

-- Ensure the user_id index exists and is properly configured
-- (keeping idx_saved_locations_user_id as it's needed for the optimized RLS policies)