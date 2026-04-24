/*
  # Seed WHP Entries Part 1 (A–D)
  Structured per-crop withholding period entries extracted from agro_chemicals.withholding_period text.
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes) VALUES

-- Acanto 250 SC (Picoxystrobin) - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Acanto 250 SC'), 'All registered crops', 30, NULL),

-- Acaricide 50 WP (Cyhexatin) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Stone Fruit', 14, NULL),

-- Acrobat 690 WP (Mancozeb + Dimethomorph) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Acrobat 690 WP'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acrobat 690 WP'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acrobat 690 WP'), 'Grape', 7, NULL),

-- Actara 240 SC (Thiamethoxam) - 7 days vegetable, 14 days fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Citrus', 14, NULL),

-- Actellic 500 EC (Pirimiphos-methyl) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Actellic 500 EC'), 'Stored Grain', 0, 'Food use'),

-- Agri-Mectin 18 EC (Abamectin) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Citrus', 7, NULL),

-- Aliette 800 WG (Fosetyl-Al) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Avocado', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Pineapple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Macadamia', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Strawberry', 14, NULL),

-- Ally Max (Metsulfuron-methyl) - 0 days pre-emergent/post
((SELECT id FROM agro_chemicals WHERE product_name = 'Ally Max'), 'Wheat', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ally Max'), 'Barley', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Ally Max'), 'Pasture', 0, NULL),

-- Altacor 35 WG (Chlorantraniliprole) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Capsicum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Strawberry', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Brassica', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Sweet Corn', 7, NULL),

-- Amicide 625 (2,4-D) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Oats', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Pasture', 7, NULL),

-- Amistar 250 SC (Azoxystrobin) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Onion', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Peanut', 14, NULL),

-- Amistar Top (Azoxystrobin + Difenoconazole) - 28 days grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Wheat', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Barley', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Canola', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Chickpea', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Sorghum', 28, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Maize', 28, NULL),

-- Amitrole 250 SC - 0 days (non-crop / under-tree)
((SELECT id FROM agro_chemicals WHERE product_name = 'Amitrole 250 SC'), 'Non-crop', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amitrole 250 SC'), 'Orchard (under-tree)', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amitrole 250 SC'), 'Grape', 0, 'Under-vine only'),

-- Aphidius-based Biocontrol - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Aphidius-based Biocontrol'), 'All registered crops', 0, 'Biological control'),

-- Aramo 50 EC - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Cotton', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Soybean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Sunflower', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Peanut', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aramo 50 EC'), 'Canola', 0, NULL),

-- Assail 70 WP (Acetamiprid) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Citrus', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Grape', 7, NULL),

-- Atrazine 900 WG - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Atrazine 900 WG'), 'Maize', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Atrazine 900 WG'), 'Sorghum', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Atrazine 900 WG'), 'Sugarcane', 0, 'Pre-emergent'),

-- Avadex Xtra - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Wheat', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Barley', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Chickpea', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avadex Xtra'), 'Lentil', 0, NULL),

-- Avatar 600 SC (Indoxacarb) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Capsicum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Bean', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Brassica', 7, NULL),

-- Banvel 200 SL (Dicamba) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Oats', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Banvel 200 SL'), 'Pasture', 14, NULL),

-- Bayleton 250 WP (Triadimefon) - 21 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Bayleton 250 WP'), 'Wheat', 21, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bayleton 250 WP'), 'Barley', 21, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bayleton 250 WP'), 'Grape', 21, NULL),

-- Baythroid Advanced (Beta-cyfluthrin) - 7 days veg, 30 days grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Canola', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Sorghum', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Pasture', 30, NULL),

-- Belt 480 SC (Flubendiamide) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Brassica', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Capsicum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Cucumber', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Pumpkin', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Bean', 7, NULL),

-- Boxer Gold - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Boxer Gold'), 'Wheat', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Boxer Gold'), 'Barley', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Boxer Gold'), 'Triticale', 0, 'Pre-emergent'),

-- Bravo WeatherStik (Chlorothalonil) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Peanut', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Onion', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Carrot', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Celery', 14, NULL),

-- Brigadier 200 SC (Bifenthrin) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Brigadier 200 SC'), 'Cotton', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Brigadier 200 SC'), 'Vegetable', 14, NULL),

-- Broadside (Bromoxynil + MCPA) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Oats', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Sorghum', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadside'), 'Maize', 7, NULL),

-- Broadstrike (Flumetsulam) - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Chickpea', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Faba Bean', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Lupin', 0, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Broadstrike'), 'Soybean', 0, NULL),

-- Bromicide MA (Bromoxynil) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Bromicide MA'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bromicide MA'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bromicide MA'), 'Maize', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bromicide MA'), 'Sorghum', 7, NULL),

-- Bumper 625 EC - 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Bumper 625 EC'), 'Wheat', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bumper 625 EC'), 'Barley', 30, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bumper 625 EC'), 'Sorghum', 30, NULL),

-- Buprofezin 400 SC - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Citrus', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Buprofezin 400 SC'), 'Stone Fruit', 7, NULL),

-- Cabrio 200 SC (Pyraclostrobin) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Wheat', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Barley', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Canola', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Cherry', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Strawberry', 7, NULL),

-- Calypso 480 SC (Thiacloprid) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Calypso 480 SC'), 'Vegetable', 14, NULL),

-- Cantus WG (Boscalid) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Chickpea', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Faba Bean', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Lupin', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Strawberry', 14, NULL),

-- Chlorothalonil 720 SC - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Onion', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Celery', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Peanut', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorothalonil 720 SC'), 'Carrot', 7, NULL),

-- Chlorpyrifos 500 EC - 14-30 days crop dependent
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Cotton', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Horticulture', 30, NULL),

-- Confidor 200 SL (Imidacloprid) - 14 veg, 28 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Capsicum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Brassica', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Cotton', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Grape', 28, NULL),

-- Confirm 240 SC (Tebufenozide) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Cotton', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confirm 240 SC'), 'Vegetable', 7, NULL),

-- Copper Oxychloride 500 WP - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Stone Fruit', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Grape', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Tomato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Citrus', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Walnut', 14, NULL),

-- Coragen 200 SC (Chlorantraniliprole) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Sugarcane', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Maize', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Sorghum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Potato', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Vegetable', 14, NULL),

-- Decis 100 EC (Deltamethrin) - 7 veg, 14 grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Vegetable', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Sorghum', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Cotton', 14, NULL),

-- Delan 700 WDG (Dithianon) - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Delan 700 WDG'), 'Apple', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delan 700 WDG'), 'Pear', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delan 700 WDG'), 'Plum', 14, NULL),

-- Delegate WG (Spinetoram) - 1 day veg, 7 days fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Vegetable', 1, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Pear', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Stone Fruit', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Citrus', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Strawberry', 7, NULL),

-- Diazinon 800 WG - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Ornamental', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Banana', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diazinon 800 WG'), 'Pasture', 14, NULL),

-- Dicamba 700 WG - 14 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Oats', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dicamba 700 WG'), 'Pasture', 14, NULL),

-- Dichlorvos 500 EC - 3 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Dichlorvos 500 EC'), 'Stored Products', 3, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dichlorvos 500 EC'), 'Glasshouse', 3, NULL),

-- Dimethoate 400 EC - 14 grain, 7 veg
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Wheat', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Barley', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Canola', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Legume', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Pasture', 14, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Brassica', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Vegetable', 7, NULL),

-- Dipel DF - 0 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Dipel DF'), 'All registered crops', 0, 'Biological control'),

-- Dithane M-45 (Mancozeb) - 7 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Potato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Tomato', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Grape', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Apple', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Onion', 7, NULL),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Wheat', 7, NULL),

-- Diuron 900 WG - 0 days pre-emergent
((SELECT id FROM agro_chemicals WHERE product_name = 'Diuron 900 WG'), 'Sugarcane', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diuron 900 WG'), 'Cotton', 0, 'Pre-emergent'),
((SELECT id FROM agro_chemicals WHERE product_name = 'Diuron 900 WG'), 'Asparagus', 0, 'Pre-emergent')

ON CONFLICT DO NOTHING;
