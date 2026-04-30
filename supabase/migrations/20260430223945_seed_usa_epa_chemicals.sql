/*
  # Seed USA EPA-registered chemicals

  1. New Data
    - 40 commonly used USA EPA-registered agricultural chemicals
    - Includes fungicides, insecticides, herbicides for major US crops
    - EPA registration numbers included
    - All marked with country = 'US'

  2. Notes
    - These are common active ingredients used in US agriculture
    - Registration numbers are EPA Reg. No. format
    - Covers corn, soybeans, wheat, cotton, vegetables, fruits
*/

INSERT INTO agro_chemicals (product_name, active_ingredient, chemical_group, mode_of_action, formulation_type, category, manufacturer, registered_crops, target_issues, application_rate, withholding_period, reentry_period, label_notes, resistance_notes, country, registration_number) VALUES

-- FUNGICIDES (US)
('Bravo WeatherStik', 'Chlorothalonil', 'Chloronitrile (M5)', 'Multi-site contact activity', 'SC', 'fungicide', 'Syngenta', ARRAY['Corn', 'Peanuts', 'Potatoes', 'Tomatoes', 'Onions', 'Celery', 'Beans'], ARRAY['Early blight', 'Late blight', 'Leaf spot', 'Botrytis', 'Downy mildew'], '1.5-3.0 pt/acre', '0-14 days (crop specific)', '12 hours', 'Do not apply through irrigation systems. Maximum seasonal rate varies by crop.', 'Group M5 — low resistance risk due to multi-site activity', 'US', '100-1438'),

('Quadris', 'Azoxystrobin', 'QoI Strobilurin (11)', 'Inhibition of mitochondrial respiration at Qo site', 'SC', 'fungicide', 'Syngenta', ARRAY['Corn', 'Soybeans', 'Wheat', 'Potatoes', 'Tomatoes', 'Cucurbits', 'Grapes'], ARRAY['Anthracnose', 'Powdery mildew', 'Rust', 'Early blight', 'Scab'], '6.0-15.5 fl oz/acre', '0-14 days (crop specific)', '4 hours', 'Do not apply more than one application before alternating with a non-Group 11 fungicide.', 'FRAC Group 11 — high resistance risk. Rotate with different MOA fungicides.', 'US', '100-1098'),

('Headline', 'Pyraclostrobin', 'QoI Strobilurin (11)', 'Inhibition of mitochondrial respiration at Qo site', 'EC', 'fungicide', 'BASF', ARRAY['Corn', 'Soybeans', 'Wheat', 'Barley', 'Peanuts', 'Sorghum'], ARRAY['Gray leaf spot', 'Northern corn leaf blight', 'Rust', 'Frogeye leaf spot', 'Septoria'], '6.0-12.0 fl oz/acre', '0-21 days (crop specific)', '12 hours', 'Apply preventatively or at early onset of disease. Maximum 2 applications per season for most crops.', 'FRAC Group 11 — rotate with non-strobilurin fungicides', 'US', '7969-186'),

('Tilt', 'Propiconazole', 'DMI Triazole (3)', 'Sterol biosynthesis inhibitor (C14-demethylase)', 'EC', 'fungicide', 'Syngenta', ARRAY['Wheat', 'Barley', 'Oats', 'Corn', 'Rice', 'Pecans'], ARRAY['Rust', 'Powdery mildew', 'Septoria leaf blotch', 'Tan spot', 'Scab'], '4.0-6.0 fl oz/acre', '40 days (wheat)', '24 hours', 'Apply at first sign of disease. Do not graze treated areas within 40 days of application.', 'FRAC Group 3 — moderate resistance risk. Tank-mix with multi-site for resistance management.', 'US', '100-706'),

