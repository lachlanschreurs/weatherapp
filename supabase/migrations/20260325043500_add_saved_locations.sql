/*
  # Add Saved Locations Table

  1. New Tables
    - `saved_locations`
      - `id` (uuid, primary key) - Unique identifier for the saved location
      - `user_id` (uuid, foreign key) - References the user who saved this location
      - `name` (text) - User-friendly name for the location (e.g., "North Field", "Main Farm")
      - `latitude` (numeric) - Latitude coordinate
      - `longitude` (numeric) - Longitude coordinate
      - `is_primary` (boolean) - Whether this is the user's primary location
      - `created_at` (timestamptz) - When the location was saved

  2. Security
    - Enable RLS on `saved_locations` table
    - Add policy for authenticated users to read their own saved locations
    - Add policy for authenticated users to insert their own saved locations
    - Add policy for authenticated users to update their own saved locations
    - Add policy for authenticated users to delete their own saved locations

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on is_primary for quick primary location lookups
*/

CREATE TABLE IF NOT EXISTS saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved locations"
  ON saved_locations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved locations"
  ON saved_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved locations"
  ON saved_locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved locations"
  ON saved_locations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_is_primary ON saved_locations(is_primary);
