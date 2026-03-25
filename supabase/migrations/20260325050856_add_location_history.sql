/*
  # Add Location Search History

  1. Changes
    - Add `last_accessed_at` column to `saved_locations` table to track when locations were last viewed
    - This enables showing search history ordered by most recent access

  2. Updates
    - Add timestamp tracking for location access history
    - Add index on last_accessed_at for efficient history queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_locations' AND column_name = 'last_accessed_at'
  ) THEN
    ALTER TABLE saved_locations ADD COLUMN last_accessed_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_locations_last_accessed ON saved_locations(user_id, last_accessed_at DESC);
