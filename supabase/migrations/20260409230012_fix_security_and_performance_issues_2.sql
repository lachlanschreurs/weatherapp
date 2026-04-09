/*
  # Fix Security and Performance Issues

  1. Changes
    - Add covering index on historical_weather_data.user_id (unindexed foreign key)
    - Fix field_notes RLS policies to use (select auth.uid()) for better performance
    - Drop unused indexes that are not being used by queries

  2. Security
    - RLS policies on field_notes updated to use subselect pattern for auth functions
    - This prevents re-evaluation of auth functions for each row
*/

-- Add missing index on historical_weather_data.user_id
CREATE INDEX IF NOT EXISTS idx_historical_weather_data_user_id
  ON public.historical_weather_data (user_id);

-- Fix field_notes RLS policies to use subselect pattern
DROP POLICY IF EXISTS "Users can view own field notes" ON public.field_notes;
DROP POLICY IF EXISTS "Users can insert own field notes" ON public.field_notes;
DROP POLICY IF EXISTS "Users can update own field notes" ON public.field_notes;
DROP POLICY IF EXISTS "Users can delete own field notes" ON public.field_notes;

CREATE POLICY "Users can view own field notes"
  ON public.field_notes FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own field notes"
  ON public.field_notes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own field notes"
  ON public.field_notes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own field notes"
  ON public.field_notes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_probe_data_probe_api_id;
DROP INDEX IF EXISTS public.idx_chat_messages_user_id;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_probe_apis_user_id;
DROP INDEX IF EXISTS public.idx_probe_csv_imports_user_id;
DROP INDEX IF EXISTS public.idx_probe_data_user_id;
DROP INDEX IF EXISTS public.idx_probe_import_mappings_user_id;
DROP INDEX IF EXISTS public.idx_field_notes_user_id;
DROP INDEX IF EXISTS public.idx_field_notes_created_at;
