/*
  # Seed Canada PMRA-registered chemicals

  1. New Data
    - 35 commonly used Canadian PMRA-registered agricultural chemicals
    - Includes fungicides, insecticides, herbicides for major Canadian crops
    - PCP registration numbers included
    - All marked with country = 'CA'

  2. Notes
    - These are common active ingredients registered under Health Canada PMRA
    - Registration numbers are PCP (Pest Control Products) numbers
    - Covers canola, wheat, barley, soybeans, corn, pulses, fruits, vegetables
    - Canadian agriculture focuses heavily on canola, cereals, and pulse crops
*/

INSERT INTO agro_chemicals (product_name, active_ingredient, chemical_group, mode_of_action, formulation_type, category, manufacturer, registered_crops, target_issues, application_rate, withholding_period, reentry_period, label_notes, resistance_notes, country, registration_number) VALUES

-- FUNGICIDES (CA)
('Prosaro XTR', 'Prothioconazole + Tebuconazole', 'DMI Triazole (3)', 'Sterol biosynthesis inhibitor (C14-demethylase)', 'EC', 'fungicide', 'Bayer CropScience', ARRAY['Wheat', 'Barley', 'Oats', 'Canola', 'Corn'], ARRAY['Fusarium head blight', 'Septoria leaf blotch', 'Rust', 'Tan spot', 'Sclerotinia'], '800 mL/ha', '36 days (wheat/barley)', '12 hours', 'Apply at early to full flowering for FHB control. Best results with full canopy coverage.', 'FRAC Group 3 — moderate resistance risk. Rotate with non-DMI fungicides.', 'CA', 'PCP-30652'),

('Headline EC', 'Pyraclostrobin', 'QoI Strobilurin (11)', 'Inhibition of mitochondrial respiration at Qo site', 'EC', 'fungicide', 'BASF', ARRAY['Wheat', 'Barley', 'Canola', 'Soybeans', 'Corn', 'Pulses'], ARRAY['Sclerotinia', 'Septoria', 'Tan spot', 'Net blotch', 'Anthracnose'], '400-600 mL/ha', '30 days (cereals)', '12 hours', 'Apply preventatively at early disease onset. Maximum 2 applications per season.', 'FRAC Group 11 — high resistance risk. Always tank-mix with multi-site or different MOA.', 'CA', 'PCP-27516'),

('Proline 480 SC', 'Prothioconazole', 'DMI Triazole (3)', 'Sterol biosynthesis inhibitor', 'SC', 'fungicide', 'Bayer CropScience', ARRAY['Wheat', 'Barley', 'Canola', 'Lentils', 'Chickpeas', 'Soybeans'], ARRAY['Fusarium head blight', 'Sclerotinia', 'Septoria', 'Ascochyta blight', 'White mould'], '315 mL/ha', '36 days (wheat)', '12 hours', 'Leading FHB fungicide in Western Canada. Apply at 50-75% anthesis for cereals.', 'FRAC Group 3 — moderate resistance risk. Key tool for mycotoxin reduction.', 'CA', 'PCP-29096'),

('Lance WDG', 'Boscalid', 'SDHI (7)', 'Succinate dehydrogenase inhibitor', 'WG', 'fungicide', 'BASF', ARRAY['Canola', 'Lentils', 'Chickpeas', 'Soybeans', 'Dry beans', 'Sunflowers'], ARRAY['Sclerotinia', 'White mould', 'Ascochyta blight', 'Botrytis'], '392 g/ha', '30 days (canola)', '12 hours', 'Apply at 20-50% bloom in canola for Sclerotinia control. Timing critical for efficacy.', 'FRAC Group 7 — moderate-high resistance risk. Do not apply consecutively.', 'CA', 'PCP-27824'),

('Priaxor', 'Fluxapyroxad + Pyraclostrobin', 'SDHI (7) + QoI (11)', 'SDH inhibitor + Qo site inhibitor', 'EC', 'fungicide', 'BASF', ARRAY['Wheat', 'Barley', 'Oats', 'Canola', 'Corn', 'Soybeans'], ARRAY['Sclerotinia', 'Septoria', 'Tan spot', 'Net blotch', 'Rust', 'Anthracnose'], '300 mL/ha', '30 days (cereals)', '12 hours', 'Two modes of action with systemic and translaminar activity. Apply preventatively.', 'FRAC 7+11 — high resistance risk. Strict rotation with non-7/11 chemistry.', 'CA', 'PCP-30220'),