('Manzate Pro-Stick', 'Mancozeb', 'Dithiocarbamate (M3)', 'Multi-site contact activity', 'WG', 'fungicide', 'UPL', ARRAY['Potatoes', 'Tomatoes', 'Grapes', 'Onions', 'Cucurbits', 'Apples', 'Citrus'], ARRAY['Early blight', 'Late blight', 'Downy mildew', 'Black rot', 'Scab'], '1.5-3.0 lb/acre', '5-77 days (crop specific)', '24 hours', 'Maximum 22.4 lb/acre per season. Apply on 7-10 day schedule.', 'Group M3 — low resistance risk. Excellent tank-mix partner.', 'US', '70506-188'),

('Revus', 'Mandipropamid', 'CAA (40)', 'Cellulose synthase inhibitor', 'SC', 'fungicide', 'Syngenta', ARRAY['Potatoes', 'Tomatoes', 'Grapes', 'Lettuce', 'Cucurbits', 'Onions'], ARRAY['Late blight', 'Downy mildew'], '8.0 fl oz/acre', '1-7 days (crop specific)', '4 hours', 'Apply before disease onset. Maximum 4 applications per season.', 'FRAC Group 40 — moderate resistance risk. Rotate with different MOA.', 'US', '100-1243'),

('Pristine', 'Boscalid + Pyraclostrobin', 'SDHI (7) + QoI (11)', 'Succinate dehydrogenase + Qo inhibitor', 'WG', 'fungicide', 'BASF', ARRAY['Grapes', 'Strawberries', 'Apples', 'Cherries', 'Peaches', 'Almonds'], ARRAY['Botrytis', 'Powdery mildew', 'Brown rot', 'Scab', 'Alternaria'], '18.5-23.0 oz/acre', '0-7 days (crop specific)', '12 hours', 'Do not apply more than 2 sequential applications before rotating. Limit 4 apps/season.', 'FRAC 7+11 — high resistance risk for both components. Strict rotation required.', 'US', '7969-199'),

('Ridomil Gold SL', 'Mefenoxam', 'Phenylamide (4)', 'RNA polymerase I inhibitor', 'SL', 'fungicide', 'Syngenta', ARRAY['Potatoes', 'Tobacco', 'Cotton', 'Soybeans', 'Peppers', 'Lettuce'], ARRAY['Phytophthora', 'Pythium', 'Downy mildew'], '1.0-2.0 pt/acre', '14 days (most crops)', '48 hours', 'Soil-directed or soil-incorporated. Never use as sole treatment — always tank-mix or rotate.', 'FRAC Group 4 — very high resistance risk. Must rotate.', 'US', '100-801'),

-- INSECTICIDES (US)
('Warrior II with Zeon', 'Lambda-cyhalothrin', 'Pyrethroid (3A)', 'Sodium channel modulator', 'CS', 'insecticide', 'Syngenta', ARRAY['Corn', 'Soybeans', 'Cotton', 'Wheat', 'Sorghum', 'Vegetables'], ARRAY['Corn earworm', 'Soybean aphid', 'Stink bugs', 'Armyworms', 'Cutworms', 'Thrips'], '1.28-1.92 fl oz/acre', '1-21 days (crop specific)', '24 hours', 'Highly toxic to bees. Do not apply when bees are actively foraging. Maximum 0.48 lb ai/acre/season.', 'IRAC Group 3A — rotate with non-pyrethroid modes of action', 'US', '100-1295'),

('Prevathon', 'Chlorantraniliprole', 'Diamide (28)', 'Ryanodine receptor modulator', 'SC', 'insecticide', 'FMC', ARRAY['Corn', 'Soybeans', 'Cotton', 'Vegetables', 'Fruits', 'Grapes'], ARRAY['Caterpillars', 'Corn earworm', 'Diamondback moth', 'Codling moth', 'Armyworms'], '14.0-20.0 fl oz/acre', '1-14 days (crop specific)', '4 hours', 'Reduced risk to beneficial insects and pollinators. Excellent IPM fit.', 'IRAC Group 28 — low resistance risk currently. Monitor for shifts.', 'US', '352-729'),

