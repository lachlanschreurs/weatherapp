/*
  # Add app config table for API keys

  1. New Tables
    - `app_config` - stores runtime configuration values
      - `key` (text, primary key)
      - `value` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS - only service role can read/write
    - No policies for authenticated users (service role only access)
*/

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO app_config (key, value) VALUES
  ('openweather_api_key', '205a644e0f57ecf98260a957076e46db')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