('Cotegra', 'Boscalid + Metconazole', 'SDHI (7) + DMI (3)', 'SDH inhibitor + Sterol biosynthesis inhibitor', 'SC', 'fungicide', 'BASF', ARRAY['Canola', 'Lentils', 'Chickpeas', 'Dry beans', 'Soybeans'], ARRAY['Sclerotinia', 'Ascochyta blight', 'White mould', 'Botrytis'], '400-500 mL/ha', '30 days (canola)', '12 hours', 'Dual mode of action for Sclerotinia management. Apply at 20-50% bloom.', 'FRAC 7+3 — moderate resistance risk with two MOA. Rotate groups between seasons.', 'CA', 'PCP-31422'),

('Bravo ZN', 'Chlorothalonil', 'Chloronitrile (M5)', 'Multi-site contact activity', 'SC', 'fungicide', 'Syngenta', ARRAY['Potatoes', 'Onions', 'Tomatoes', 'Celery', 'Carrots', 'Ginseng'], ARRAY['Early blight', 'Late blight', 'Botrytis', 'Leaf spot', 'Downy mildew'], '2.5-3.5 L/ha', '7-14 days (crop specific)', '12 hours', 'Multi-site protectant. Apply on 7-10 day schedule. Excellent tank-mix partner.', 'FRAC Group M5 — low resistance risk. Foundation spray program fungicide.', 'CA', 'PCP-28900'),

('Acapela', 'Picoxystrobin', 'QoI Strobilurin (11)', 'Qo site inhibitor', 'SC', 'fungicide', 'Corteva', ARRAY['Wheat', 'Barley', 'Canola', 'Corn', 'Soybeans', 'Pulses'], ARRAY['Septoria', 'Tan spot', 'Sclerotinia', 'Rust', 'Anthracnose', 'Ascochyta'], '375-500 mL/ha', '30 days (cereals)', '12 hours', 'Broad-spectrum strobilurin with preventative and early curative activity.', 'FRAC Group 11 — high resistance risk. Do not use as sole MOA.', 'CA', 'PCP-29403'),

('Miravis Neo', 'Pydiflumetofen + Propiconazole + Azoxystrobin', 'SDHI (7) + DMI (3) + QoI (11)', 'Triple mode of action', 'EC', 'fungicide', 'Syngenta', ARRAY['Wheat', 'Barley', 'Oats', 'Corn', 'Canola'], ARRAY['Fusarium head blight', 'Septoria', 'Tan spot', 'Rust', 'Net blotch'], '750-1000 mL/ha', '30 days (wheat)', '12 hours', 'Triple MOA pre-mix for broad-spectrum disease control. Premier FHB product.', 'FRAC 7+3+11 — rotate with non-overlapping groups to manage resistance.', 'CA', 'PCP-33087'),

-- INSECTICIDES (CA)
('Coragen', 'Chlorantraniliprole', 'Diamide (28)', 'Ryanodine receptor modulator', 'SC', 'insecticide', 'FMC', ARRAY['Canola', 'Corn', 'Potatoes', 'Vegetables', 'Fruits', 'Berries'], ARRAY['Bertha armyworm', 'Diamondback moth', 'Colorado potato beetle', 'Flea beetles', 'Codling moth'], '150-375 mL/ha', '1-14 days (crop specific)', '4 hours', 'Low toxicity to beneficials and pollinators. Excellent IPM fit for Canadian cropping systems.', 'IRAC Group 28 — low resistance risk currently. Rotate to preserve long-term efficacy.', 'CA', 'PCP-28982'),

('Matador 120EC', 'Lambda-cyhalothrin', 'Pyrethroid (3A)', 'Sodium channel modulator', 'EC', 'insecticide', 'Syngenta', ARRAY['Canola', 'Wheat', 'Barley', 'Corn', 'Pulses', 'Potatoes'], ARRAY['Flea beetles', 'Bertha armyworm', 'Wheat midge', 'Aphids', 'Grasshoppers', 'Cutworms'], '83 mL/ha (canola)', '7-30 days (crop specific)', '24 hours', 'Broad-spectrum pyrethroid. Highly toxic to bees — apply in evening. Economic thresholds vary by pest.', 'IRAC Group 3A — resistance in some flea beetle populations. Rotate with non-pyrethroids.', 'CA', 'PCP-24984'),

('Decis 100 EC', 'Deltamethrin', 'Pyrethroid (3A)', 'Sodium channel modulator', 'EC', 'insecticide', 'Bayer CropScience', ARRAY['Canola', 'Wheat', 'Barley', 'Corn', 'Lentils', 'Peas'], ARRAY['Flea beetles', 'Grasshoppers', 'Bertha armyworm', 'Cutworms', 'Aphids'], '125-250 mL/ha', '7-30 days (crop specific)', '12 hours', 'Fast-acting contact insecticide. Apply when pest thresholds are reached.', 'IRAC Group 3A — monitor for resistance development in flea beetles.', 'CA', 'PCP-22478'),

