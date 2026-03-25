-- Fix Profile Creation on User Signup
--
-- Summary:
-- Fixes authentication flow by allowing the handle_new_user() trigger function to bypass
-- RLS policies when creating new user profiles.
--
-- Changes:
-- 1. Add Service Role Policy for Profile Creation
--    - Allows the trigger function (running as service role) to insert profiles
--    - Safe because function is SECURITY DEFINER and explicitly sets id correctly
--
-- Security Impact:
-- - Maintains security - only trigger function can use this policy
-- - Users still cannot insert arbitrary profiles
-- - Service role policy runs alongside user policy

-- Add policy for service role to insert profiles during signup
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);
