/*
  # Add Favorite Locations Feature

  ## Changes Made

  1. **Table Modifications**
     - Add `is_favorite` boolean column to `saved_locations` table
     - Default value is false
     - Only one location can be favorite per user (enforced by unique constraint)

  2. **Indexes**
     - Add index on `is_favorite` for faster favorite location queries

  3. **Security**
     - No RLS changes needed - existing policies cover this

  ## Usage
  
  Users can mark one location as favorite, which will be automatically
  loaded when they sign in. Non-authenticated users will use geolocation instead.
*/

-- Add is_favorite column to saved_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_locations' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE public.saved_locations 
    ADD COLUMN is_favorite boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create unique partial index to ensure only one favorite per user
DROP INDEX IF EXISTS idx_saved_locations_user_favorite;
CREATE UNIQUE INDEX idx_saved_locations_user_favorite 
ON public.saved_locations(user_id) 
WHERE is_favorite = true;

-- Create index for querying favorite locations
CREATE INDEX IF NOT EXISTS idx_saved_locations_is_favorite 
ON public.saved_locations(is_favorite) 
WHERE is_favorite = true;