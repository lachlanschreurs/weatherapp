/*
  # Expand Agronomy Database to Production Schema

  ## Changes
  1. Add APVMA registration, label_link, and target_type to agro_chemicals
  2. Add spray_threshold to agro_pests
  3. Add weather_favourable_conditions and damage_symptoms to existing tables via rename/alias
  4. Add resistance_group to agro_weeds
  5. All additions use IF NOT EXISTS / safe patterns

  ## New Columns
  - agro_chemicals: apvma_registration, label_link, target_type
  - agro_pests: spray_threshold, damage_symptoms
  - agro_diseases: weather_favourable_conditions (alias conditions_favouring)
  - agro_weeds: resistance_group
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_chemicals' AND column_name='apvma_registration') THEN
    ALTER TABLE agro_chemicals ADD COLUMN apvma_registration text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_chemicals' AND column_name='label_link') THEN
    ALTER TABLE agro_chemicals ADD COLUMN label_link text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_chemicals' AND column_name='target_type') THEN
    ALTER TABLE agro_chemicals ADD COLUMN target_type text DEFAULT '' CHECK (target_type IN ('pest', 'disease', 'weed', 'multiple', ''));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_pests' AND column_name='spray_threshold') THEN
    ALTER TABLE agro_pests ADD COLUMN spray_threshold text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_pests' AND column_name='damage_symptoms') THEN
    ALTER TABLE agro_pests ADD COLUMN damage_symptoms text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_weeds' AND column_name='resistance_group') THEN
    ALTER TABLE agro_weeds ADD COLUMN resistance_group text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agro_diseases' AND column_name='weather_favourable_conditions') THEN
    ALTER TABLE agro_diseases ADD COLUMN weather_favourable_conditions text DEFAULT '';
  END IF;
END $$;

-- Additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_agro_chemicals_target_type ON agro_chemicals(target_type);
CREATE INDEX IF NOT EXISTS idx_agro_chemicals_active_ing_btree ON agro_chemicals(active_ingredient);
CREATE INDEX IF NOT EXISTS idx_agro_diseases_weather ON agro_diseases USING gin(to_tsvector('english', coalesce(weather_favourable_conditions, '')));
