/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys for optimal query performance
      - `profiles.default_location_id` (foreign key to saved_locations)
      - `user_notifications.user_id` (foreign key to auth.users)
    
  2. Cleanup
    - Remove unused indexes that are not being utilized:
      - `idx_moisture_probes_user_id`
      - `idx_moisture_readings_probe_id`
      - `idx_probe_api_endpoints_user_id`
      - `idx_saved_locations_user_id`
  
  3. Security Fixes
    - Fix function search_path for `is_admin` function to prevent security vulnerabilities
    - Set immutable search_path to prevent role-based attacks

  4. Notes
    - Auth DB connection strategy and leaked password protection are project-level settings
      that must be configured in the Supabase Dashboard, not via SQL migrations
    - Auth connection strategy: Change to percentage-based allocation in Dashboard > Settings > Database
    - Leaked password protection: Enable in Dashboard > Authentication > Providers > Email
*/

-- Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id 
  ON public.profiles(default_location_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id 
  ON public.user_notifications(user_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_moisture_probes_user_id;
DROP INDEX IF EXISTS public.idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS public.idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS public.idx_saved_locations_user_id;

-- Fix is_admin function with immutable search_path
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;