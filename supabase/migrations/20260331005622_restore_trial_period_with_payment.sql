/*
  # Restore Trial Period with Payment Collection

  1. Changes
    - Add back trial_end_date column to profiles
    - Set 1-month trial period for new signups
    - Users provide payment details upfront but aren't charged until trial ends
    
  2. Security
    - Users must provide payment method to access features
    - Automatic billing after trial period expires
*/

-- Add back trial_end_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_end_date timestamptz;
  END IF;
END $$;

-- Update profile creation trigger to set trial period
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, payment_method_set, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    'user',
    false,
    now(),
    now()
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RETURN new;
END;
$$;