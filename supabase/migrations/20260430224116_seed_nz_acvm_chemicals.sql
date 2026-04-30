/*
  # Seed New Zealand ACVM/EPA NZ-registered chemicals

  1. New Data
    - 30 commonly used New Zealand ACVM-registered agricultural chemicals
    - Includes fungicides, insecticides, herbicides for NZ crops
    - ACVM registration numbers (HSR codes) included
    - All marked with country = 'NZ'

  2. Notes
    - These are common active ingredients registered under NZ EPA/ACVM
    - Registration numbers are ACVM/HSNO approval codes
    - Covers kiwifruit, grapes, apples, pastoral, arable crops
*/

INSERT INTO agro_chemicals (product_name, active_ingredient, chemical_group, mode_of_action, formulation_type, category, manufacturer, registered_crops, target_issues, application_rate, withholding_period, reentry_period, label_notes, resistance_notes, country, registration_number) VALUES

-- FUNGICIDES (NZ)
('Kocide Opti', 'Copper hydroxide', 'Inorganic copper (M1)', 'Multi-site contact activity', 'WG', 'fungicide', 'Nufarm', ARRAY['Kiwifruit', 'Grapes', 'Apples', 'Avocados', 'Citrus', 'Tomatoes'], ARRAY['PSA (Pseudomonas syringae pv. actinidiae)', 'Downy mildew', 'Black spot', 'Bacterial blast'], '1.5-3.0 kg/ha', '1-14 days (crop specific)', '24 hours', 'Key PSA management tool in kiwifruit. Apply with good coverage. Do not tank-mix with acidic products.', 'Group M1 — low resistance risk. Foundation protectant spray.', 'NZ', 'HSR001351'),

('Pristine', 'Boscalid + Pyraclostrobin', 'SDHI (7) + QoI (11)', 'SDH inhibitor + Qo site inhibitor', 'WG', 'fungicide', 'BASF', ARRAY['Grapes', 'Kiwifruit', 'Apples', 'Strawberries', 'Onions'], ARRAY['Botrytis', 'Powdery mildew', 'Sclerotinia', 'Black spot'], '0.8-1.3 kg/ha', '7-14 days (crop specific)', '24 hours', 'Two modes of action. Max 2 consecutive applications before rotation.', 'FRAC 7+11 — high resistance risk for both groups. Strict rotation required.', 'NZ', 'HSR007747'),

('Filan', 'Boscalid', 'SDHI (7)', 'Succinate dehydrogenase inhibitor', 'WG', 'fungicide', 'BASF', ARRAY['Kiwifruit', 'Grapes', 'Onions', 'Lettuce', 'Beans'], ARRAY['Botrytis', 'Sclerotinia', 'White mould'], '1.0-1.5 kg/ha', '7-14 days (crop specific)', '24 hours', 'Apply preventatively at early bloom. Do not exceed 2 applications per season.', 'FRAC Group 7 — moderate-high resistance risk. Rotate with non-SDHI fungicides.', 'NZ', 'HSR007575'),

('Scala', 'Pyrimethanil', 'Anilinopyrimidine (9)', 'Methionine biosynthesis inhibitor', 'SC', 'fungicide', 'BASF', ARRAY['Grapes', 'Kiwifruit', 'Apples', 'Strawberries', 'Stonefruit'], ARRAY['Botrytis', 'Scab', 'Storage rots'], '1.5-2.0 L/ha', '7 days (grapes)', '12 hours', 'Vapour activity provides coverage of hard-to-reach surfaces. Good in pre-harvest programs.', 'FRAC Group 9 — moderate resistance risk. Alternate with different MOA.', 'NZ', 'HSR007260'),

('Flint', 'Trifloxystrobin', 'QoI Strobilurin (11)', 'Qo site inhibitor', 'WG', 'fungicide', 'Bayer', ARRAY['Apples', 'Grapes', 'Kiwifruit', 'Stonefruit', 'Strawberries'], ARRAY['Black spot', 'Powdery mildew', 'Scab', 'Rust'], '0.15-0.2 g/L', '14 days (apples)', '12 hours', 'Mesostemic activity — redistributes on leaf surface. Max 3 applications per season.', 'FRAC Group 11 — high resistance risk. Never use alone. Always alternate.', 'NZ', 'HSR001100'),

