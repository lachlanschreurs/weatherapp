/*
  # Redesign Probe System for Multiple Providers

  1. Schema Changes
    - Add `connection_method` field to support different auth types (oauth, api_key, username_password, csv_import, email_import)
    - Add `auth_config` JSONB field to store provider-specific auth data flexibly
    - Add `provider_metadata` JSONB field for provider-specific settings
    - Rename fields to be more generic

  2. New Tables
    - `probe_csv_imports` - Store CSV import metadata and processing status
    - `probe_import_mappings` - Store column mappings for CSV imports

  3. Updated Tables
    - `probe_connections` - Enhanced to support multiple auth methods
    - `probe_readings_latest` - Already provider-agnostic, no changes needed

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add new fields to probe_connections for multi-provider support
DO $$
BEGIN
  -- Add connection_method if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_connections' AND column_name = 'connection_method'
  ) THEN
    ALTER TABLE probe_connections ADD COLUMN connection_method text DEFAULT 'api_key';
  END IF;

  -- Add auth_config for flexible auth data storage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_connections' AND column_name = 'auth_config'
  ) THEN
    ALTER TABLE probe_connections ADD COLUMN auth_config jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add provider_metadata for provider-specific settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_connections' AND column_name = 'provider_metadata'
  ) THEN
    ALTER TABLE probe_connections ADD COLUMN provider_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add friendly_name for user-defined connection names
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_connections' AND column_name = 'friendly_name'
  ) THEN
    ALTER TABLE probe_connections ADD COLUMN friendly_name text;
  END IF;
END $$;

-- Create probe_csv_imports table
CREATE TABLE IF NOT EXISTS probe_csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES probe_connections(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size integer NOT NULL,
  row_count integer,
  processed_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  column_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_data text,
  processing_errors jsonb,
  uploaded_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE probe_csv_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CSV imports"
  ON probe_csv_imports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CSV imports"
  ON probe_csv_imports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CSV imports"
  ON probe_csv_imports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CSV imports"
  ON probe_csv_imports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_probe_csv_imports_user_id ON probe_csv_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_csv_imports_connection_id ON probe_csv_imports(connection_id);
CREATE INDEX IF NOT EXISTS idx_probe_csv_imports_status ON probe_csv_imports(status);

-- Create probe_import_mappings table for reusable CSV column mappings
CREATE TABLE IF NOT EXISTS probe_import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  mapping_name text NOT NULL,
  column_mapping jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE probe_import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import mappings"
  ON probe_import_mappings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import mappings"
  ON probe_import_mappings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import mappings"
  ON probe_import_mappings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own import mappings"
  ON probe_import_mappings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_probe_import_mappings_user_id ON probe_import_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_import_mappings_provider ON probe_import_mappings(provider);

-- Add check constraint for connection_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'probe_connections_connection_method_check'
  ) THEN
    ALTER TABLE probe_connections
    ADD CONSTRAINT probe_connections_connection_method_check
    CHECK (connection_method IN ('api_key', 'oauth', 'username_password', 'csv_import', 'email_import', 'webhook'));
  END IF;
END $$;

-- Add check constraint for CSV import status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'probe_csv_imports_status_check'
  ) THEN
    ALTER TABLE probe_csv_imports
    ADD CONSTRAINT probe_csv_imports_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial'));
  END IF;
END $$;
