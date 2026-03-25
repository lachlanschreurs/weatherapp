/*
  # Add Default Location to Profiles

  1. Changes
    - Add `default_location_id` column to `profiles` table
    - This allows users to set a preferred default location
    - References `saved_locations` table
  
  2. Security
    - No RLS changes needed as profiles table already has RLS enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'default_location_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN default_location_id uuid REFERENCES saved_locations(id) ON DELETE SET NULL;
  END IF;
END $$;