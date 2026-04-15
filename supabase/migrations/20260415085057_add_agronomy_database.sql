/*
  # FarmCast Agronomy Database

  ## Overview
  Creates a comprehensive Australian agricultural database covering diseases, chemicals/sprays,
  pests, and weeds — with full linking logic between categories and searchable fields.

  ## New Tables

  ### 1. agro_chemicals
  Stores complete chemical/spray product records including:
  - Product name, active ingredient, chemical group, mode of action
  - Formulation type, manufacturer
  - Registered crops (array), target pests/diseases/weeds (array)
  - Application rate, withholding period (WHP), re-entry period (REI)
  - Label notes, resistance notes, chemical category (fungicide/insecticide/herbicide/other)

  ### 2. agro_diseases
  Stores plant disease records including:
  - Disease name, common name, pathogen type
  - Affected crops (array), symptoms, conditions favouring outbreak
  - Management options, prevention notes
  - Links to chemicals via agro_disease_chemicals join table

  ### 3. agro_pests
  Stores pest records including:
  - Pest name, common name, pest type (insect/mite/nematode/vertebrate)
  - Affected crops (array), identification details, damage caused
  - Lifecycle/behaviour notes, monitoring notes, treatment options
  - Links to chemicals via agro_pest_chemicals join table

  ### 4. agro_weeds
  Stores weed records including:
  - Weed name, common name, weed family
  - Affected crops/environments (array), identification details
  - Growth habit, control methods, resistance notes
  - Links to chemicals via agro_weed_chemicals join table

  ### 5. agro_disease_chemicals (join table)
  Links diseases to their recommended chemical treatments with notes.

  ### 6. agro_pest_chemicals (join table)
  Links pests to their recommended insecticides with notes.

  ### 7. agro_weed_chemicals (join table)
  Links weeds to their recommended herbicides with notes.

  ## Security
  - RLS enabled on all tables
  - All records are publicly readable (agricultural data is public knowledge)
  - Only service_role can insert/update/delete (admin-only writes)

  ## Notes
  - All crop, pest, weed, and disease arrays are text[] for flexible multi-value storage
  - Designed for future expansion without schema changes
  - Full-text search indexes on name and crop fields
*/

-- ===========================
-- CHEMICALS / SPRAYS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS agro_chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  active_ingredient text NOT NULL,
  chemical_group text DEFAULT '',
  mode_of_action text DEFAULT '',
  formulation_type text DEFAULT '',
  category text NOT NULL DEFAULT 'fungicide' CHECK (category IN ('fungicide', 'insecticide', 'herbicide', 'miticide', 'nematicide', 'other')),
  manufacturer text DEFAULT '',
  registered_crops text[] DEFAULT '{}',
  target_issues text[] DEFAULT '{}',
  application_rate text DEFAULT '',
  withholding_period text DEFAULT '',
  reentry_period text DEFAULT '',
  label_notes text DEFAULT '',
  resistance_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- DISEASES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS agro_diseases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name text NOT NULL,
  common_name text DEFAULT '',
  pathogen_type text DEFAULT '' CHECK (pathogen_type IN ('fungal', 'bacterial', 'viral', 'oomycete', 'nematode', 'physiological', '')),
  affected_crops text[] DEFAULT '{}',
  symptoms text DEFAULT '',
  conditions_favouring text DEFAULT '',
  management_options text DEFAULT '',
  prevention_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- PESTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS agro_pests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pest_name text NOT NULL,
  common_name text DEFAULT '',
  pest_type text DEFAULT '' CHECK (pest_type IN ('insect', 'mite', 'nematode', 'vertebrate', 'mollusc', 'other', '')),
  affected_crops text[] DEFAULT '{}',
  identification_details text DEFAULT '',
  damage_caused text DEFAULT '',
  lifecycle_notes text DEFAULT '',
  monitoring_notes text DEFAULT '',
  treatment_options text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- WEEDS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS agro_weeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weed_name text NOT NULL,
  common_name text DEFAULT '',
  weed_family text DEFAULT '',
  affected_environments text[] DEFAULT '{}',
  identification_details text DEFAULT '',
  growth_habit text DEFAULT '',
  control_methods text DEFAULT '',
  resistance_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- JOIN TABLES