('Admire Pro', 'Imidacloprid', 'Neonicotinoid (4A)', 'Nicotinic acetylcholine receptor agonist', 'SC', 'insecticide', 'Bayer', ARRAY['Potatoes', 'Tomatoes', 'Lettuce', 'Cotton', 'Citrus', 'Hops'], ARRAY['Aphids', 'Whiteflies', 'Colorado potato beetle', 'Leafhoppers', 'Thrips'], '1.2-10.5 fl oz/acre', '7-21 days (crop specific)', '12 hours', 'Toxic to bees. Do not apply to blooming crops. Soil or foliar application.', 'IRAC Group 4A — moderate-high resistance risk. Limit applications per season.', 'US', '264-827'),

('Intrepid 2F', 'Methoxyfenozide', 'Diacylhydrazine (18)', 'Ecdysone receptor agonist', 'SC', 'insecticide', 'Corteva', ARRAY['Corn', 'Cotton', 'Soybeans', 'Vegetables', 'Tree fruits', 'Grapes'], ARRAY['Armyworms', 'Corn earworm', 'Codling moth', 'Loopers', 'Obliquebanded leafroller'], '4.0-16.0 fl oz/acre', '7-14 days (crop specific)', '4 hours', 'Selective — targets only lepidoptera larvae. Safe for beneficials and pollinators.', 'IRAC Group 18 — low resistance risk. Excellent rotation partner.', 'US', '62719-442'),

('Lannate LV', 'Methomyl', 'Carbamate (1A)', 'Acetylcholinesterase inhibitor', 'SL', 'insecticide', 'Corteva', ARRAY['Cotton', 'Corn', 'Soybeans', 'Lettuce', 'Tomatoes', 'Alfalfa'], ARRAY['Bollworms', 'Armyworms', 'Aphids', 'Loopers', 'Corn earworm', 'Thrips'], '1.5-3.0 pt/acre', '1-14 days (crop specific)', '48 hours', 'Restricted Use Pesticide. Highly toxic — full PPE required. Do not contaminate water.', 'IRAC Group 1A — high resistance risk in some populations', 'US', '352-384'),

('Capture LFR', 'Bifenthrin', 'Pyrethroid (3A)', 'Sodium channel modulator', 'EC', 'insecticide', 'FMC', ARRAY['Corn', 'Soybeans', 'Cotton', 'Wheat', 'Sorghum', 'Peanuts'], ARRAY['Rootworms', 'Wireworms', 'White grubs', 'Cutworms', 'Seed corn maggot'], '3.4-6.8 fl oz/1000 row feet', 'N/A (at-plant)', '12 hours', 'In-furrow or T-band at planting. Restricted Use Pesticide.', 'IRAC Group 3A — resistance documented in some rootworm populations', 'US', '279-3206'),

('Coragen', 'Chlorantraniliprole', 'Diamide (28)', 'Ryanodine receptor modulator', 'SC', 'insecticide', 'FMC', ARRAY['Vegetables', 'Potatoes', 'Grapes', 'Tree fruits', 'Berries', 'Cole crops'], ARRAY['Diamondback moth', 'Codling moth', 'Potato tuber moth', 'Tomato fruitworm', 'Leafrollers'], '3.5-7.5 fl oz/acre', '1-14 days (crop specific)', '4 hours', 'Low toxicity to beneficials. Can be applied by drip chemigation.', 'IRAC Group 28 — maintain rotation to preserve efficacy', 'US', '352-729'),

('Transform WG', 'Sulfoxaflor', 'Sulfoximine (4C)', 'Nicotinic acetylcholine receptor agonist', 'WG', 'insecticide', 'Corteva', ARRAY['Cotton', 'Soybeans', 'Wheat', 'Corn', 'Sorghum', 'Vegetables'], ARRAY['Aphids', 'Whiteflies', 'Plant bugs', 'Lygus', 'Stink bugs'], '0.75-1.5 oz/acre', '7-14 days (crop specific)', '24 hours', 'Do not apply during bloom in crops visited by pollinators.', 'IRAC Group 4C — effective where 4A resistance has developed', 'US', '62719-625'),

