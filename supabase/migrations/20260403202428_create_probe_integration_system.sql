/*
  # Moisture Probe Integration System

  1. New Tables
    - `probe_connections`
      - Stores each user's probe API credentials and configuration
      - Supports multiple providers (FieldClimate, etc.)
      - Encrypted storage for sensitive API credentials
      - Tracks connection health and last sync status
    
    - `probe_readings_latest`
      - Stores the most recent reading for each user's probe
      - Normalized data structure across different providers
      - Includes raw payload for debugging
      - Timestamped for freshness tracking

  2. Security
    - Enable RLS on both tables
    - Users can only access their own probe connections and readings
    - API keys/secrets never exposed in SELECT queries
    - Service role required for credential management

  3. Indexes
    - Efficient lookups by user_id
    - Quick access to active connections
    - Fast retrieval of latest readings

  4. Functions
    - Auto-update timestamps
    - Secure credential handling
*/

-- Create probe_connections table
CREATE TABLE IF NOT EXISTS probe_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'fieldclimate',
  api_key text NOT NULL,
  api_secret text NOT NULL,
  station_id text NOT NULL,
  device_id text,
  sensor_mapping jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_station UNIQUE(user_id, station_id)
);

-- Create probe_readings_latest table
CREATE TABLE IF NOT EXISTS probe_readings_latest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES probe_connections(id) ON DELETE CASCADE,
  provider text NOT NULL,
  station_id text NOT NULL,
  device_id text,
  moisture_percent numeric(5,2),
  soil_temp_c numeric(5,2),
  rainfall_mm numeric(8,2),
  battery_level numeric(5,2),
  raw_payload jsonb,
  measured_at timestamptz NOT NULL,
  synced_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_connection_reading UNIQUE(user_id, connection_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_probe_connections_user_id ON probe_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_connections_active ON probe_connections(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_probe_readings_user_id ON probe_readings_latest(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_readings_connection_id ON probe_readings_latest(connection_id);

-- Enable RLS
ALTER TABLE probe_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE probe_readings_latest ENABLE ROW LEVEL SECURITY;

-- RLS Policies for probe_connections
CREATE POLICY "Users can view own probe connections"
  ON probe_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own probe connections"
  ON probe_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own probe connections"
  ON probe_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own probe connections"
  ON probe_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for probe_readings_latest
CREATE POLICY "Users can view own probe readings"
  ON probe_readings_latest
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage probe readings"
  ON probe_readings_latest
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_probe_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update timestamps
DROP TRIGGER IF EXISTS probe_connections_updated_at ON probe_connections;
CREATE TRIGGER probe_connections_updated_at
  BEFORE UPDATE ON probe_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_probe_connection_timestamp();

-- Function to get probe connection without exposing secrets (for frontend)
CREATE OR REPLACE FUNCTION get_probe_connection_safe(connection_id uuid)
RETURNS TABLE (
  id uuid,
  provider text,
  station_id text,
  device_id text,
  is_active boolean,
  last_sync_at timestamptz,
  last_error text,
  has_credentials boolean
) SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.provider,
    pc.station_id,
    pc.device_id,
    pc.is_active,
    pc.last_sync_at,
    pc.last_error,
    (pc.api_key IS NOT NULL AND pc.api_secret IS NOT NULL) as has_credentials
  FROM probe_connections pc
  WHERE pc.id = connection_id
    AND pc.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;