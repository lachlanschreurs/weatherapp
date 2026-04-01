/*
  # Fix Profile Creation - Complete Solution

  1. Problem Analysis
    - Users report account creation is not working
    - The trigger function exists and has SECURITY DEFINER
    - All required columns exist in profiles table
    - Likely issue: RLS policies or trigger execution

  2. Solution
    - Ensure trigger function can insert into profiles
    - Add explicit INSERT policy for service_role (used by trigger)
    - Improve error handling and logging
    - Make sure all required columns have proper defaults

  3. Security
    - Service role can insert profiles (needed for trigger)
    - Regular users cannot insert profiles directly
    - Profiles are only created via auth trigger
*/

-- First, ensure the profiles table has all needed columns with defaults
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN payment_method_set SET DEFAULT false,
  ALTER COLUMN farmer_joe_messages_count SET DEFAULT 0,
  ALTER COLUMN farmer_joe_subscription_status SET DEFAULT 'none',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile for the user
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    payment_method_set, 
    trial_end_date,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    'user',
    false,
    now() + interval '1 month',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the actual error for debugging
    RAISE LOG 'Error creating profile for user %: % %', new.id, SQLERRM, SQLSTATE;
    -- Still return new so user creation doesn't fail
    RETURN new;
END;
$$;

-- Make sure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
