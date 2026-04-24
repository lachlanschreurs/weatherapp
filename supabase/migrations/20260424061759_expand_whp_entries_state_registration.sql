/*
  # Expand chemical_whp_entries for per-state registration and WHP

  ## Changes
  - Adds `state` (text) column — Australian state/territory code, or 'All' for nationally uniform entries
  - Adds `registered` (boolean) — whether the product is registered for this crop in this state
  - Renames `state_restriction` to a general `application_notes` column (more flexible)
  - Drops old data and re-seeds per state below (via separate migration)

  ## Column meanings
  - state: 'All' | 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'
  - registered: true = registered and approved for this crop/state, false = not registered
  - days: withholding period in days (only meaningful when registered = true)
  - notes: label qualifications (e.g. 'Pre-emergent only', 'Seed treatment')
*/

ALTER TABLE chemical_whp_entries
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'All',
  ADD COLUMN IF NOT EXISTS registered boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chemical_whp_entries' AND column_name = 'state_restriction'
  ) THEN
    ALTER TABLE chemical_whp_entries RENAME COLUMN state_restriction TO application_notes;
  END IF;
END $$;

-- Add index for state lookups
CREATE INDEX IF NOT EXISTS idx_whp_entries_state ON chemical_whp_entries(state);

-- Clear existing seed data so it can be re-seeded with state columns
TRUNCATE TABLE chemical_whp_entries;
