/*
  # Fix Profiles Service Role Update Permission

  1. Changes
    - Add service_role UPDATE policy for profiles table
    - Allows triggers to update profile fields during signup process

  2. Security
    - Policy restricted to service_role only
    - Needed for email subscription trigger to set email_subscription_started_at
*/

-- Add service_role UPDATE policy for profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Service role can update profiles'
  ) THEN
    CREATE POLICY "Service role can update profiles"
      ON profiles
      FOR UPDATE
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
