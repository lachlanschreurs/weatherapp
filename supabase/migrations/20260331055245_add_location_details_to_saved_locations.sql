/*
  # Add Location Details to Saved Locations

  1. Purpose
    - Add country and state columns to saved_locations table
    - This allows email subscriptions to use detailed location information
    - Supports multiple favorite locations per user

  2. Changes
    - Add `country` column (text, not null, default 'AU')
    - Add `state` column (text, nullable)
    - Update existing records to have default country

  3. Security
    - No RLS changes needed - existing policies cover new columns
*/

-- Add country and state columns to saved_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_locations' AND column_name = 'country'
  ) THEN
    ALTER TABLE saved_locations ADD COLUMN country text NOT NULL DEFAULT 'AU';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_locations' AND column_name = 'state'
  ) THEN
    ALTER TABLE saved_locations ADD COLUMN state text;
  END IF;
END $$;