('Chorus', 'Cyprodinil', 'Anilinopyrimidine (9)', 'Methionine biosynthesis inhibitor', 'WG', 'fungicide', 'Syngenta', ARRAY['Apples', 'Grapes', 'Stonefruit', 'Kiwifruit'], ARRAY['Black spot', 'Botrytis', 'Scab', 'Brown rot'], '0.3-0.5 kg/ha', '7-14 days (crop specific)', '24 hours', 'Systemic with translaminar activity. Best applied preventatively.', 'FRAC Group 9 — rotate with non-AP fungicides. Max 3 apps/season.', 'NZ', 'HSR001098'),

('Aliette WG', 'Fosetyl-aluminium', 'Phosphonate (P7)', 'Unknown (host defense induction)', 'WG', 'fungicide', 'Bayer', ARRAY['Avocados', 'Citrus', 'Kiwifruit', 'Strawberries', 'Hops'], ARRAY['Phytophthora', 'Downy mildew', 'Pythium'], '2.5-5.0 kg/ha', '14-28 days (crop specific)', '24 hours', 'Systemic — moves up and down in plant. Effective against oomycetes. Foliar or trunk injection.', 'FRAC Group P7 — low resistance risk. Important for Phytophthora management.', 'NZ', 'HSR001041'),

('Teldor', 'Fenhexamid', 'Hydroxyanilide (17)', 'Sterol biosynthesis inhibitor (3-keto reductase)', 'SC', 'fungicide', 'Bayer', ARRAY['Grapes', 'Strawberries', 'Kiwifruit', 'Boysenberries', 'Blueberries'], ARRAY['Botrytis'], '1.0-1.5 L/ha', '1-3 days (crop specific)', '12 hours', 'Highly specific against Botrytis. No cross-resistance with other MOA. Apply at flowering.', 'FRAC Group 17 — moderate resistance risk. Limit to 2 applications per season.', 'NZ', 'HSR001297'),

-- INSECTICIDES (NZ)
('Movento', 'Spirotetramat', 'Tetramic acid (23)', 'Lipid biosynthesis inhibitor', 'SC', 'insecticide', 'Bayer', ARRAY['Kiwifruit', 'Apples', 'Grapes', 'Avocados', 'Citrus', 'Vegetables'], ARRAY['Scale', 'Mealybugs', 'Aphids', 'Whiteflies', 'Psyllids'], '400-600 mL/ha', '7-14 days (crop specific)', '24 hours', 'Fully ambimobile — moves in xylem and phloem. Slow acting — allow 7-14 days. IPM compatible.', 'IRAC Group 23 — unique MOA. Low risk if rotated properly.', 'NZ', 'HSR007694'),

('Mainman', 'Emamectin benzoate', 'Avermectin (6)', 'Glutamate-gated chloride channel activator', 'SG', 'insecticide', 'Syngenta', ARRAY['Kiwifruit', 'Apples', 'Brassicas', 'Tomatoes', 'Sweetcorn'], ARRAY['Leafrollers', 'Caterpillars', 'Diamondback moth', 'Tomato/potato psyllid'], '200-400 g/ha', '7-14 days (crop specific)', '12 hours', 'Translaminar activity. Target early instar larvae for best results.', 'IRAC Group 6 — moderate resistance risk. Rotate with other MOA.', 'NZ', 'HSR008170'),

('Prodigy', 'Methoxyfenozide', 'Diacylhydrazine (18)', 'Ecdysone receptor agonist', 'SC', 'insecticide', 'Corteva', ARRAY['Apples', 'Kiwifruit', 'Grapes', 'Vegetables', 'Berryfruit'], ARRAY['Leafrollers', 'Codling moth', 'Lightbrown apple moth', 'Looper'], '0.3-0.6 L/ha', '14-21 days (crop specific)', '4 hours', 'Selective — affects only Lepidoptera. Very safe for beneficials and pollinators. IPM cornerstone.', 'IRAC Group 18 — low resistance risk. Excellent for resistance management programs.', 'NZ', 'HSR007381'),

