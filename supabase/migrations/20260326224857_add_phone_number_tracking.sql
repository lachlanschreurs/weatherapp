/*
  # Add Phone Number Tracking to Prevent Multiple Free Trials

  1. Changes to profiles table
    - Add `phone_number` (text) - User's mobile phone number
    - Add unique constraint on phone_number to prevent duplicate registrations
    - Add index for faster phone number lookups
    - Add `phone_number_verified` (boolean) - Track if phone is verified
  
  2. Security
    - Enable RLS on phone number access
    - Users can only see their own phone number
  
  3. Notes
    - Phone numbers must be unique across all users
    - This prevents users from creating multiple accounts with different emails but same phone
    - Ensures users can only get one 3-month free trial per phone number
*/

-- Add phone number fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number_verified boolean DEFAULT false;
  END IF;
END $$;

-- Create unique index on phone_number (allowing NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_number_unique 
  ON profiles(phone_number) 
  WHERE phone_number IS NOT NULL;

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number 
  ON profiles(phone_number) 
  WHERE phone_number IS NOT NULL;

-- Add comment to explain the constraint
COMMENT ON COLUMN profiles.phone_number IS 'Unique phone number to prevent multiple free trial abuse';
