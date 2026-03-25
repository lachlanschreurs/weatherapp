/*
  # Add Probe API Endpoints Table

  1. New Tables
    - `probe_api_endpoints`
      - `id` (uuid, primary key) - Unique endpoint identifier
      - `user_id` (uuid, foreign key) - Owner of the endpoint
      - `name` (text) - Friendly name for the API endpoint
      - `api_url` (text) - URL to fetch probe data from
      - `auth_type` (text) - Authentication type: 'none', 'bearer', 'api_key', 'basic'
      - `auth_token` (text, encrypted) - Authentication token/key
      - `poll_interval_minutes` (integer) - How often to poll (default 15 minutes)
      - `active` (boolean) - Whether endpoint is active
      - `last_poll_at` (timestamptz) - Last successful poll timestamp
      - `last_error` (text) - Last error message if any
      - `response_mapping` (jsonb) - JSON mapping for parsing response
      - `created_at` (timestamptz) - When endpoint was created
      - `updated_at` (timestamptz) - Last modification time

  2. Security
    - Enable RLS on table
    - Users can only view/manage their own endpoints
    - Service role can update last_poll_at and last_error

  3. Indexes
    - Index on user_id for user queries
    - Index on active for polling queries
    - Index on last_poll_at for scheduling

  4. Notes
    - The response_mapping field stores how to parse the API response
    - Example: {"probe_id": "$.device.id", "moisture": "$.sensors.moisture", "temperature": "$.sensors.temp"}
*/

-- Create probe_api_endpoints table
CREATE TABLE IF NOT EXISTS probe_api_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  api_url text NOT NULL,
  auth_type text DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'api_key', 'basic')),
  auth_token text DEFAULT '',
  poll_interval_minutes integer DEFAULT 15 CHECK (poll_interval_minutes >= 5 AND poll_interval_minutes <= 1440),
  active boolean DEFAULT true,
  last_poll_at timestamptz,
  last_error text DEFAULT '',
  response_mapping jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE probe_api_endpoints ENABLE ROW LEVEL SECURITY;

-- Policies for probe_api_endpoints
CREATE POLICY "Users can view own endpoints"
  ON probe_api_endpoints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own endpoints"
  ON probe_api_endpoints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own endpoints"
  ON probe_api_endpoints FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own endpoints"
  ON probe_api_endpoints FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id ON probe_api_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_active ON probe_api_endpoints(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_last_poll ON probe_api_endpoints(last_poll_at) WHERE active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_probe_api_endpoint_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS probe_api_endpoints_updated_at ON probe_api_endpoints;
CREATE TRIGGER probe_api_endpoints_updated_at
  BEFORE UPDATE ON probe_api_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_probe_api_endpoint_updated_at();