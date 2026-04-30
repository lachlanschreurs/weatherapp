/*
  # Backfill pest regions

  1. Modified Table
    - `agro_pests` - set regions array for each pest based on known geographic distribution

  2. Classification Logic
    - AU-only: Native Budworm, Red-legged Earth Mite, Rutherglen Bug, Queensland Fruit Fly,
      Cucumber Fly, Bogong Moth Cutworm, Common Armyworm (AU species), Sugarcane Aphid (AU populations),
      Eucalyptus Tortoise Beetle, Rose Thrips (AU)
    - Cosmopolitan (all regions): Green Peach Aphid, Two-spotted Mite, Diamondback Moth,
      Western Flower Thrips, Cotton Bollworm, Fall Armyworm, etc.
    - US/CA: Wheat Stem Sawfly (North American species)
    - NZ/AU: Paropsis (Eucalyptus beetle found in both)

  3. Notes
    - Pests present in multiple regions get all applicable region codes
    - Beneficial organisms included in regions where they are used as biocontrol
*/

-- Australian-only or primarily Australian pests
UPDATE agro_pests SET regions = ARRAY['AU']
WHERE pest_name IN (
  'Helicoverpa punctigera',
  'Halotydeus destructor',
  'Nysius vinitor',
  'Bactrocera tryoni',
  'Bactrocera cucumis',
  'Agrotis infusa',
  'Mythimna convecta',
  'Neomaskellia andropogonis',
  'Thrips imaginis'
);

-- Australia + New Zealand
UPDATE agro_pests SET regions = ARRAY['AU', 'NZ']
WHERE pest_name IN (
  'Paropsis charybdis',
  'Xanthogaleruca luteola'
);

-- North America (US + Canada)
UPDATE agro_pests SET regions = ARRAY['US', 'CA']
WHERE pest_name IN (
  'Cephus cinctus'
);

-- Cosmopolitan pests (found in all four regions)
UPDATE agro_pests SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE pest_name IN (
  'Helicoverpa armigera',
  'Myzus persicae',
  'Bemisia tabaci',
  'Tetranychus urticae',
  'Panonychus ulmi',
  'Frankliniella occidentalis',
  'Thrips tabaci',
  'Spodoptera frugiperda',
  'Plutella xylostella',
  'Lipaphis erysimi',
  'Aphis gossypii',
  'Brevicoryne brassicae',
  'Deroceras reticulatum',
  'Macrosiphum euphorbiae',
  'Nezara viridula',
  'Otiorhynchus sulcatus',
  'Panonychus citri',
  'Phyllocnistis citrella',
  'Pseudaulacaspis pentagona',
  'Pseudococcus longispinus',
  'Tetranychus cinnabarinus',
  'Sitophilus oryzae',
  'Tribolium castaneum',
  'Coccus hesperidum',
  'Aspidiotus nerii',
  'Phenacoccus solenopsis',
  'Schizaphis graminum',
  'Melanotus communis',
  'Gryllotalpa orientalis',
  'Daktulosphaira vitifoliae',
  'Eriophyes sheldoni',
  'Heliothrips haemorrhoidalis',
  'Locusta migratoria',
  'Mus musculus',
  'Rattus rattus',
  'Cryptolaemus montrouzieri',
  'Hippodamia variegata',
  'Urophora stylata',
  'Aceria guerreronis'
);

-- AU + US + NZ (not primary in Canada)
UPDATE agro_pests SET regions = ARRAY['AU', 'US', 'NZ']
WHERE pest_name IN (
  'Whitefly - Trialeurodes vaporariorum',
  'Spodoptera exempta'
);

-- Greenhouse Whitefly is actually cosmopolitan, fix
UPDATE agro_pests SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE pest_name = 'Whitefly - Trialeurodes vaporariorum';

-- African Black Armyworm is AU/NZ (recent invasive)
UPDATE agro_pests SET regions = ARRAY['AU', 'NZ']
WHERE pest_name = 'Spodoptera exempta';

-- Green Vegetable Bug - cosmopolitan
UPDATE agro_pests SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE pest_name = 'Nezara viridula';

-- Pediculus grain storage pest - cosmopolitan
UPDATE agro_pests SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE pest_name = 'Pediculus humanus';

-- Ensure no pests have empty regions (fallback to all regions for any missed)
UPDATE agro_pests SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE regions = '{}' OR regions IS NULL;
