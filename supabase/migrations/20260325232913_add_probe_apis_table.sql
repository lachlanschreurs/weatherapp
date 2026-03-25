/*
  # Add Probe APIs Table

  1. New Tables
    - `probe_apis`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Display name for the probe API
      - `api_url` (text) - URL endpoint for the probe API
      - `api_key` (text) - Authentication key for the API
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `probe_apis` table
    - Add policy for users to read their own probe APIs
    - Add policy for users to insert their own probe APIs
    - Add policy for users to update their own probe APIs
    - Add policy for users to delete their own probe APIs
*/

CREATE TABLE IF NOT EXISTS probe_apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE probe_apis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own probe APIs"
  ON probe_apis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own probe APIs"
  ON probe_apis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own probe APIs"
  ON probe_apis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own probe APIs"
  ON probe_apis
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS probe_apis_user_id_idx ON probe_apis(user_id);