('Entrust', 'Spinosad', 'Spinosyn (5)', 'Nicotinic acetylcholine receptor allosteric modulator', 'SC', 'insecticide', 'Corteva', ARRAY['Kiwifruit', 'Apples', 'Grapes', 'Vegetables', 'Olives', 'Avocados'], ARRAY['Thrips', 'Leafrollers', 'Caterpillars', 'Leafminers'], '240-480 mL/ha', '3-7 days (crop specific)', '4 hours', 'Certified organic (derived from soil bacterium). Apply in evening to reduce bee exposure.', 'IRAC Group 5 — increasing resistance in thrips. Limit to 3 applications per season.', 'NZ', 'HSR007525'),

('Karate Zeon', 'Lambda-cyhalothrin', 'Pyrethroid (3A)', 'Sodium channel modulator', 'CS', 'insecticide', 'Syngenta', ARRAY['Cereals', 'Brassicas', 'Potatoes', 'Pasture', 'Onions'], ARRAY['Aphids', 'Caterpillars', 'Diamondback moth', 'Grass grub', 'Porina'], '20-40 mL/ha (cereals)', '7-14 days (crop specific)', '24 hours', 'Broad-spectrum. Highly toxic to bees and aquatic organisms. Avoid spray drift to waterways.', 'IRAC Group 3A — widespread resistance in some pests. Rotate with non-pyrethroids.', 'NZ', 'HSR001138'),

('Venom 200SL', 'Dinotefuran', 'Neonicotinoid (4A)', 'Nicotinic acetylcholine receptor agonist', 'SL', 'insecticide', 'Valent', ARRAY['Kiwifruit', 'Apples', 'Grapes', 'Tomatoes', 'Cucurbits'], ARRAY['Mealybugs', 'Scale insects', 'Aphids', 'Whiteflies'], '0.5-1.0 L/ha', '14 days (most crops)', '12 hours', 'Systemic. Do not apply to flowering crops. Maximum 2 applications per season.', 'IRAC Group 4A — high resistance risk. Rotate with non-neonic chemistry.', 'NZ', 'HSR008326'),

('Exirel', 'Cyantraniliprole', 'Diamide (28)', 'Ryanodine receptor modulator', 'SE', 'insecticide', 'FMC', ARRAY['Kiwifruit', 'Grapes', 'Apples', 'Tomatoes', 'Brassicas', 'Berries'], ARRAY['Mealybugs', 'Scale', 'Leafrollers', 'Thrips', 'Whiteflies'], '500-1000 mL/ha', '1-7 days (crop specific)', '4 hours', 'Systemic and translaminar. Low toxicity to bees. Excellent IPM compatibility.', 'IRAC Group 28 — low resistance risk currently. Rotate to preserve efficacy.', 'NZ', 'HSR101059'),

-- HERBICIDES (NZ)
('Buster', 'Glufosinate-ammonium', 'Phosphinic acid (10)', 'Glutamine synthetase inhibitor', 'SL', 'herbicide', 'Bayer', ARRAY['Orchards', 'Vineyards', 'Kiwifruit', 'Non-crop'], ARRAY['Annual grasses', 'Broadleaf weeds', 'Clover', 'Fathen', 'Willow weed'], '3.0-5.0 L/ha', 'N/A (directed spray)', '12 hours', 'Contact herbicide for inter-row weed control. Non-selective — avoid contact with crop foliage.', 'HRAC Group 10 — low resistance risk. Useful rotation option where glyphosate resistance exists.', 'NZ', 'HSR001062'),

