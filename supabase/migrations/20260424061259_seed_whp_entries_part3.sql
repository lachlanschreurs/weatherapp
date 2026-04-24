/*
  # Seed WHP Entries Part 3 (N–Z)
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes) VALUES

-- Nativo 750 WG - 28 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Wheat', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Barley', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Soybean', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Sorghum', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nativo 750 WG'), 'Canola', 28, NULL),

-- Nexter 200 SC (Pyridaben) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nexter 200 SC'), 'Tomato', 14, NULL),

-- Nissorum 100 WP (Hexythiazox) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Nissorum 100 WP'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nissorum 100 WP'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nissorum 100 WP'), 'Stone Fruit', 14, NULL),

-- Nugrass 200 EC (Imazapic) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Nugrass 200 EC'), 'Peanut', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Nugrass 200 EC'), 'Sugarcane', 0, NULL),

-- Oberon 240 SC (Spiromesifen) - 1 day veg, 7 days grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Vegetable', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Tomato', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Capsicum', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Cucumber', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Cotton', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oberon 240 SC'), 'Grape', 7, NULL),

-- Oil DC Tron Plus - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Apple', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Pear', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Stone Fruit', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Citrus', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Grape', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Oil DC Tron Plus'), 'Mango', 0, NULL),

-- Opus 125 SC (Epoxiconazole) - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Oats', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus 125 SC'), 'Triticale', 30, NULL),

-- Opus Team (Epoxiconazole + Fenpropimorph) - 35 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus Team'), 'Wheat', 35, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Opus Team'), 'Barley', 35, NULL),

-- Paramite 480 EC (Dicofol) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paramite 480 EC'), 'Tomato', 14, NULL),

-- Paraquat 250 SL - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Fallow', 0, 'Non-selective'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Orchard (under-tree)', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Vineyard', 0, 'Under-vine only'),

-- Pegasus 500 SC (Diafenthiuron) - 3 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Pegasus 500 SC'), 'Cotton', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pegasus 500 SC'), 'Vegetable', 3, NULL),

-- Penncozeb 750 DF (Mancozeb) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Onion', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Penncozeb 750 DF'), 'Carrot', 7, NULL),

-- Phosphorous Acid 600 - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Avocado', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Macadamia', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Citrus', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Grape', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Strawberry', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Blueberry', 0, NULL),

-- Pirimicarb 500 WG - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Canola', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Brassica', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pirimicarb 500 WG'), 'Grape', 7, NULL),

-- Pix Plus - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Pix Plus'), 'Cotton', 0, 'Plant growth regulator'),

-- Pixxaro EC - 60 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Pixxaro EC'), 'Wheat', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pixxaro EC'), 'Barley', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pixxaro EC'), 'Triticale', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pixxaro EC'), 'Oats', 60, NULL),

-- Portal 250 SC (Fenpyroximate) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Portal 250 SC'), 'Strawberry', 14, NULL),

-- Previcur Energy - 3 days cucumber, 7 others
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Cucumber', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Capsicum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Lettuce', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Previcur Energy'), 'Strawberry', 7, NULL),

-- Proclaim 5 SG (Emamectin benzoate) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Citrus', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Proclaim 5 SG'), 'Vegetable', 7, NULL),

-- Prosaro 420 SC - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Triticale', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Prosaro 420 SC'), 'Oats', 30, NULL),

-- Pyriproxyfen 100 EC - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Citrus', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Pyriproxyfen 100 EC'), 'Vegetable', 7, NULL),

-- Quadris Opti - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Onion', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Capsicum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Peanut', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Quadris Opti'), 'Grape', 7, NULL),

-- Rally 400 WP (Myclobutanil) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Peach', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Nectarine', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Cherry', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Strawberry', 14, NULL),

-- Ranman Top - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Ranman Top'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ranman Top'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ranman Top'), 'Lettuce', 7, NULL),

-- Raptor (Imazamox) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Raptor'), 'Soybean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Raptor'), 'Bean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Raptor'), 'Lupin', 0, NULL),

-- Reflex 240 SC (Fomesafen) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Reflex 240 SC'), 'Soybean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Reflex 240 SC'), 'Cotton', 0, NULL),

-- Ridomil Gold MZ 68 WG - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Capsicum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Lettuce', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Onion', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ridomil Gold MZ 68 WG'), 'Grape', 14, NULL),

-- Roundup Ultra MAX (Glyphosate) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'All crops (pre-plant)', 0, 'Pre-plant only'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Fallow', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Pasture', 0, NULL),

-- Rovral 500 SC (Iprodione) - 1 day grape/stone fruit, 14 canola
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Grape', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Stone Fruit', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Strawberry', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Tomato', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Onion', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Barley', 14, NULL),

-- Sakura 850 WG - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Wheat', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Barley', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Canola', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura 850 WG'), 'Chickpea', 0, 'Pre-emergent'),

-- Sakura Duo - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura Duo'), 'Wheat', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sakura Duo'), 'Barley', 0, 'Pre-emergent'),

-- Scala 400 SC (Pyrimethanil) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Strawberry', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Tomato', 7, NULL),

-- Score 250 EC (Difenoconazole) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Brassica', 14, NULL),

-- Select 240 EC (Clethodim) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Soybean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Cotton', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Canola', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Select 240 EC'), 'Vegetable', 0, NULL),

-- Signum WG - 3 days veg, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Capsicum', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Tomato', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Bean', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Cucumber', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Strawberry', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Signum WG'), 'Grape', 7, NULL),

-- Simazine 900 WG - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Simazine 900 WG'), 'Grape', 0, 'Pre-emergent/under-vine'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Simazine 900 WG'), 'Orchard', 0, 'Under-tree'),

-- Spinnaker 500 (Imazethapyr) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Soybean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Faba Bean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Lupin', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 500'), 'Lentil', 0, NULL),

-- Spinnaker 700 WG (Imazethapyr) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Soybean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Chickpea', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Lentil', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spinnaker 700 WG'), 'Faba Bean', 0, NULL),

-- Spray.Seed 250 - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Spray.Seed 250'), 'Fallow', 0, 'Non-selective'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Spray.Seed 250'), 'Non-crop', 0, NULL),

-- Stomp Aqua (Pendimethalin) - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Onion', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Garlic', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Tomato', 0, 'Pre-transplant'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Capsicum', 0, 'Pre-transplant'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Cotton', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stomp Aqua'), 'Maize', 0, 'Pre-emergent'),

-- Stroby WG (Kresoxim-methyl) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Cucumber', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Stroby WG'), 'Strawberry', 7, NULL),

-- Success 480 SC (Spinosad) - 1 day veg, 7 days fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Vegetable', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Citrus', 7, NULL),

-- Sumithion 500 EC (Fenitrothion) - 14 days grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Oats', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Sumithion 500 EC'), 'Stored Grain', 14, NULL),

-- Supracide 400 EC (Methidathion) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Olive', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Supracide 400 EC'), 'Stone Fruit', 14, NULL),

-- Switch 62.5 WG (Cyprodinil + Fludioxonil) - 1 day lettuce, 7 others
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Lettuce', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Strawberry', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Raspberry', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Blueberry', 7, NULL),

-- Systhane 125 ME (Myclobutanil) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Strawberry', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Capsicum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Systhane 125 ME'), 'Tomato', 14, NULL),

-- Talinor 400 SC - 60 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Talinor 400 SC'), 'Wheat', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talinor 400 SC'), 'Barley', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talinor 400 SC'), 'Triticale', 60, NULL),

-- Talstar 100 EC (Bifenthrin) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Talstar 100 EC'), 'Cotton', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talstar 100 EC'), 'Vegetable', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Talstar 100 EC'), 'Fruit', 14, NULL),

-- Terbyne XT (Terbuthylazine) - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Terbyne XT'), 'Sorghum', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terbyne XT'), 'Maize', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terbyne XT'), 'Sugarcane', 0, 'Pre-emergent'),

-- Terraclor 400 SC (PCNB) - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Peanut', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Onion', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Potato', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Brassica', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terraclor 400 SC'), 'Bean', 30, NULL),

-- Terrain 750 WG (Imazapyr) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Terrain 750 WG'), 'Non-crop', 0, NULL),

-- Terrazole 35 WP (Etridiazole) - 21 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Terrazole 35 WP'), 'Cotton', 21, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Terrazole 35 WP'), 'Vegetable', 21, NULL),

-- Thiamethoxam 350 FS - 0 days (seed treatment)
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Wheat', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Barley', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Canola', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Sorghum', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiamethoxam 350 FS'), 'Maize', 0, 'Seed treatment'),

-- Thiram 750 WG - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Bean', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Thiram 750 WG'), 'Pea', 7, NULL),

-- Tigrex - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Tigrex'), 'Chickpea', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tigrex'), 'Lentil', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tigrex'), 'Faba Bean', 0, 'Pre-emergent'),

-- Tilt 250 EC (Propiconazole) - 30 days grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Oats', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Sorghum', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Maize', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Peanut', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Banana', 30, NULL),

-- Topas 100 EC (Penconazole) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Cucumber', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topas 100 EC'), 'Capsicum', 14, NULL),

-- Topik 240 EC (Clodinafop) - 60 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Wheat', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Barley', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Oats', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topik 240 EC'), 'Triticale', 60, NULL),

-- Topsin M 500 SC - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Strawberry', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Topsin M 500 SC'), 'Bean', 14, NULL),

-- Tracer 480 SC (Spinosad) - 1 day veg, 7 days fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Vegetable', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Cotton', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Citrus', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Stone Fruit', 7, NULL),

-- Trifluralin 480 EC - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Canola', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Chickpea', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Lupin', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Soybean', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Trifluralin 480 EC'), 'Cotton', 0, 'Pre-plant incorporated'),

-- Valor 500 SC (Flumioxazin) - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Valor 500 SC'), 'Grape', 0, 'Pre-emergent/under-vine'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Valor 500 SC'), 'Apple', 0, 'Under-tree'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Valor 500 SC'), 'Asparagus', 0, 'Pre-emergent'),

-- Vangard WG (Cyprodinil) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Vangard WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vangard WG'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vangard WG'), 'Strawberry', 7, NULL),

-- Vento Duo - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Vento Duo'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vento Duo'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vento Duo'), 'Grape', 7, NULL),

-- Verdict 520 EC (Haloxyfop) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Canola', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Chickpea', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Faba Bean', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Lupin', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Sunflower', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Lentil', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Verdict 520 EC'), 'Brassica', 7, NULL),

-- Veritas - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Oats', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Veritas'), 'Triticale', 30, NULL),

-- Vertimec 18 EC (Abamectin) - 3 days veg, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Vegetable', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Cotton', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Citrus', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Stone Fruit', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Grape', 7, NULL),

-- Voliam Flexi - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Maize', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Sorghum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Sunflower', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Voliam Flexi'), 'Canola', 14, NULL),

-- Weedmaster Duo (Dicamba + 2,4-D) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Pasture', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Fallow', 7, NULL),

-- Xtreme Herbicide - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Xtreme Herbicide'), 'Non-crop', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Xtreme Herbicide'), 'Orchard', 0, 'Under-tree'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Xtreme Herbicide'), 'Vineyard', 0, 'Under-vine'),

-- Zinc Phosphide 8 TB - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Zinc Phosphide 8 TB'), 'Stored Grain', 0, 'Fumigant — follow label re-entry requirements'),

-- Ziram 76 DF - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Almond', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ziram 76 DF'), 'Grape', 7, NULL)

ON CONFLICT DO NOTHING;
