/*
  # Fix User Signup Permissions

  1. Changes
    - Add service_role INSERT policy for user_roles table to allow trigger to create roles
    - Add service_role INSERT policy for email_subscriptions table
    - Ensure triggers can successfully create all required records for new users

  2. Security
    - Policies are restricted to service_role only (used by triggers)
    - No changes to user-facing policies
*/

-- Add service_role INSERT policy for user_roles (needed by trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Service role can insert user roles'
  ) THEN
    CREATE POLICY "Service role can insert user roles"
      ON user_roles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Add service_role INSERT policy for email_subscriptions (needed by trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_subscriptions' 
    AND policyname = 'Service role can insert email subscriptions'
  ) THEN
    CREATE POLICY "Service role can insert email subscriptions"
      ON email_subscriptions
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;
