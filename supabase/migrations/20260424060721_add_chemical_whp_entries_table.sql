/*
  # Add Chemical WHP Entries Table

  ## Summary
  Replaces the single free-text `withholding_period` field on `agro_chemicals`
  with a structured per-crop/per-state lookup table.

  ## New Tables
  - `chemical_whp_entries`
    - `id` (uuid, PK)
    - `chemical_id` (uuid, FK → agro_chemicals.id)
    - `crop` (text) — crop or crop group name, e.g. "Vegetable", "Grape", "All crops"
    - `days` (integer) — number of days (0 = nil WHP / pre-emergent)
    - `notes` (text, nullable) — any label qualifications, e.g. "pre-emergent only", "food use"
    - `state_restriction` (text, nullable) — if WHP differs by Australian state, e.g. "QLD", "NSW"
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public SELECT (read-only, same access level as agro_chemicals)
  - No INSERT/UPDATE/DELETE for non-service-role — data managed via migrations only
*/

CREATE TABLE IF NOT EXISTS chemical_whp_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chemical_id uuid NOT NULL REFERENCES agro_chemicals(id) ON DELETE CASCADE,
  crop text NOT NULL,
  days integer NOT NULL DEFAULT 0,
  notes text,
  state_restriction text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whp_entries_chemical_id ON chemical_whp_entries(chemical_id);
CREATE INDEX IF NOT EXISTS idx_whp_entries_crop ON chemical_whp_entries(crop);

ALTER TABLE chemical_whp_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read WHP entries"
  ON chemical_whp_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);
