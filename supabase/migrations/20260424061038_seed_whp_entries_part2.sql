/*
  # Seed WHP Entries Part 2 (D–M)
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes) VALUES

-- Dual Gold 960 EC - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Maize', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Sorghum', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Sunflower', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Cotton', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Soybean', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dual Gold 960 EC'), 'Peanut', 0, 'Pre-emergent'),

-- Eclipse 700 WG (Metribuzin) - 60 days wheat
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Wheat (winter)', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Potato', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Tomato', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Eclipse 700 WG'), 'Asparagus', 0, 'Pre-emergent'),

-- Elatus (Benzovindiflupyr + Azoxystrobin) - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Soybean', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Elatus'), 'Peanut', 30, NULL),

-- Endura WG (Boscalid) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Chickpea', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Lupin', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Faba Bean', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Endura WG'), 'Lentil', 14, NULL),

-- Envidor 240 SC (Spirodiclofen) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Envidor 240 SC'), 'Grape', 14, NULL),

-- EPTC 720 EC - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Maize', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Sunflower', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Potato', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'EPTC 720 EC'), 'Bean', 0, 'Pre-plant incorporated'),

-- Exirel 100 SE (Cyantraniliprole) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Capsicum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Exirel 100 SE'), 'Citrus', 7, NULL),

-- Fastac 100 EC (Alpha-cypermethrin) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Canola', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Grain Legume', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fastac 100 EC'), 'Pasture', 7, NULL),

-- Flint 500 WG (Trifloxystrobin) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Strawberry', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Flint 500 WG'), 'Wheat', 7, NULL),

-- Folicur 250 EW (Tebuconazole) - 14 grain, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Soybean', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Peanut', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Sunflower', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Banana', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Grape', 7, NULL),

-- Fontelis (Penthiopyrad) - 3 days veg, 7 days fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Tomato', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Cucumber', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Strawberry', 7, NULL),

-- Forum 500 SC (Dimethomorph) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Cucumber', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Lettuce', 7, NULL),

-- Fury 200 EW (Zeta-cypermethrin) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Canola', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fury 200 EW'), 'Grain Legume', 7, NULL),

-- Fusilade Forte (Fluazifop-P-butyl) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Orchard', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Vegetable', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Cotton', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fusilade Forte'), 'Soybean', 14, NULL),

-- Gesagard 500 FW (Prometryn) - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesagard 500 FW'), 'Cotton', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesagard 500 FW'), 'Celery', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesagard 500 FW'), 'Carrot', 0, 'Pre-emergent'),

-- Gesaprime 900 WG (Atrazine) - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesaprime 900 WG'), 'Maize', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesaprime 900 WG'), 'Sorghum', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Gesaprime 900 WG'), 'Sugarcane', 0, 'Pre-emergent'),

-- Glean 750 DF (Chlorsulfuron) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Wheat', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Barley', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Oats', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Glean 750 DF'), 'Triticale', 0, NULL),

-- Grazon Extra (Triclopyr + Picloram) - 12 weeks before grazing
((SELECT id FROM agro_chemicals WHERE product_name = 'Grazon Extra'), 'Pasture', 84, '12 weeks before grazing'),

-- Halosulfuron 750 WG - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Halosulfuron 750 WG'), 'Maize', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Halosulfuron 750 WG'), 'Sorghum', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Halosulfuron 750 WG'), 'Sugarcane', 0, NULL),

-- Headline 250 EC (Pyraclostrobin) - 28 days grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Wheat', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Barley', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Soybean', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Canola', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Peanut', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Sorghum', 28, NULL),

-- Hussar OD - 60 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Hussar OD'), 'Wheat', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Hussar OD'), 'Barley', 60, NULL),

-- Ignite 150 SL (Glufosinate-ammonium) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Ignite 150 SL'), 'Liberty Link Canola', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ignite 150 SL'), 'Non-crop', 0, NULL),

-- Imidacloprid 600 FS - 0 days (seed treatment)
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Wheat', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Barley', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Canola', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Cotton', 0, 'Seed treatment'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Imidacloprid 600 FS'), 'Sorghum', 0, 'Seed treatment'),

-- Intervix - 60 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Intervix'), 'Clearfield Wheat', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Intervix'), 'Clearfield Canola', 60, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Intervix'), 'Clearfield Barley', 60, NULL),

-- Karate Zeon 250 CS (Lambda-cyhalothrin) - 7 veg, 14 grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Sorghum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Cotton', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Legume', 14, NULL),

-- Kocide 3000 (Copper Hydroxide) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Mango', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Banana', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Avocado', 14, NULL),

-- Lannate 250 L (Methomyl) - 1 day tomato, 14 days apple
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Tomato', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Celery', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Vegetable', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Cotton', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Grape', 14, NULL),

-- Lexone 750 WG (Metribuzin) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Tomato', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Asparagus', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Potato', 0, 'Pre-plant incorporated'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lexone 750 WG'), 'Wheat', 0, NULL),

-- Logran 750 WG (Triasulfuron) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Logran 750 WG'), 'Wheat', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Logran 750 WG'), 'Barley', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Logran 750 WG'), 'Triticale', 0, NULL),

-- Luna Sensation (Fluopyram + Trifloxystrobin) - 3 days strawberry, 14 others
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Strawberry', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Tomato', 14, NULL),

-- Mancozeb 750 WG - 7 days potato/tomato, 14 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Onion', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Brassica', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Grape', 14, NULL),

-- Matador 500 EC (Quizalofop) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Canola', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Chickpea', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Lupin', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Sunflower', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Matador 500 EC'), 'Lentil', 0, NULL),

-- MCPA 750 SL - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Oats', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Pasture', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'MCPA 750 SL'), 'Rice', 7, NULL),

-- Methidathion 400 EC - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Methidathion 400 EC'), 'Olive', 14, NULL),

-- Miravis Ace - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Oats', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Triticale', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miravis Ace'), 'Sorghum', 30, NULL),

-- Miticide 240 SC (Hexythiazox) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Miticide 240 SC'), 'Strawberry', 14, NULL),

-- Montor WG - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Montor WG'), 'Sugarcane', 0, NULL),

-- Movento 240 SC (Spirotetramat) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Mango', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Avocado', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Vegetable', 14, NULL)

ON CONFLICT DO NOTHING;
