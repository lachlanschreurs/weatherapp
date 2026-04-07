/*
  # Add Postcode Support to Saved Locations

  1. Purpose
    - Add postcode column to saved_locations table
    - Allows for better location accuracy when multiple locations share the same name
    - Supports searching by postcode in addition to city names

  2. Changes
    - Add `postcode` column (text, nullable)
    - Existing records will have null postcodes

  3. Security
    - No RLS changes needed - existing policies cover new columns
*/

-- Add postcode column to saved_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_locations' AND column_name = 'postcode'
  ) THEN
    ALTER TABLE saved_locations ADD COLUMN postcode text;
  END IF;
END $$;