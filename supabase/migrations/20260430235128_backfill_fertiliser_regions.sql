/*
  # Backfill fertiliser regions

  1. Modified Table
    - `agro_fertilisers` - set regions array based on brand/product availability

  2. Classification Logic
    - AU-only brands: Incitec Pivot (Granulock, Flexi-N, Nitram, Starter), Landmark (Cropmaster),
      Agri-Tech Australia, Agromin
    - US/CA brands: The Mosaic Company (MicroEssentials), Koch (Agrotain - also AU),
      Nutrien/Agrium (ESN, Polyon)
    - Generic/universal products (Urea, DAP, MAP, MOP, SOP, lime, gypsum, etc.) - all regions
    - Yates is AU/NZ brand
    - SUSTANE is US/CA brand but sold globally
    - EuroChem (Nitrophoska) - AU/NZ distribution
*/

-- Australian-only branded products (Incitec Pivot, Landmark)
UPDATE agro_fertilisers SET regions = ARRAY['AU']
WHERE product_name IN (
  'Granulock Extra (15:13:8:8S)',
  'Granulock S (16:20:0:7S)',
  'Granulock Z Extra (15:13:8:8S+0.5Zn)',
  'Flexi-N (Liquid Urea Ammonium Nitrate)',
  'Nitram (Ammonium Nitrate 34.5% N)',
  'Starter 13:7:14:8S',
  'Cropmaster 15 (15:9:11:5S)',
  'Cropmaster 20 (11:20:0:3.7S)',
  'Humic Acid Liquid (6% Humic + 3% Fulvic)',
  'Organic Xtra (4:1.5:3)',
  'Potassic Superphosphate (0:9:14.5:11S)'
);

-- AU + NZ branded products
UPDATE agro_fertilisers SET regions = ARRAY['AU', 'NZ']
WHERE product_name IN (
  'Complete Tomato & Vegetable Fertiliser (12:5:14)',
  'Nitrophoska Blue Special (12:5:14:9S+2Mg)'
);

-- US + CA branded products
UPDATE agro_fertilisers SET regions = ARRAY['US', 'CA']
WHERE product_name IN (
  'MicroEssentials SZ (12:23:0:10S+1Zn)',
  'Polyon (Polymer Coated Urea)',
  'ESN Smart Nitrogen (Polymer Coated Urea)'
);

-- US + CA + AU (Koch/Nutrien products sold in AU too)
UPDATE agro_fertilisers SET regions = ARRAY['AU', 'US', 'CA']
WHERE product_name IN (
  'Urea + NBPT (Agrotain)'
);

-- SUSTANE organic - primarily US/CA/AU
UPDATE agro_fertilisers SET regions = ARRAY['AU', 'US', 'CA']
WHERE product_name IN (
  'SUSTANE 8-4-4 Organic Fertiliser'
);

-- Universal/generic fertiliser products (all regions)
UPDATE agro_fertilisers SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE product_name IN (
  'Urea 46',
  'DAP (Di-ammonium Phosphate) 18:20:0',
  'MAP (Mono-ammonium Phosphate) 10:22:0',
  'Single Superphosphate (SSP) 0:8.8:0',
  'Triple Superphosphate (TSP) 0:20:0',
  'Muriate of Potash (MOP) 0:0:50',
  'Sulfate of Potash (SOP) 0:0:41.5',
  'Ammonium Sulfate 21:0:0:24',
  'Calcium Ammonium Nitrate (CAN) 27:0:0',
  'Potassium Nitrate 13:0:38',
  'Granular Zinc Sulfate',
  'Agricultural Lime (Calcium Carbonate)',
  'Dolomite',
  'Gypsum (Calcium Sulfate)',
  'Agricultural Sulfur 90% S',
  'AgriPlex Complete Foliar (N:P:K + micros)',
  'Ammonium Nitrate (AN) 34% N',
  'Ammonium Thiosulfate (ATS) 12:0:0:26S',
  'Azospirillum brasilense Liquid Inoculant',
  'Borax (Sodium Tetraborate 11% B)',
  'Calcium Nitrate 15.5:0:0 + 19% Ca',
  'Copper Oxide 75% Cu',
  'Copper Sulfate 25% Cu',
  'Ferrous Sulfate (Iron Sulfate 20% Fe)',
  'Foliar Urea 46% N (low biuret)',
  'Iron EDTA Chelate 6% Fe',
  'Liquid MAP (Ammonium Polyphosphate 11:37:0)',
  'Liquid Potassium Chloride (0:0:39)',
  'Liquid Zinc 9%',
  'Magnesium Sulfate (Epsom Salt) 9.8% Mg',
  'Manganese Oxide 60% Mn',
  'Manganese Sulfate 26% Mn',
  'Molybdenum (Sodium Molybdate 39% Mo)',
  'Potassium Humate 85%',
  'Potassium Sulfate Fine (SOP) 0:0:44',
  'Rhizobium Legume Inoculant (Peat)',
  'Solubor (Sodium Borate 20% B)',
  'UAN (Urea Ammonium Nitrate) 32% N',
  'Urea + Sulfur Blend (40:0:0:5S)',
  'Zinc Oxide 50% Zn'
);

-- Ensure no fertilisers have empty regions
UPDATE agro_fertilisers SET regions = ARRAY['AU', 'US', 'NZ', 'CA']
WHERE regions = '{}' OR regions IS NULL;