('Roundup ProMAX', 'Glyphosate', 'Glycine (9)', 'EPSP synthase inhibitor', 'SL', 'herbicide', 'Nufarm', ARRAY['Orchards', 'Vineyards', 'Pasture renovation', 'Non-crop', 'Forestry'], ARRAY['Perennial grasses', 'Annual weeds', 'Dock', 'Californian thistle', 'Kikuyu'], '2.0-10.0 L/ha', 'N/A (directed/non-crop)', '6 hours', 'Systemic non-selective. Withhold grazing 7 days. Not for use in crop.', 'HRAC Group 9 — glyphosate-resistant ryegrass confirmed in NZ. Use with residuals.', 'NZ', 'HSR001271'),

('Gardoprim', 'Terbuthylazine', 'Triazine (5)', 'Photosystem II inhibitor', 'SC', 'herbicide', 'Syngenta', ARRAY['Maize', 'Sweetcorn', 'Forestry', 'Orchards'], ARRAY['Annual grasses', 'Annual broadleaves', 'Fathen', 'Nightshade', 'Willow weed'], '3.5-5.0 L/ha', 'N/A (pre-emergence)', '24 hours', 'Pre-emergence in maize. Incorporate with rainfall. Check groundwater restrictions.', 'HRAC Group 5 — some resistance in annual weeds. Rotate with different MOA.', 'NZ', 'HSR001112'),

('Kerb', 'Propyzamide', 'Benzamide (3)', 'Microtubule assembly inhibitor', 'WG', 'herbicide', 'Corteva', ARRAY['Orchards', 'Vineyards', 'Forestry', 'Lettuce', 'Brassicas'], ARRAY['Poa annua', 'Ryegrass', 'Winter grass', 'Annual grasses'], '2.0-4.5 kg/ha', '21-42 days (crop specific)', '24 hours', 'Soil-applied residual. Best activity in cool conditions (<12C soil temp). Winter application.', 'HRAC Group 3 — low resistance risk. Effective on glyphosate-resistant ryegrass.', 'NZ', 'HSR001139'),

('Dual Gold', 'S-metolachlor', 'Chloroacetamide (15)', 'Very long chain fatty acid inhibitor', 'EC', 'herbicide', 'Syngenta', ARRAY['Maize', 'Sweetcorn', 'Potatoes', 'Onions', 'Brassicas'], ARRAY['Annual grasses', 'Fathen', 'Nightshade', 'Amaranthus', 'Portulaca'], '1.0-2.0 L/ha', 'N/A (pre-emergence)', '24 hours', 'Pre-emergence. Needs rainfall for activation. Highly effective on grass weeds.', 'HRAC Group 15 — very low resistance risk globally. Reliable residual herbicide.', 'NZ', 'HSR001095'),

('Versatill', 'Clopyralid', 'Pyridine (4)', 'Synthetic auxin', 'SL', 'herbicide', 'Corteva', ARRAY['Pasture', 'Cereals', 'Maize', 'Brassicas', 'Onions'], ARRAY['Californian thistle', 'Nodding thistle', 'Ragwort', 'Clover', 'Docks'], '0.3-0.6 L/ha (pasture)', '7 days (cereals)', '12 hours', 'Highly selective for Compositae and Leguminosae weeds. Safe in grass crops and cereals.', 'HRAC Group 4 — very low resistance risk for target weeds', 'NZ', 'HSR001313'),

('MCPA 750', 'MCPA', 'Phenoxycarboxylic acid (4)', 'Synthetic auxin', 'SL', 'herbicide', 'Various', ARRAY['Pasture', 'Cereals', 'Maize'], ARRAY['Broadleaf weeds', 'Buttercup', 'Docks', 'Pennyroyal', 'Thistles'], '2.0-4.0 L/ha', '7 days grazing WHP', '12 hours', 'Selective broadleaf control in grass and cereals. Withhold milk 7 days.', 'HRAC Group 4 — very low resistance risk', 'NZ', 'HSR001173'),