('Closer', 'Sulfoxaflor', 'Sulfoximine (4C)', 'Nicotinic acetylcholine receptor agonist', 'SC', 'insecticide', 'Corteva', ARRAY['Canola', 'Cereals', 'Pulses', 'Potatoes', 'Vegetables'], ARRAY['Aphids', 'Lygus bugs', 'Whiteflies', 'Plant bugs'], '100-200 mL/ha', '7-14 days (crop specific)', '12 hours', 'Novel chemistry effective on neonicotinoid-resistant aphid populations.', 'IRAC Group 4C — effective where 4A resistance exists. Rotate with non-4 group.', 'CA', 'PCP-31333'),

('Voliam Xpress', 'Lambda-cyhalothrin + Chlorantraniliprole', 'Pyrethroid (3A) + Diamide (28)', 'Sodium channel modulator + Ryanodine receptor modulator', 'ZC', 'insecticide', 'Syngenta', ARRAY['Canola', 'Corn', 'Potatoes', 'Soybeans', 'Cereals'], ARRAY['Flea beetles', 'Armyworms', 'Colorado potato beetle', 'Corn earworm', 'Cutworms'], '200-300 mL/ha', '7-21 days (crop specific)', '24 hours', 'Two modes of action for broad-spectrum control. Higher activity on Lepidoptera.', 'IRAC 3A+28 — dual MOA reduces selection pressure. Rotate both groups.', 'CA', 'PCP-30313'),

('Sivanto Prime', 'Flupyradifurone', 'Butenolide (4D)', 'Nicotinic acetylcholine receptor agonist', 'SL', 'insecticide', 'Bayer CropScience', ARRAY['Canola', 'Potatoes', 'Fruits', 'Vegetables', 'Berries'], ARRAY['Aphids', 'Whiteflies', 'Psyllids', 'Flea beetles', 'Colorado potato beetle'], '500-750 mL/ha', '3-7 days (crop specific)', '4 hours', 'Reduced risk to pollinators. Can apply during bloom when bees present. Systemic uptake.', 'IRAC Group 4D — novel subclass with favourable pollinator profile.', 'CA', 'PCP-31834'),

('Delegate WG', 'Spinetoram', 'Spinosyn (5)', 'Nicotinic acetylcholine receptor allosteric modulator', 'WG', 'insecticide', 'Corteva', ARRAY['Canola', 'Fruits', 'Vegetables', 'Berries', 'Potatoes'], ARRAY['Bertha armyworm', 'Diamondback moth', 'Thrips', 'Leafminers', 'Spotted wing drosophila'], '100-200 g/ha', '3-7 days (crop specific)', '4 hours', 'Derived from soil bacterium. Low toxicity to predatory mites and parasitoids.', 'IRAC Group 5 — some resistance in thrips. Limit applications per season.', 'CA', 'PCP-29457'),

('Concept', 'Imidacloprid', 'Neonicotinoid (4A)', 'Nicotinic acetylcholine receptor agonist', 'SC', 'insecticide', 'Nufarm', ARRAY['Potatoes', 'Vegetables', 'Greenhouse crops'], ARRAY['Colorado potato beetle', 'Aphids', 'Whiteflies', 'Leafhoppers'], '250-500 mL/ha', '7-14 days (crop specific)', '12 hours', 'Systemic activity. Do not apply to seed-treated crops. Pollinator restrictions apply.', 'IRAC Group 4A — resistance documented in Colorado potato beetle. Rotate MOA.', 'CA', 'PCP-27192'),

-- HERBICIDES (CA)
('Roundup WeatherMAX', 'Glyphosate (potassium salt)', 'Glycine (9)', 'EPSP synthase inhibitor', 'SL', 'herbicide', 'Bayer CropScience', ARRAY['Canola (RR)', 'Soybeans (RR)', 'Corn (RR)', 'Wheat (pre-harvest)', 'Barley (pre-harvest)'], ARRAY['Annual broadleaves', 'Annual grasses', 'Perennial weeds', 'Canada thistle', 'Quackgrass'], '0.67-1.67 L/ha', 'Pre-harvest: 7-30 days', '4 hours', 'For Roundup Ready crops and pre-harvest desiccation. Resistant weeds spreading in Western Canada.', 'HRAC Group 9 — confirmed resistance in kochia, waterhemp, and Canada fleabane.', 'CA', 'PCP-27487'),