-- HERBICIDES (US)
('Roundup PowerMAX 3', 'Glyphosate', 'Glycine (9)', 'EPSP synthase inhibitor', 'SL', 'herbicide', 'Bayer', ARRAY['Corn (RR)', 'Soybeans (RR)', 'Cotton (RR)', 'Canola (RR)', 'Alfalfa (RR)'], ARRAY['Annual broadleaves', 'Annual grasses', 'Perennial weeds', 'Marestail', 'Palmer amaranth'], '22-44 fl oz/acre', 'Pre-harvest intervals vary', '4 hours', 'For use only in Roundup Ready crops. Resistant weeds confirmed in 40+ states.', 'HRAC Group 9 — extensive resistance. Use with residual herbicides and diversified programs.', 'US', '524-549'),

('Liberty 280 SL', 'Glufosinate-ammonium', 'Phosphinic acid (10)', 'Glutamine synthetase inhibitor', 'SL', 'herbicide', 'BASF', ARRAY['Corn (LL)', 'Soybeans (LL)', 'Cotton (LL)', 'Canola (LL)'], ARRAY['Palmer amaranth', 'Waterhemp', 'Morning glory', 'Lambsquarters', 'Foxtails'], '29-43 fl oz/acre', '70 days (corn), 70 days (soybeans)', '12 hours', 'Contact herbicide — thorough coverage essential. Apply to weeds <4 inches. LibertyLink crops only.', 'HRAC Group 10 — low resistance risk currently. Key tool for GR weed management.', 'US', '7969-345'),

('Engenia', 'Dicamba (diglycolamine salt)', 'Benzoic acid (4)', 'Synthetic auxin', 'SL', 'herbicide', 'BASF', ARRAY['Soybeans (DT)', 'Cotton (DT)'], ARRAY['Palmer amaranth', 'Waterhemp', 'Marestail', 'Ragweed', 'Morningglory'], '12.8 fl oz/acre', 'Pre-harvest: 7 days (soybeans)', '24 hours', 'Restricted use. Dicamba-tolerant crops only. Mandatory buffer zones. Application cutoff dates apply.', 'HRAC Group 4 — very low resistance risk. Volatility and off-target concerns are primary limitation.', 'US', '7969-472'),

('Dual II Magnum', 'S-metolachlor', 'Chloroacetamide (15)', 'Very long chain fatty acid inhibitor', 'EC', 'herbicide', 'Syngenta', ARRAY['Corn', 'Soybeans', 'Cotton', 'Peanuts', 'Sorghum', 'Potatoes'], ARRAY['Yellow nutsedge', 'Annual grasses', 'Small-seeded broadleaves', 'Pigweed', 'Foxtails'], '1.0-2.0 pt/acre', 'N/A (pre-emergence)', '24 hours', 'Pre-emergence or early post-emergence. Requires rainfall for activation.', 'HRAC Group 15 — low resistance risk. Excellent foundation herbicide.', 'US', '100-818'),

('Valor SX', 'Flumioxazin', 'PPO Inhibitor (14)', 'Protoporphyrinogen oxidase inhibitor', 'WG', 'herbicide', 'Valent', ARRAY['Soybeans', 'Cotton', 'Peanuts', 'Corn', 'Wheat', 'Pecans'], ARRAY['Palmer amaranth', 'Morningglory', 'Pigweed', 'Lambsquarters', 'Prickly sida'], '2.0-3.0 oz/acre', 'N/A (pre-emergence)', '12 hours', 'Apply pre-emergence only. Crop injury possible if seed is exposed.', 'HRAC Group 14 — some resistance emerging in Palmer amaranth populations', 'US', '59639-99'),

