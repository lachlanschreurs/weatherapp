/*
  # Add country/region support to agronomy chemicals

  1. Modified Tables
    - `agro_chemicals`
      - Add `country` column (text, default 'AU') to identify regulatory jurisdiction
      - Values: 'AU' (APVMA), 'US' (EPA), 'NZ' (ACVM/EPA NZ)
      - Add `registration_number` column for EPA/ACVM registration numbers
      - Existing `apvma_registration` column remains for Australian products

  2. Notes
    - All existing chemicals default to 'AU' (Australian APVMA registered)
    - New US and NZ chemicals will be inserted with appropriate country codes
    - Index on country column for efficient filtering
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agro_chemicals' AND column_name = 'country'
  ) THEN
    ALTER TABLE agro_chemicals ADD COLUMN country text NOT NULL DEFAULT 'AU';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agro_chemicals' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE agro_chemicals ADD COLUMN registration_number text DEFAULT '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agro_chemicals_country ON agro_chemicals(country);