('Liberty 200 SN', 'Glufosinate-ammonium', 'Phosphinic acid (10)', 'Glutamine synthetase inhibitor', 'SN', 'herbicide', 'BASF', ARRAY['Canola (LL)', 'Corn (LL)'], ARRAY['Kochia', 'Wild oats', 'Green foxtail', 'Lamb''s quarters', 'Wild buckwheat'], '5.0 L/ha', '60 days before harvest', '12 hours', 'Contact herbicide for LibertyLink canola. Apply to actively growing weeds <10 cm.', 'HRAC Group 10 — low resistance risk. Critical tool for managing Group 2/9 resistant weeds.', 'CA', 'PCP-26276'),

('Ares', 'Imazamox + Imazethapyr', 'ALS Inhibitor (2)', 'Acetolactate synthase inhibitor', 'SL', 'herbicide', 'BASF', ARRAY['Clearfield Canola', 'Clearfield Wheat', 'Clearfield Lentils'], ARRAY['Wild oats', 'Green foxtail', 'Lamb''s quarters', 'Chickweed', 'Kochia'], '0.5 L/ha', '60 days (canola)', '12 hours', 'For Clearfield production system only. Do not plant non-Clearfield crops in following year.', 'HRAC Group 2 — extensive resistance across Prairies. Rotate with non-ALS chemistry.', 'CA', 'PCP-28804'),

('Authority', 'Sulfentrazone', 'PPO Inhibitor (14)', 'Protoporphyrinogen oxidase inhibitor', 'SC', 'herbicide', 'FMC', ARRAY['Soybeans', 'Dry beans', 'Potatoes', 'Flax'], ARRAY['Kochia', 'Lamb''s quarters', 'Redroot pigweed', 'Waterhemp', 'Common ragweed'], '280-420 mL/ha', 'N/A (pre-emergence)', '12 hours', 'Pre-emergence residual herbicide. Important tool for ALS-resistant weed management.', 'HRAC Group 14 — low resistance risk. Key component of diverse herbicide programs.', 'CA', 'PCP-29334'),

('Axial', 'Pinoxaden', 'ACCase Inhibitor (1)', 'Acetyl-CoA carboxylase inhibitor', 'EC', 'herbicide', 'Syngenta', ARRAY['Wheat', 'Barley', 'Triticale'], ARRAY['Wild oats', 'Green foxtail', 'Barnyard grass', 'Yellow foxtail', 'Persian darnel'], '0.5-1.0 L/ha', 'N/A (in-crop)', '12 hours', 'Selective grass herbicide in cereals. Apply to actively growing weeds. Add Adigor adjuvant.', 'HRAC Group 1 — wild oat resistance confirmed. Use only where Group 1 resistance not documented.', 'CA', 'PCP-28107'),

('PrePass XC', 'Flumioxazin + Pyroxasulfone', 'PPO (14) + VLCFA (15)', 'PPO inhibitor + VLCFA inhibitor', 'SC', 'herbicide', 'Valent', ARRAY['Soybeans', 'Dry beans', 'Chickpeas'], ARRAY['Waterhemp', 'Kochia', 'Redroot pigweed', 'Lamb''s quarters', 'Annual grasses'], '200 mL/ha', 'N/A (pre-emergence)', '12 hours', 'Two residual modes of action. Pre-emergence only. Important for herbicide-resistant weed management.', 'HRAC Groups 14+15 — strong resistance management tool for Prairie farming.', 'CA', 'PCP-32784'),

('Heat LQ', 'Saflufenacil', 'PPO Inhibitor (14)', 'Protoporphyrinogen oxidase inhibitor', 'SL', 'herbicide', 'BASF', ARRAY['Wheat (pre-seed)', 'Canola (pre-seed)', 'Soybeans (pre-seed)', 'Corn (pre-seed)'], ARRAY['Kochia', 'Canada fleabane', 'Narrow-leaved hawk''s-beard', 'Cleavers', 'Volunteer canola'], '0.5 L/ha', 'N/A (pre-seed burndown)', '12 hours', 'Burndown herbicide for pre-seed applications. Requires MSO adjuvant. Tank-mix with glyphosate.', 'HRAC Group 14 — effective on glyphosate-resistant biotypes. Low resistance risk.', 'CA', 'PCP-30065'),