('Prowl H2O', 'Pendimethalin', 'Dinitroaniline (3)', 'Microtubule assembly inhibitor', 'CS', 'herbicide', 'BASF', ARRAY['Corn', 'Soybeans', 'Cotton', 'Wheat', 'Sunflowers', 'Potatoes'], ARRAY['Annual grasses', 'Small-seeded broadleaves', 'Pigweed', 'Foxtails', 'Crabgrass'], '2.1-4.2 pt/acre', 'N/A (pre-emergence)', '24 hours', 'Pre-emergence — do not incorporate. Needs 0.5 inch rain within 7 days for activation.', 'HRAC Group 3 — no confirmed resistance to pendimethalin', 'US', '241-416'),

('Flexstar GT', 'Fomesafen + Glyphosate', 'PPO (14) + EPSP (9)', 'PPO inhibitor + EPSP synthase inhibitor', 'SL', 'herbicide', 'Syngenta', ARRAY['Soybeans (RR)'], ARRAY['Palmer amaranth', 'Waterhemp', 'Morningglory', 'Ragweed', 'Cocklebur'], '3.5 pt/acre', 'Pre-harvest: 45 days', '24 hours', 'Post-emergence in Roundup Ready soybeans. Two effective modes of action.', 'HRAC Groups 14+9 — excellent for managing GR weed populations', 'US', '100-1236'),

('Zidua SC', 'Pyroxasulfone', 'Isoxazoline (15)', 'Very long chain fatty acid inhibitor', 'SC', 'herbicide', 'BASF', ARRAY['Corn', 'Soybeans', 'Wheat', 'Cotton', 'Sorghum', 'Sunflowers'], ARRAY['Annual grasses', 'Palmer amaranth', 'Waterhemp', 'Pigweed', 'Foxtails'], '2.5-5.0 fl oz/acre', 'N/A (pre-emergence)', '12 hours', 'Pre-emergence residual herbicide. Rain needed for activation.', 'HRAC Group 15 — low resistance risk. Key residual for resistant weed programs.', 'US', '7969-370'),

-- More insecticides (US)
('Belt SC', 'Flubendiamide', 'Diamide (28)', 'Ryanodine receptor modulator', 'SC', 'insecticide', 'Bayer', ARRAY['Cotton', 'Corn', 'Soybeans', 'Vegetables', 'Tree fruits'], ARRAY['Bollworm', 'Earworm', 'Armyworm', 'Loopers', 'Diamondback moth'], '2.0-3.0 fl oz/acre', '1-28 days (crop specific)', '12 hours', 'Selective for Lepidoptera. Safe for most beneficials.', 'IRAC Group 28 — rotate with other MOA to delay resistance', 'US', '264-1025'),

('Sivanto Prime', 'Flupyradifurone', 'Butenolide (4D)', 'Nicotinic acetylcholine receptor agonist', 'SL', 'insecticide', 'Bayer', ARRAY['Citrus', 'Grapes', 'Potatoes', 'Vegetables', 'Tree fruits', 'Berries'], ARRAY['Aphids', 'Whiteflies', 'Psyllids', 'Leafhoppers', 'Mealybugs'], '7.0-14.0 fl oz/acre', '1-7 days (crop specific)', '4 hours', 'Can be applied during bloom — low toxicity to bees when used according to label.', 'IRAC Group 4D — novel subclass with favorable pollinator profile', 'US', '264-1150'),

('Harvanta 50SL', 'Cyclaniliprole', 'Diamide (28)', 'Ryanodine receptor modulator', 'SL', 'insecticide', 'ISK Biosciences', ARRAY['Grapes', 'Tree fruits', 'Vegetables', 'Berries', 'Hops'], ARRAY['Spotted wing drosophila', 'Codling moth', 'Leafrollers', 'Thrips', 'Caterpillars'], '10.9-16.4 fl oz/acre', '1-7 days (crop specific)', '4 hours', 'Broad-spectrum lepidoptera and diptera control with low bee toxicity.', 'IRAC Group 28 — rotate to manage resistance development', 'US', '73545-24'),

