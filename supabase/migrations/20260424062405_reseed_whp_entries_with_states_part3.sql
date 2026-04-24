/*
  # Re-seed WHP entries with per-state data (Part 3 — N to Z)
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes, application_notes, state, registered) VALUES

-- Oberon 240 SC (Spiromesifen) — national; 1 veg, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Vegetable', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Tomato', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Capsicum', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Cucumber', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Cotton', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Grape', 7, NULL, NULL, 'All', true),

-- Previcur Energy — national; 3 cucumber, 7 others
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Cucumber', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Capsicum', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Lettuce', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Strawberry', 7, NULL, NULL, 'All', true),

-- Rovral 500 SC (Iprodione) — national; 1 grape/stone fruit, 14 canola
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Grape', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Stone Fruit', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Strawberry', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Tomato', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Onion', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Barley', 14, NULL, NULL, 'All', true),

-- Signum WG — national; 3 veg, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Capsicum', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Tomato', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Bean', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Cucumber', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Strawberry', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Grape', 7, NULL, NULL, 'All', true),

-- Success 480 SC (Spinosad) — national; 1 veg, 7 fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Vegetable', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Citrus', 7, NULL, NULL, 'All', true),

-- Switch 62.5 WG (Cyprodinil + Fludioxonil) — national; 1 lettuce, 7 others
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Lettuce', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Strawberry', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Raspberry', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Blueberry', 7, NULL, NULL, 'All', true),

-- Tracer 480 SC (Spinosad) — national; 1 veg, 7 fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Vegetable', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Cotton', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Citrus', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Stone Fruit', 7, NULL, NULL, 'All', true),

-- Vertimec 18 EC (Abamectin) — national; 3 veg, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Vegetable', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Cotton', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Citrus', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Stone Fruit', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Grape', 7, NULL, NULL, 'All', true),

-- Remaining bulk inserts for chemicals with uniform national WHPs

-- Actellic 500 EC already done. Remaining national-uniform chemicals:
((SELECT id FROM agro_chemicals WHERE product_name = 'Ally Max'), 'Wheat', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ally Max'), 'Barley', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ally Max'), 'Pasture', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Oats', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Pasture', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Amitrole 250 SC'), 'Non-crop', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amitrole 250 SC'), 'Grape', 0, 'Under-vine only', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aphidius-based Biocontrol'), 'All registered crops', 0, 'Biological control', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Cotton', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Soybean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Canola', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Atrazine 900 WG'), 'Maize', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Atrazine 900 WG'), 'Sorghum', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Atrazine 900 WG'), 'Sugarcane', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Wheat', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Barley', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Chickpea', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Pasture', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Bayleton 250 WP'), 'Wheat', 21, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bayleton 250 WP'), 'Barley', 21, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bayleton 250 WP'), 'Grape', 21, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Boxer Gold'), 'Wheat', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Boxer Gold'), 'Barley', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Brigadier 200 SC'), 'Cotton', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Brigadier 200 SC'), 'Vegetable', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Oats', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Chickpea', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Faba Bean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Lupin', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Soybean', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Bromicide MA'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bromicide MA'), 'Barley', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Bumper 625 EC'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bumper 625 EC'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bumper 625 EC'), 'Sorghum', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Citrus', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Stone Fruit', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Vegetable', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Onion', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Celery', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Peanut', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Carrot', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Vegetable', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Sugarcane', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Maize', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Sorghum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Vegetable', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Delan 700 WDG'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delan 700 WDG'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delan 700 WDG'), 'Plum', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Ornamental', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Banana', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Banana', 14, NULL, NULL, 'NT', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Pasture', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Oats', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Pasture', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Dichlorvos 500 EC'), 'Stored Products', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dichlorvos 500 EC'), 'Glasshouse', 3, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Dipel DF'), 'All registered crops', 0, 'Biological control', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Onion', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Wheat', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Diuron 900 WG'), 'Sugarcane', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diuron 900 WG'), 'Cotton', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diuron 900 WG'), 'Asparagus', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Maize', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Sorghum', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Cotton', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Soybean', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Peanut', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Soybean', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Peanut', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Chickpea', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Lupin', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Faba Bean', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Lentil', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Grape', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Maize', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Sunflower', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Potato', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Bean', 0, 'Pre-plant incorporated', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Capsicum', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Citrus', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Canola', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Grain Legume', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Cotton', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Strawberry', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Wheat', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Canola', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Orchard', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Vegetable', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Cotton', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Soybean', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Gesagard 500 FW'), 'Cotton', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesagard 500 FW'), 'Celery', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesagard 500 FW'), 'Carrot', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Gesaprime 900 WG'), 'Maize', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesaprime 900 WG'), 'Sorghum', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesaprime 900 WG'), 'Sugarcane', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Wheat', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Barley', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Oats', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Grazon Extra'), 'Pasture', 84, '12 weeks before grazing', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Halosulfuron 750 WG'), 'Maize', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Halosulfuron 750 WG'), 'Sorghum', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Halosulfuron 750 WG'), 'Sugarcane', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Wheat', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Barley', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Soybean', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Canola', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Peanut', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Sorghum', 28, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Hussar OD'), 'Wheat', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Hussar OD'), 'Barley', 60, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Ignite 150 SL'), 'Liberty Link Canola', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ignite 150 SL'), 'Non-crop', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Wheat', 0, 'Seed treatment', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Barley', 0, 'Seed treatment', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Canola', 0, 'Seed treatment', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Cotton', 0, 'Seed treatment', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Intervix'), 'Clearfield Wheat', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Intervix'), 'Clearfield Canola', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Intervix'), 'Clearfield Barley', 60, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Tomato', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Asparagus', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Potato', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Wheat', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Logran 750 WG'), 'Wheat', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Logran 750 WG'), 'Barley', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Canola', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Chickpea', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Lupin', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Sunflower', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Lentil', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Oats', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Pasture', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Olive', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Oats', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Triticale', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Strawberry', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Montor WG'), 'Sugarcane', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Wheat', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Barley', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Soybean', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Sorghum', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Canola', 28, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Tomato', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Nissorum 100 WP'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nissorum 100 WP'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nissorum 100 WP'), 'Stone Fruit', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Nugrass 200 EC'), 'Peanut', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nugrass 200 EC'), 'Sugarcane', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Apple', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Pear', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Stone Fruit', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Citrus', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Grape', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Mango', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Oats', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Triticale', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Opus Team'), 'Wheat', 35, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus Team'), 'Barley', 35, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Tomato', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Fallow', 0, 'Non-selective', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Orchard (under-tree)', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Vineyard', 0, 'Under-vine only', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Pegasus 500 SC'), 'Cotton', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pegasus 500 SC'), 'Vegetable', 3, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Onion', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Carrot', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Avocado', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Macadamia', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Citrus', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Grape', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Strawberry', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Blueberry', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Canola', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Brassica', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Grape', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Pix Plus'), 'Cotton', 0, 'Plant growth regulator', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Pixxaro EC'), 'Wheat', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pixxaro EC'), 'Barley', 60, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Strawberry', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Citrus', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Vegetable', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Triticale', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Oats', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Citrus', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Vegetable', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Onion', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Capsicum', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Peanut', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Grape', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Peach', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Nectarine', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Cherry', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Strawberry', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Ranman Top'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ranman Top'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ranman Top'), 'Lettuce', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Raptor'), 'Soybean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Raptor'), 'Bean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Raptor'), 'Lupin', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Reflex 240 SC'), 'Soybean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Reflex 240 SC'), 'Cotton', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Capsicum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Lettuce', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Onion', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Grape', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'All crops (pre-plant)', 0, 'Pre-plant only', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Fallow', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Pasture', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Wheat', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Barley', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Canola', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Chickpea', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura Duo'), 'Wheat', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura Duo'), 'Barley', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Strawberry', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Tomato', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Brassica', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Soybean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Cotton', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Canola', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Vegetable', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Simazine 900 WG'), 'Grape', 0, 'Pre-emergent/under-vine', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Simazine 900 WG'), 'Orchard', 0, 'Under-tree', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Soybean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Faba Bean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Lupin', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Lentil', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Soybean', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Chickpea', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Lentil', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Faba Bean', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Spray.Seed 250'), 'Fallow', 0, 'Non-selective', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spray.Seed 250'), 'Non-crop', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Onion', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Garlic', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Tomato', 0, 'Pre-transplant', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Cotton', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Maize', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Cucumber', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Strawberry', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Oats', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Stored Grain', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Olive', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Strawberry', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Capsicum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Tomato', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Talinor 400 SC'), 'Wheat', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talinor 400 SC'), 'Barley', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talinor 400 SC'), 'Triticale', 60, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Talstar 100 EC'), 'Cotton', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talstar 100 EC'), 'Vegetable', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talstar 100 EC'), 'Fruit', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Terbyne XT'), 'Sorghum', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terbyne XT'), 'Maize', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terbyne XT'), 'Sugarcane', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Peanut', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Onion', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Potato', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Brassica', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Bean', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Terrain 750 WG'), 'Non-crop', 0, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Terrazole 35 WP'), 'Cotton', 21, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terrazole 35 WP'), 'Vegetable', 21, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Wheat', 0, 'Seed treatment', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Barley', 0, 'Seed treatment', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Canola', 0, 'Seed treatment', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Sorghum', 0, 'Seed treatment', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Bean', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Pea', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Tigrex'), 'Chickpea', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tigrex'), 'Lentil', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tigrex'), 'Faba Bean', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Oats', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Sorghum', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Maize', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Peanut', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Banana', 30, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Banana', 30, NULL, NULL, 'NT', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Cucumber', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Capsicum', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Wheat', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Barley', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Oats', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Triticale', 60, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Strawberry', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Bean', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Canola', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Chickpea', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Lupin', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Soybean', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Cotton', 0, 'Pre-plant incorporated', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Valor 500 SC'), 'Grape', 0, 'Pre-emergent/under-vine', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Valor 500 SC'), 'Apple', 0, 'Under-tree', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Valor 500 SC'), 'Asparagus', 0, 'Pre-emergent', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Vangard WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vangard WG'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vangard WG'), 'Strawberry', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Vento Duo'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vento Duo'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vento Duo'), 'Grape', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Canola', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Chickpea', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Faba Bean', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Lupin', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Sunflower', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Lentil', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Brassica', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Oats', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Triticale', 30, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Maize', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Sorghum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Sunflower', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Canola', 14, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Pasture', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Fallow', 7, NULL, NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Xtreme Herbicide'), 'Non-crop', 0, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Xtreme Herbicide'), 'Orchard', 0, 'Under-tree', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Xtreme Herbicide'), 'Vineyard', 0, 'Under-vine', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Zinc Phosphide 8 TB'), 'Stored Grain', 0, 'Fumigant — follow label re-entry requirements', NULL, 'All', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Almond', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Grape', 7, NULL, NULL, 'All', true),

-- Eclipse 700 WG
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Wheat (winter)', 60, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Potato', 0, 'Pre-plant incorporated', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Tomato', 0, 'Pre-emergent', NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Asparagus', 0, 'Pre-emergent', NULL, 'All', true)

ON CONFLICT DO NOTHING;