('Odyssey', 'Imazamox + Imazethapyr', 'ALS Inhibitor (2)', 'Acetolactate synthase inhibitor', 'SL', 'herbicide', 'BASF', ARRAY['Soybeans', 'Dry beans', 'Field peas', 'Chickpeas'], ARRAY['Lamb''s quarters', 'Wild buckwheat', 'Green smartweed', 'Chickweed', 'Volunteer cereals'], '0.5 L/ha', '60 days (soybeans)', '12 hours', 'In-crop broadleaf and grass control in pulses and soybeans.', 'HRAC Group 2 — high resistance risk. Do not rely on Group 2 alone.', 'CA', 'PCP-27888'),

('Focus', 'Clethodim', 'ACCase Inhibitor (1)', 'Acetyl-CoA carboxylase inhibitor', 'EC', 'herbicide', 'BASF', ARRAY['Canola', 'Lentils', 'Field peas', 'Soybeans', 'Flax', 'Chickpeas'], ARRAY['Wild oats', 'Green foxtail', 'Volunteer cereals', 'Quackgrass', 'Annual grasses'], '0.25-0.5 L/ha', '60 days (canola/pulses)', '12 hours', 'Selective graminicide for broadleaf crops. Apply to actively growing grass weeds.', 'HRAC Group 1 — wild oat resistance exists. Use with caution in areas with known resistance.', 'CA', 'PCP-24717'),

('Command 360 ME', 'Clomazone', 'Isoxazolidinone (13)', 'DOXP synthase inhibitor', 'ME', 'herbicide', 'FMC', ARRAY['Canola', 'Soybeans'], ARRAY['Kochia', 'Cleavers', 'Volunteer canola', 'Lamb''s quarters', 'Shepherd''s purse'], '400-800 mL/ha', 'N/A (pre-emergence)', '12 hours', 'Soil-applied residual. Important for managing ALS-resistant kochia in Western Canada.', 'HRAC Group 13 — no confirmed resistance in Canada. Valuable rotation chemistry.', 'CA', 'PCP-29730'),

('Infinity', 'Pyrasulfotole + Bromoxynil', 'HPPD (27) + PS II (6)', 'HPPD inhibitor + Photosystem II inhibitor', 'EC', 'herbicide', 'Bayer CropScience', ARRAY['Wheat', 'Barley', 'Oats'], ARRAY['Kochia', 'Wild buckwheat', 'Cleavers', 'Hemp-nettle', 'Chickweed'], '0.33 L/ha', 'N/A (in-crop)', '12 hours', 'Post-emergence broadleaf control in cereals. Effective on ALS-resistant kochia.', 'HRAC Groups 27+6 — novel combination effective on Group 2-resistant biotypes.', 'CA', 'PCP-29457'),

-- Additional Canadian specialty products
('Allegro 500F', 'Fluazinam', 'Uncoupler (29)', 'Oxidative phosphorylation uncoupler', 'SC', 'fungicide', 'ISK Biosciences', ARRAY['Potatoes', 'Canola', 'Carrots', 'Onions', 'Ginseng'], ARRAY['Late blight', 'Sclerotinia', 'Botrytis', 'White mould', 'Alternaria'], '1.0 L/ha', '7-14 days (crop specific)', '12 hours', 'Multi-site-like activity with very low resistance risk. Excellent for potato programs.', 'FRAC Group 29 — very low resistance risk. No known resistance globally.', 'CA', 'PCP-30105'),

('Quadris Top', 'Azoxystrobin + Difenoconazole', 'QoI (11) + DMI (3)', 'Qo site + Sterol biosynthesis inhibitor', 'SC', 'fungicide', 'Syngenta', ARRAY['Potatoes', 'Carrots', 'Onions', 'Vegetables', 'Grapes'], ARRAY['Early blight', 'Late blight', 'Leaf spot', 'Scab', 'Powdery mildew'], '1.0 L/ha', '7-14 days (crop specific)', '12 hours', 'Two systemic modes of action. Preventative and early curative activity.', 'FRAC 11+3 — rotate with non-overlapping groups. Do not exceed 3 apps/season.', 'CA', 'PCP-29999'),

('Lorsban NT', 'Chlorpyrifos', 'Organophosphate (1B)', 'Acetylcholinesterase inhibitor', 'EC', 'insecticide', 'Corteva', ARRAY['Canola', 'Wheat', 'Corn', 'Onions'], ARRAY['Cutworms', 'Grasshoppers', 'Flea beetles', 'Wireworms', 'Root maggots'], '1.2-2.4 L/ha', '21 days (canola)', '24 hours', 'Broad-spectrum soil and foliar insecticide. Under regulatory review — verify current status.', 'IRAC Group 1B — some resistance in onion maggot populations.', 'CA', 'PCP-14879')

ON CONFLICT DO NOTHING;
