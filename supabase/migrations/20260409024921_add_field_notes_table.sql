/*
  # Add Field Notes Table

  ## Summary
  Creates a simple field_notes table for farmers to log spray events,
  fertiliser applications, observations, and other farm activities.

  ## New Tables
  - `field_notes`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `location` (text) - farm/location name
    - `type` (text) - spray, fertiliser, planting, chemical, observation
    - `paddock` (text) - paddock name
    - `notes` (text) - free-form notes
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only read/write their own notes
*/

CREATE TABLE IF NOT EXISTS field_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'observation',
  paddock text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE field_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_field_notes_user_id ON field_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_field_notes_created_at ON field_notes(created_at DESC);

CREATE POLICY "Users can view own field notes"
  ON field_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own field notes"
  ON field_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own field notes"
  ON field_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own field notes"
  ON field_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
