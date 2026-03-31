/*
  # Add payment_method_set Column to Profiles

  1. Changes
    - Add `payment_method_set` boolean column to `profiles` table
    - Default to `false` for new users
    - Track whether user has completed payment method setup
  
  2. Security
    - No RLS changes needed (column inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_method_set'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_method_set boolean DEFAULT false;
  END IF;
END $$;
