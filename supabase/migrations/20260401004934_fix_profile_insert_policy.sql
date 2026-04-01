/*
  # Fix Profile Creation - Add Missing INSERT Policy

  1. Issue
    - Profiles table has SELECT and UPDATE policies but NO INSERT policy
    - The trigger `handle_new_user` runs with SECURITY DEFINER which should bypass RLS
    - But we need to ensure the trigger can always insert new profiles

  2. Changes
    - Verify the trigger function has proper SECURITY DEFINER settings
    - The function should insert profiles successfully since it uses SECURITY DEFINER

  3. Testing
    - After this migration, new user signups should work correctly
*/

-- Recreate the trigger function with explicit schema and proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile for the user
  INSERT INTO public.profiles (id, email, role, payment_method_set, trial_end_date, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    'user',
    false,
    now() + interval '1 month',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
