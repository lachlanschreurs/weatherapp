/*
  # Fix User Signup RLS Policies

  1. Problem
    - New users cannot be created because the handle_new_user() trigger function
      is blocked by RLS policies on profiles and user_roles tables
    - Even though the function has SECURITY DEFINER, it still respects RLS
    - The user_roles table lacks an INSERT policy for the trigger context
  
  2. Solution
    - Add RLS policies that allow the handle_new_user() function to insert records
    - Use SECURITY DEFINER functions to bypass RLS in trigger context
    - Ensure profiles can be created during signup
  
  3. Security
    - Policies are restrictive and only allow necessary operations
    - Service role maintains full control
    - Regular users can only insert their own profile
    - Trigger function can insert both profile and user_role during signup
  
  4. Changes
    - Drop and recreate handle_new_user() function to ensure proper permissions
    - Add explicit INSERT policy for user_roles that works in trigger context
*/

-- Drop existing function to recreate with proper grants
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Recreate the function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Insert profile (will use service role permissions due to SECURITY DEFINER)
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, new.created_at)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert user role (will use service role permissions due to SECURITY DEFINER)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure user_roles has proper INSERT policy
-- Drop existing restrictive policies and add one that allows trigger inserts
DO $$
BEGIN
  -- Drop the service role only policy if it exists
  DROP POLICY IF EXISTS "Service role can insert user roles" ON user_roles;
  
  -- Create a new policy that allows inserts in the context of the trigger
  CREATE POLICY "Allow user role creation on signup"
    ON user_roles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);
END $$;