/*
  # Add RLS Policies for Phone Number Access

  1. Security Changes
    - Add policy to allow users to view their own phone number
    - Add policy to allow users to update their own phone number
    - Prevent users from seeing other users' phone numbers
  
  2. Notes
    - Phone numbers are sensitive PII and must be protected
    - Only the user who owns the profile can see/update their phone number
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own phone number" ON profiles;
DROP POLICY IF EXISTS "Users can update own phone number" ON profiles;

-- Allow users to view their own phone number
CREATE POLICY "Users can view own phone number"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own phone number
CREATE POLICY "Users can update own phone number"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to check if phone number is already used during signup
CREATE OR REPLACE FUNCTION check_phone_number_available(phone text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  phone_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE phone_number = phone
  ) INTO phone_exists;
  
  RETURN NOT phone_exists;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_phone_number_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_phone_number_available(text) TO anon;