-- ===========================
CREATE TABLE IF NOT EXISTS agro_disease_chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id uuid NOT NULL REFERENCES agro_diseases(id) ON DELETE CASCADE,
  chemical_id uuid NOT NULL REFERENCES agro_chemicals(id) ON DELETE CASCADE,
  application_notes text DEFAULT '',
  efficacy_rating text DEFAULT '' CHECK (efficacy_rating IN ('high', 'moderate', 'low', '')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(disease_id, chemical_id)
);

CREATE TABLE IF NOT EXISTS agro_pest_chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pest_id uuid NOT NULL REFERENCES agro_pests(id) ON DELETE CASCADE,
  chemical_id uuid NOT NULL REFERENCES agro_chemicals(id) ON DELETE CASCADE,
  application_notes text DEFAULT '',
  efficacy_rating text DEFAULT '' CHECK (efficacy_rating IN ('high', 'moderate', 'low', '')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pest_id, chemical_id)
);

CREATE TABLE IF NOT EXISTS agro_weed_chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weed_id uuid NOT NULL REFERENCES agro_weeds(id) ON DELETE CASCADE,
  chemical_id uuid NOT NULL REFERENCES agro_chemicals(id) ON DELETE CASCADE,
  application_notes text DEFAULT '',
  efficacy_rating text DEFAULT '' CHECK (efficacy_rating IN ('high', 'moderate', 'low', '')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(weed_id, chemical_id)
);

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_agro_chemicals_product_name ON agro_chemicals USING gin(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_agro_chemicals_active_ingredient ON agro_chemicals USING gin(to_tsvector('english', active_ingredient));
CREATE INDEX IF NOT EXISTS idx_agro_chemicals_category ON agro_chemicals(category);
CREATE INDEX IF NOT EXISTS idx_agro_chemicals_registered_crops ON agro_chemicals USING gin(registered_crops);

CREATE INDEX IF NOT EXISTS idx_agro_diseases_name ON agro_diseases USING gin(to_tsvector('english', disease_name));
CREATE INDEX IF NOT EXISTS idx_agro_diseases_crops ON agro_diseases USING gin(affected_crops);

CREATE INDEX IF NOT EXISTS idx_agro_pests_name ON agro_pests USING gin(to_tsvector('english', pest_name));
CREATE INDEX IF NOT EXISTS idx_agro_pests_crops ON agro_pests USING gin(affected_crops);

CREATE INDEX IF NOT EXISTS idx_agro_weeds_name ON agro_weeds USING gin(to_tsvector('english', weed_name));
CREATE INDEX IF NOT EXISTS idx_agro_weeds_environments ON agro_weeds USING gin(affected_environments);

CREATE INDEX IF NOT EXISTS idx_agro_disease_chemicals_disease ON agro_disease_chemicals(disease_id);
CREATE INDEX IF NOT EXISTS idx_agro_disease_chemicals_chemical ON agro_disease_chemicals(chemical_id);
CREATE INDEX IF NOT EXISTS idx_agro_pest_chemicals_pest ON agro_pest_chemicals(pest_id);
CREATE INDEX IF NOT EXISTS idx_agro_pest_chemicals_chemical ON agro_pest_chemicals(chemical_id);
CREATE INDEX IF NOT EXISTS idx_agro_weed_chemicals_weed ON agro_weed_chemicals(weed_id);
CREATE INDEX IF NOT EXISTS idx_agro_weed_chemicals_chemical ON agro_weed_chemicals(chemical_id);

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================
ALTER TABLE agro_chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_weeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_disease_chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_pest_chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_weed_chemicals ENABLE ROW LEVEL SECURITY;

-- All agronomy data is publicly readable (reference data)
CREATE POLICY "Agronomy chemicals are publicly readable"
  ON agro_chemicals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agronomy diseases are publicly readable"
  ON agro_diseases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agronomy pests are publicly readable"
  ON agro_pests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agronomy weeds are publicly readable"
  ON agro_weeds FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agronomy disease-chemical links are publicly readable"
  ON agro_disease_chemicals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agronomy pest-chemical links are publicly readable"
  ON agro_pest_chemicals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agronomy weed-chemical links are publicly readable"
  ON agro_weed_chemicals FOR SELECT
  TO anon, authenticated
  USING (true);