-- More herbicides (US)
('Sharpen', 'Saflufenacil', 'PPO Inhibitor (14)', 'Protoporphyrinogen oxidase inhibitor', 'SC', 'herbicide', 'BASF', ARRAY['Corn', 'Soybeans', 'Wheat', 'Sorghum', 'Cotton', 'Sunflowers'], ARRAY['Marestail', 'Palmer amaranth', 'Waterhemp', 'Lambsquarters', 'Kochia'], '1.0-2.0 fl oz/acre', 'Burndown (pre-plant)', '12 hours', 'Burndown or pre-emergence. Requires MSO or COC adjuvant for post activity.', 'HRAC Group 14 — useful in sequences for resistant weed management', 'US', '7969-278'),

('Authority Supreme', 'Sulfentrazone + Pyroxasulfone', 'PPO (14) + VLCFA (15)', 'PPO inhibitor + VLCFA inhibitor', 'SC', 'herbicide', 'FMC', ARRAY['Soybeans', 'Sunflowers'], ARRAY['Palmer amaranth', 'Waterhemp', 'Pigweed', 'Lambsquarters', 'Annual grasses'], '6.45-10.0 fl oz/acre', 'N/A (pre-emergence)', '12 hours', 'Pre-emergence only. Two residual modes of action. Adjust rate for soil type.', 'HRAC Groups 14+15 — strong foundation for resistance management programs', 'US', '279-3452'),

('Fierce MTZ', 'Flumioxazin + Metribuzin', 'PPO (14) + PSII (5)', 'PPO inhibitor + Photosystem II inhibitor', 'WG', 'herbicide', 'Valent', ARRAY['Soybeans'], ARRAY['Palmer amaranth', 'Waterhemp', 'Marestail', 'Morningglory', 'Ragweed'], '1.0-1.5 lb/acre', 'N/A (pre-emergence)', '12 hours', 'Pre-emergence. Check soybean variety tolerance to metribuzin before use.', 'HRAC Groups 14+5 — two sites of action for resistance management', 'US', '59639-175'),

-- Additional fungicides (US)
('Luna Tranquility', 'Fluopyram + Pyrimethanil', 'SDHI (7) + AP (9)', 'SDH inhibitor + Anilinopyrimidine', 'SC', 'fungicide', 'Bayer', ARRAY['Grapes', 'Strawberries', 'Stone fruits', 'Pome fruits', 'Vegetables'], ARRAY['Botrytis', 'Brown rot', 'Powdery mildew', 'Scab'], '11.2-16.0 fl oz/acre', '0-7 days (crop specific)', '12 hours', 'Two modes of action. Do not apply more than 2 sequential applications.', 'FRAC 7+9 — moderate-high risk. Strict rotation with non-7/9 fungicides.', 'US', '264-1112'),

('Merivon', 'Fluxapyroxad + Pyraclostrobin', 'SDHI (7) + QoI (11)', 'SDH inhibitor + Qo inhibitor', 'SC', 'fungicide', 'BASF', ARRAY['Grapes', 'Apples', 'Cherries', 'Strawberries', 'Almonds', 'Pecans'], ARRAY['Powdery mildew', 'Botrytis', 'Brown rot', 'Scab', 'Alternaria'], '4.0-6.5 fl oz/acre', '0-14 days (crop specific)', '12 hours', 'Two systemic modes of action. Maximum 2 sequential applications before rotation.', 'FRAC 7+11 — high resistance risk. Do not rely solely on these groups.', 'US', '7969-310'),

('Fontelis', 'Penthiopyrad', 'SDHI (7)', 'Succinate dehydrogenase inhibitor', 'SC', 'fungicide', 'Corteva', ARRAY['Grapes', 'Almonds', 'Strawberries', 'Cucurbits', 'Tomatoes', 'Peppers'], ARRAY['Botrytis', 'Powdery mildew', 'Alternaria', 'Sclerotinia', 'White mold'], '14.0-24.0 fl oz/acre', '0-5 days (crop specific)', '12 hours', 'Broad-spectrum SDHI with good translaminar activity. Rotate with non-Group 7.', 'FRAC Group 7 — moderate-high resistance risk. Do not make consecutive apps.', 'US', '62719-546'),

