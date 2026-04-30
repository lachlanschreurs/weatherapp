/*
  # Add regions column to agronomy tables

  1. Modified Tables
    - `agro_diseases` - added `regions` (text array) for geographic filtering
    - `agro_pests` - added `regions` (text array) for geographic filtering
    - `agro_weeds` - added `regions` (text array) for geographic filtering
    - `agro_fertilisers` - added `regions` (text array) for geographic filtering

  2. Purpose
    - Allow region-specific filtering so users only see pests, diseases, weeds, and fertilisers
      relevant to their geographic location (AU, US, NZ, CA)
    - Many entries are cosmopolitan (found in multiple regions) so we use an array

  3. Notes
    - Default is empty array (shown to all regions until classified)
    - Indexes added for array containment queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agro_diseases' AND column_name = 'regions'
  ) THEN
    ALTER TABLE agro_diseases ADD COLUMN regions text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agro_pests' AND column_name = 'regions'
  ) THEN
    ALTER TABLE agro_pests ADD COLUMN regions text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agro_weeds' AND column_name = 'regions'
  ) THEN
    ALTER TABLE agro_weeds ADD COLUMN regions text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agro_fertilisers' AND column_name = 'regions'
  ) THEN
    ALTER TABLE agro_fertilisers ADD COLUMN regions text[] DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agro_diseases_regions ON agro_diseases USING gin(regions);
CREATE INDEX IF NOT EXISTS idx_agro_pests_regions ON agro_pests USING gin(regions);
CREATE INDEX IF NOT EXISTS idx_agro_weeds_regions ON agro_weeds USING gin(regions);
CREATE INDEX IF NOT EXISTS idx_agro_fertilisers_regions ON agro_fertilisers USING gin(regions);
