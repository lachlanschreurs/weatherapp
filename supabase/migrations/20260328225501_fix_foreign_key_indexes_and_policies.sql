/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add indexes for all foreign key columns that are missing them:
      - `chat_messages.user_id`
      - `moisture_probes.user_id`
      - `moisture_readings.probe_id`
      - `probe_api_endpoints.user_id`
      - `profiles.default_location_id`
    
  2. Security Fixes
    - Fix multiple permissive policies on `user_roles` table
    - Combine the two SELECT policies into a single comprehensive policy
    
  3. Important Notes
    - Foreign key indexes improve join performance and prevent table scans
    - Single permissive policy is clearer and more maintainable than multiple overlapping policies
*/

-- Add missing foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id ON public.moisture_probes(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id ON public.moisture_readings(probe_id);
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id ON public.probe_api_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id ON public.profiles(default_location_id);

-- Fix multiple permissive policies on user_roles table
-- Drop the existing policies
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create a single comprehensive SELECT policy
CREATE POLICY "Users can view own roles, admins can view all"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR 
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
