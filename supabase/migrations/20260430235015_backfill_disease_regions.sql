/*
  # Backfill disease regions

  1. Modified Table
    - `agro_diseases` - set regions array based on geographic relevance

  2. Classification Logic
    - Most crop diseases are cosmopolitan (present globally wherever the host crop is grown)
    - Some are primarily tropical/subtropical (Panama TR4, Black Sigatoka)
    - Ascochyta of chickpea - major in AU and CA (pulse growing regions)
    - Sudden Oak Death - primarily US west coast and NZ/EU
    - Blackleg of canola - AU, CA (major canola producers)
*/

-- Australia-specific or primarily Australian
UPDATE agro_diseases SET regions = ARRAY['AU']
WHERE disease_name IN (
  'Mycosphaerella fijiensis',
  'Fusarium oxysporum f.sp. cubense TR4'
);

-- AU + CA (major canola/pulse producers)
UPDATE agro_diseases SET regions = ARRAY['AU', 'CA']
WHERE disease_name IN (
  'Leptosphaeria maculans',
  'Plenodomus lingam',
  'Didymella rabiei'
);

-- US + NZ (Sudden Oak Death)
UPDATE agro_diseases SET regions = ARRAY['US', 'NZ']
WHERE disease_name IN (
  'Phytophthora ramorum'
);

-- AU + NZ (Phytophthora cinnamomi - major in southern hemisphere)
UPDATE agro_diseases SET regions = ARRAY['AU', 'NZ']
WHERE disease_name IN (
  'Phytophthora cinnamomi'
);

-- US + CA (Summer Patch of Turf - primarily N. American)
UPDATE agro_diseases SET regions = ARRAY['US', 'CA']
WHERE disease_name IN (
  'Ophiosphaerella herpotricha'
);

-- Southern Corn Rust - subtropical, AU + US
UPDATE agro_diseases SET regions = ARRAY['AU', 'US']
WHERE disease_name IN (
  'Puccinia polysora'
);

-- AU + NZ + US (tobacco - Blue Mould)
UPDATE agro_diseases SET regions = ARRAY['AU', 'US', 'CA']
WHERE disease_name IN (
  'Peronospora tabacina'
);

-- Light Leaf Spot of Canola - AU, NZ, CA
UPDATE agro_diseases SET regions = ARRAY['AU', 'NZ', 'CA']
WHERE disease_name IN (
  'Pyrenopeziza brassicae'
);

-- Net Blotch of Barley - AU, CA (major barley regions)
UPDATE agro_diseases SET regions = ARRAY['AU', 'CA', 'US']
WHERE disease_name IN (
  'Pyrenophora teres'
);

-- Rice Blast - AU, US (rice growing)
UPDATE agro_diseases SET regions = ARRAY['AU', 'US']
WHERE disease_name IN (
  'Pyricularia oryzae'
);

-- Citrus Canker - AU, US (Florida)
UPDATE agro_diseases SET regions = ARRAY['AU', 'US', 'NZ']
WHERE disease_name IN (
  'Xanthomonas axonopodis pv. citri'
);

-- Stem Canker of Soybean - US, CA, AU
UPDATE agro_diseases SET regions = ARRAY['US', 'CA', 'AU']
WHERE disease_name IN (
  'Diaporthe phaseolorum var. meridionalis'
);

-- Cosmopolitan diseases (present in all four regions)
UPDATE agro_diseases SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE disease_name IN (
  'Phytophthora infestans',
  'Alternaria solani',
  'Botrytis cinerea',
  'Puccinia striiformis f.sp. tritici',
  'Puccinia triticina',
  'Sclerotinia sclerotiorum',
  'Fusarium oxysporum',
  'Erysiphe necator',
  'Podosphaera xanthii',
  'Plasmopara viticola',
  'Venturia inaequalis',
  'Monilinia spp.',
  'Colletotrichum spp.',
  'Peronospora destructor',
  'Septoria tritici',
  'Alternaria brassicae',
  'Barley Yellow Dwarf Virus',
  'Botrytis allii',
  'Cercospora beticola',
  'Colletotrichum acutatum',
  'Colletotrichum gloeosporioides',
  'Cucumber Mosaic Virus',
  'Fusarium graminearum',
  'Gaeumannomyces graminis',
  'Peronospora brassicae',
  'Peronospora farinosa',
  'Phytophthora cactorum',
  'Phytophthora parasitica',
  'Pseudomonas syringae pv. tomato',
  'Pythium spp.',
  'Rhizoctonia solani',
  'Sclerotinia minor',
  'Sphaerotheca pannosa',
  'Spongospora subterranea',
  'Tomato Spotted Wilt Virus',
  'Xanthomonas perforans'
);

-- Ensure no diseases have empty regions
UPDATE agro_diseases SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE regions = '{}' OR regions IS NULL;
