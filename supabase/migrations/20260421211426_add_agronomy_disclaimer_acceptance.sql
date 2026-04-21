/*
  # Add agronomy disclaimer acceptance tracking to profiles

  1. Changes
    - `agronomy_disclaimer_version` (text, nullable) — stores the version string of the last accepted disclaimer
    - `agronomy_disclaimer_accepted_at` (timestamptz, nullable) — timestamp of acceptance

  2. Notes
    - Nullable so existing rows are unaffected
    - No RLS changes needed; existing profile policies cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'agronomy_disclaimer_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN agronomy_disclaimer_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'agronomy_disclaimer_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN agronomy_disclaimer_accepted_at timestamptz;
  END IF;
END $$;