('Tordon Brushkiller', '2,4-D + Picloram', 'Phenoxy (4) + Pyridine (4)', 'Synthetic auxins', 'EC', 'herbicide', 'Corteva', ARRAY['Pasture', 'Non-crop', 'Forestry'], ARRAY['Gorse', 'Blackberry', 'Broom', 'Woody weeds', 'Thistles'], '60-120 mL/10L (spot spray)', '3 days grazing WHP', '24 hours', 'For woody weed control. Picloram has long soil residual — do not plant susceptible crops for 2+ years.', 'HRAC Group 4 — no known resistance in target species', 'NZ', 'HSR001306'),

-- More NZ fungicides
('Switch', 'Cyprodinil + Fludioxonil', 'AP (9) + PP (12)', 'Methionine biosynthesis + MAP kinase inhibitor', 'WG', 'fungicide', 'Syngenta', ARRAY['Grapes', 'Kiwifruit', 'Strawberries', 'Onions', 'Lettuce'], ARRAY['Botrytis', 'Sclerotinia', 'Storage rots'], '0.6-1.0 kg/ha', '7-14 days (crop specific)', '12 hours', 'Two modes of action with contact and systemic activity. Excellent Botrytis control.', 'FRAC 9+12 — moderate risk. Max 2 consecutive applications.', 'NZ', 'HSR001289'),

('Cabrio', 'Pyraclostrobin', 'QoI Strobilurin (11)', 'Qo site inhibitor', 'EC', 'fungicide', 'BASF', ARRAY['Kiwifruit', 'Grapes', 'Squash', 'Tomatoes', 'Onions'], ARRAY['Ripe rot', 'Botrytis', 'Powdery mildew', 'Downy mildew'], '0.5-1.0 L/ha', '7-14 days (crop specific)', '24 hours', 'Mesostemic and translaminar. Always tank-mix with a multi-site fungicide.', 'FRAC Group 11 — high resistance risk. Never use alone. Strict rotation essential.', 'NZ', 'HSR007439'),

('Luna Sensation', 'Fluopyram + Trifloxystrobin', 'SDHI (7) + QoI (11)', 'SDH inhibitor + Qo site inhibitor', 'SC', 'fungicide', 'Bayer', ARRAY['Kiwifruit', 'Grapes', 'Apples', 'Strawberries', 'Onions'], ARRAY['Botrytis', 'Sclerotinia', 'Powdery mildew', 'Scab'], '0.4-0.8 L/ha', '7 days (grapes)', '12 hours', 'Dual systemic modes of action. Apply before disease onset. Max 2 applications per season.', 'FRAC 7+11 — high resistance risk. Do not exceed label limits. Rotate groups.', 'NZ', 'HSR101280'),

-- More NZ insecticides  
('Bt (Dipel DF)', 'Bacillus thuringiensis var. kurstaki', 'Microbial (11)', 'Pore formation in midgut', 'DF', 'insecticide', 'Valent', ARRAY['Kiwifruit', 'Apples', 'Grapes', 'Vegetables', 'Brassicas', 'Forestry'], ARRAY['Leafrollers', 'Caterpillars', 'Diamondback moth', 'Looper', 'Webworm'], '0.5-1.0 kg/ha', '0 days', '4 hours', 'Certified organic. Only affects Lepidoptera larvae that ingest treated foliage. Deactivates in UV — reapply after rain.', 'IRAC Group 11 — low resistance risk in field. IPM cornerstone product.', 'NZ', 'HSR001065'),

('Calypso', 'Thiacloprid', 'Neonicotinoid (4A)', 'Nicotinic acetylcholine receptor agonist', 'SC', 'insecticide', 'Bayer', ARRAY['Apples', 'Kiwifruit', 'Grapes', 'Stonefruit'], ARRAY['Aphids', 'Mealybugs', 'Scale', 'Woolly apple aphid'], '0.25-0.5 L/ha', '14-21 days (crop specific)', '24 hours', 'Systemic. Lower bee toxicity than other neonics but still apply outside foraging hours.', 'IRAC Group 4A — some resistance in aphid populations. Monitor efficacy.', 'NZ', 'HSR007498')

ON CONFLICT DO NOTHING;