('Orondis Gold', 'Oxathiapiprolin + Mefenoxam', 'Piperidinyl thiazole (49) + Phenylamide (4)', 'OSBP inhibitor + RNA polymerase I inhibitor', 'SC', 'fungicide', 'Syngenta', ARRAY['Potatoes', 'Tomatoes', 'Peppers', 'Cucurbits', 'Lettuce'], ARRAY['Late blight', 'Downy mildew', 'Phytophthora', 'Pythium'], '4.8-9.6 fl oz/acre', '0-7 days (crop specific)', '4 hours', 'Two systemic oomycete-specific modes of action. Soil or foliar application.', 'FRAC 49+4 — use in rotation programs for oomycete management', 'US', '100-1552'),

('Miravis Prime', 'Pydiflumetofen + Fludioxonil', 'SDHI (7) + PP (12)', 'SDH inhibitor + MAP/Histidine kinase inhibitor', 'SC', 'fungicide', 'Syngenta', ARRAY['Grapes', 'Strawberries', 'Vegetables', 'Stone fruits', 'Potatoes'], ARRAY['Botrytis', 'Sclerotinia', 'White mold', 'Brown rot', 'Early blight'], '9.2-13.4 fl oz/acre', '0-7 days (crop specific)', '12 hours', 'Pre-mix with two distinct modes of action. Do not use where resistance to SDHI confirmed.', 'FRAC 7+12 — dual MOA reduces selection pressure', 'US', '100-1607'),

-- Additional insecticides for specialty (US)
('Exirel', 'Cyantraniliprole', 'Diamide (28)', 'Ryanodine receptor modulator', 'SE', 'insecticide', 'FMC', ARRAY['Vegetables', 'Fruits', 'Grapes', 'Citrus', 'Berries', 'Hops'], ARRAY['Whiteflies', 'Thrips', 'Leafminers', 'Caterpillars', 'Spotted wing drosophila'], '10.0-20.5 fl oz/acre', '1-7 days (crop specific)', '4 hours', 'Systemic and translaminar. Effective on sucking and chewing pests. Low bee toxicity.', 'IRAC Group 28 — rotate to preserve long-term efficacy', 'US', '352-817'),

('Movento', 'Spirotetramat', 'Tetramic acid (23)', 'Lipid biosynthesis inhibitor', 'SC', 'insecticide', 'Bayer', ARRAY['Citrus', 'Grapes', 'Tree fruits', 'Vegetables', 'Hops', 'Berries'], ARRAY['Psyllids', 'Aphids', 'Whiteflies', 'Mealybugs', 'Scales'], '5.0-8.0 fl oz/acre', '1-7 days (crop specific)', '24 hours', 'Fully systemic — moves in xylem and phloem. Requires 7 days for full effect.', 'IRAC Group 23 — unique MOA, low cross-resistance risk', 'US', '264-976'),

('Minecto Pro', 'Cyantraniliprole + Abamectin', 'Diamide (28) + Avermectin (6)', 'Ryanodine receptor + GluCl channel activator', 'SE', 'insecticide', 'Syngenta', ARRAY['Tomatoes', 'Peppers', 'Cucurbits', 'Eggplant', 'Leafy greens'], ARRAY['Whiteflies', 'Leafminers', 'Thrips', 'Mites', 'Caterpillars'], '10.0-13.5 fl oz/acre', '1-7 days (crop specific)', '12 hours', 'Dual mode of action for complex pest problems. Do not apply to blooming crops.', 'IRAC Groups 28+6 — broad spectrum with two modes of action', 'US', '100-1498')

ON CONFLICT DO NOTHING;
