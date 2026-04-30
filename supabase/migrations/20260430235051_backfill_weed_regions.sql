/*
  # Backfill weed regions

  1. Modified Table
    - `agro_weeds` - set regions array based on geographic relevance

  2. Classification Logic
    - AU-only: Capeweed, Patersons Curse, Doublegee, Parthenium, Hairy Panic,
      Fireweed, Nardoo, Boneseed, Ward Weed, Mossman River Grass, etc.
    - AU + NZ: Annual Ryegrass, Serrated Tussock, Soursob, Liverseed Grass
    - US + CA: Giant Foxtail, Ragweed, Smooth Cordgrass
    - Cosmopolitan: Fat Hen, Barnyard Grass, Johnson Grass, Wild Oats, thistles, etc.
*/

-- Australia-only weeds
UPDATE agro_weeds SET regions = ARRAY['AU']
WHERE weed_name IN (
  'Arctotheca calendula',
  'Echium plantagineum',
  'Emex australis',
  'Parthenium hysterophorus',
  'Panicum effusum',
  'Senecio madagascariensis',
  'Chrysanthemoides monilifera',
  'Carrichtera annua',
  'Cenchrus echinatus',
  'Marsilea drummondii',
  'Chloris truncata',
  'Bactrocera cucumis',
  'Cuscuta australis',
  'Ludwigia octovalvis',
  'Urochloa panicoides',
  'Xanthium strumarium',
  'Phalaris aquatica'
);

-- Australia + New Zealand
UPDATE agro_weeds SET regions = ARRAY['AU', 'NZ']
WHERE weed_name IN (
  'Lolium rigidum',
  'Nassella trichotoma',
  'Oxalis pes-caprae',
  'Lantana camara',
  'Sagittaria montevidensis',
  'Leersia hexandra',
  'Rottboellia cochinchinensis'
);

-- North America (US + Canada) only
UPDATE agro_weeds SET regions = ARRAY['US', 'CA']
WHERE weed_name IN (
  'Setaria faberi',
  'Ambrosia artemisiifolia',
  'Spartina alterniflora'
);

-- US + CA + AU (Giant Foxtail substitute: Green Foxtail is cosmopolitan)
UPDATE agro_weeds SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE weed_name IN (
  'Setaria viridis'
);

-- AU + NZ + US (Prickly Pear)
UPDATE agro_weeds SET regions = ARRAY['AU', 'US', 'NZ']
WHERE weed_name IN (
  'Opuntia stricta'
);

-- AU + US (tropical/subtropical weeds)
UPDATE agro_weeds SET regions = ARRAY['AU', 'US']
WHERE weed_name IN (
  'Echinochloa colona',
  'Imperata cylindrica'
);

-- Cosmopolitan weeds (found in all four regions)
UPDATE agro_weeds SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE weed_name IN (
  'Lolium perenne',
  'Raphanus raphanistrum',
  'Raphanus raphanistrum x R. sativus',
  'Sonchus oleraceus',
  'Conyza spp.',
  'Conyza bonariensis',
  'Avena fatua',
  'Avena ludoviciana',
  'Phalaris paradoxa',
  'Bromus diandrus',
  'Hordeum leporinum',
  'Chenopodium album',
  'Echinochloa crus-galli',
  'Sorghum halepense',
  'Malva parviflora',
  'Acetosella vulgaris',
  'Amaranthus hybridus',
  'Bidens pilosa',
  'Carduus nutans',
  'Cirsium arvense',
  'Cirsium vulgare',
  'Convolvulus arvensis',
  'Cynodon dactylon',
  'Cyperus rotundus',
  'Datura stramonium',
  'Eragrostis cilianensis',
  'Erodium cicutarium',
  'Euphorbia peplus',
  'Fumaria officinalis',
  'Galium aparine',
  'Hypericum perforatum',
  'Juncus usitatus',
  'Lactuca serriola',
  'Medicago minima',
  'Oxalis corniculata',
  'Paspalum dilatatum',
  'Polygonum aviculare',
  'Portulaca oleracea',
  'Rumex crispus',
  'Rumex obtusifolius',
  'Sinapis arvensis',
  'Solanum nigrum',
  'Stellaria media',
  'Tribulus terrestris'
);

-- Burr Medic - primarily AU + NZ
UPDATE agro_weeds SET regions = ARRAY['AU', 'NZ']
WHERE weed_name = 'Medicago minima';

-- Ensure no weeds have empty regions
UPDATE agro_weeds SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE regions = '{}' OR regions IS NULL;
