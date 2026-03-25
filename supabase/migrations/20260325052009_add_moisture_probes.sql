/*
  # Add Moisture Probe Data Storage

  1. New Tables
    - `moisture_probes`
      - `id` (uuid, primary key) - Unique probe identifier
      - `user_id` (uuid, foreign key) - Owner of the probe
      - `name` (text) - Friendly name for the probe
      - `location_name` (text) - Where the probe is installed
      - `latitude` (numeric) - Geographic location
      - `longitude` (numeric) - Geographic location
      - `depth_cm` (numeric) - Depth of probe in centimeters
      - `soil_type` (text) - Type of soil (optional)
      - `active` (boolean) - Whether probe is currently active
      - `created_at` (timestamptz) - When probe was registered
      - `updated_at` (timestamptz) - Last modification time

    - `moisture_readings`
      - `id` (uuid, primary key) - Unique reading identifier
      - `probe_id` (uuid, foreign key) - Which probe took this reading
      - `moisture_percentage` (numeric) - Moisture level (0-100)
      - `temperature_c` (numeric, optional) - Soil temperature if available
      - `battery_percentage` (numeric, optional) - Probe battery level
      - `reading_timestamp` (timestamptz) - When reading was taken
      - `created_at` (timestamptz) - When reading was received

  2. Security
    - Enable RLS on both tables
    - Users can view their own probes and readings
    - API can insert readings with service role key
    - Users can manage their own probes

  3. Indexes
    - Index on probe_id for fast reading lookups
    - Index on reading_timestamp for time-based queries
    - Index on user_id for user-specific queries
*/

-- Create moisture_probes table
CREATE TABLE IF NOT EXISTS moisture_probes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location_name text NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  depth_cm numeric(5, 1) NOT NULL,
  soil_type text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create moisture_readings table
CREATE TABLE IF NOT EXISTS moisture_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id uuid REFERENCES moisture_probes(id) ON DELETE CASCADE NOT NULL,
  moisture_percentage numeric(5, 2) NOT NULL,
  temperature_c numeric(5, 2),
  battery_percentage numeric(5, 2),
  reading_timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE moisture_probes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moisture_readings ENABLE ROW LEVEL SECURITY;

-- Policies for moisture_probes
CREATE POLICY "Users can view own probes"
  ON moisture_probes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own probes"
  ON moisture_probes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own probes"
  ON moisture_probes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own probes"
  ON moisture_probes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for moisture_readings
CREATE POLICY "Users can view readings from own probes"
  ON moisture_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM moisture_probes
      WHERE moisture_probes.id = moisture_readings.probe_id
      AND moisture_probes.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert readings"
  ON moisture_readings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id ON moisture_probes(user_id);
CREATE INDEX IF NOT EXISTS idx_moisture_probes_active ON moisture_probes(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id ON moisture_readings(probe_id);
CREATE INDEX IF NOT EXISTS idx_moisture_readings_timestamp ON moisture_readings(reading_timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_moisture_probe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS moisture_probes_updated_at ON moisture_probes;
CREATE TRIGGER moisture_probes_updated_at
  BEFORE UPDATE ON moisture_probes
  FOR EACH ROW
  EXECUTE FUNCTION update_moisture_probe_updated_at();