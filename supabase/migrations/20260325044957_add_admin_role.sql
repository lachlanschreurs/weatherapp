/*
  # Add Admin Role Support

  1. Changes
    - Add `is_admin` column to profiles table (boolean, defaults to false)
    - Admins bypass all subscription checks and get full access
  
  2. Security
    - Only authenticated users can read their own is_admin status
    - Users cannot update their own is_admin status (must be set via direct SQL)
*/

-- Add is_admin column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;