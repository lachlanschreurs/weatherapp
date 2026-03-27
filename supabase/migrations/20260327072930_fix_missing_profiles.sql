/*
  # Fix Missing Profile Records
  
  1. Changes
    - Ensure all existing auth.users have corresponding profile records
    - Backfill any missing profiles from auth.users table
    - Add user_roles for users who don't have them
  
  2. Security
    - No changes to RLS policies (already correct)
*/

-- Insert missing profiles for existing auth users
INSERT INTO public.profiles (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Insert missing user_roles for existing users (avoiding duplicates)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'user'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = au.id AND ur.role = 'user'
);
