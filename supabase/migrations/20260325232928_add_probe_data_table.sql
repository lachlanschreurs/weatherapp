/*
  # Add Probe Data Table

  1. New Tables
    - `probe_data`
      - `id` (uuid, primary key)
      - `probe_api_id` (uuid, foreign key to probe_apis)
      - `probe_id` (text) - ID from the external probe system
      - `depth` (numeric) - Depth of the probe in cm
      - `moisture` (numeric) - Moisture reading (percentage or value)
      - `temperature` (numeric) - Temperature reading
      - `reading_time` (timestamptz) - When the reading was taken
      - `created_at` (timestamptz) - When we fetched this data
      - `raw_data` (jsonb) - Store the full response for debugging

  2. Security
    - Enable RLS on `probe_data` table
    - Add policy for users to read probe data from their own probe APIs
    - Add policy for system to insert probe data (service role only)

  3. Performance
    - Add index on probe_api_id for fast lookups
    - Add index on reading_time for time-based queries
*/

CREATE TABLE IF NOT EXISTS probe_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_api_id uuid REFERENCES probe_apis(id) ON DELETE CASCADE NOT NULL,
  probe_id text NOT NULL,
  depth numeric,
  moisture numeric,
  temperature numeric,
  reading_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  raw_data jsonb
);

ALTER TABLE probe_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view probe data from own APIs"
  ON probe_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM probe_apis
      WHERE probe_apis.id = probe_data.probe_api_id
      AND probe_apis.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS probe_data_probe_api_id_idx ON probe_data(probe_api_id);
CREATE INDEX IF NOT EXISTS probe_data_reading_time_idx ON probe_data(reading_time DESC);
CREATE INDEX IF NOT EXISTS probe_data_probe_id_idx ON probe_data(probe_id);
