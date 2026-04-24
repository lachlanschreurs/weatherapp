/*
  # Re-seed WHP entries with per-state registration data (Part 1 — A to D)

  Each row represents one crop × one state combination.
  state = 'All' means nationally uniform registration across all states/territories.
  Where a product has specific state restrictions or different WHPs per state,
  individual state rows are inserted.
  registered = false rows indicate the product is NOT registered for that crop in that state.
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes, application_notes, state, registered) VALUES

-- Acanto 250 SC (Picoxystrobin) — national registration, 30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Acanto 250 SC'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acanto 250 SC'), 'Barley', 30, NULL, NULL, 'All', true),

-- Acaricide 50 WP (Cyhexatin) — registered in most states, not WA/QLD for some uses
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL, NULL, 'VIC', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL, NULL, 'SA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL, NULL, 'TAS', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL, NULL, 'WA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Apple', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Stone Fruit', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Stone Fruit', 14, NULL, NULL, 'VIC', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Stone Fruit', 14, NULL, NULL, 'SA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acaricide 50 WP'), 'Stone Fruit', 14, NULL, NULL, 'QLD', true),

-- Acrobat 690 WP (Mancozeb + Dimethomorph) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Acrobat 690 WP'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acrobat 690 WP'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Acrobat 690 WP'), 'Grape', 7, NULL, NULL, 'All', true),

-- Actara 240 SC (Thiamethoxam) — national, variable WHP by crop class
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Citrus', 14, NULL, NULL, 'All', true),

-- Actellic 500 EC — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Actellic 500 EC'), 'Stored Grain', 0, NULL, 'Food use', 'All', true),

-- Agri-Mectin 18 EC (Abamectin) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Citrus', 7, NULL, NULL, 'All', true),

-- Aliette 800 WG (Fosetyl-Al) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Avocado', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Pineapple', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Macadamia', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Macadamia', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Strawberry', 14, NULL, NULL, 'All', true),

-- Altacor 35 WG (Chlorantraniliprole) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Capsicum', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Strawberry', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Brassica', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Sweet Corn', 7, NULL, NULL, 'All', true),

-- Amistar 250 SC (Azoxystrobin) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Onion', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Peanut', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Peanut', 14, NULL, NULL, 'NSW', true),

-- Amistar Top — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Wheat', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Barley', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Canola', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Chickpea', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Sorghum', 28, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar Top'), 'Maize', 28, NULL, NULL, 'All', true),

-- Assail 70 WP (Acetamiprid) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Citrus', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Assail 70 WP'), 'Grape', 7, NULL, NULL, 'All', true),

-- Avatar 600 SC (Indoxacarb) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Cotton', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Capsicum', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Bean', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Avatar 600 SC'), 'Brassica', 7, NULL, NULL, 'All', true),

-- Baythroid Advanced (Beta-cyfluthrin) — national, 7 veg / 30 grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Wheat', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Barley', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Canola', 30, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Sorghum', 30, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Sorghum', 30, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Baythroid Advanced'), 'Pasture', 30, NULL, NULL, 'All', true),

-- Belt 480 SC (Flubendiamide) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Brassica', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Capsicum', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Cucumber', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Pumpkin', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Belt 480 SC'), 'Bean', 7, NULL, NULL, 'All', true),

-- Bravo WeatherStik (Chlorothalonil) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Peanut', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Peanut', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Onion', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Carrot', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Celery', 14, NULL, NULL, 'All', true),

-- Cabrio 200 SC (Pyraclostrobin) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Canola', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Cherry', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Strawberry', 7, NULL, NULL, 'All', true),

-- Cantus WG (Boscalid) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Chickpea', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Faba Bean', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Lupin', 14, NULL, NULL, 'WA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Lupin', 14, NULL, NULL, 'SA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Lupin', 14, NULL, NULL, 'VIC', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Lupin', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Strawberry', 14, NULL, NULL, 'All', true),

-- Chlorpyrifos 500 EC — national, crop-dependent WHP 14-30 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Cotton', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'Horticulture', 30, NULL, NULL, 'All', true),

-- Confidor 200 SL (Imidacloprid) — national; grape 28 days
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Capsicum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Brassica', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Cotton', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Grape', 28, NULL, NULL, 'All', true),

-- Copper Oxychloride 500 WP — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Walnut', 14, NULL, NULL, 'All', true),

-- Decis 100 EC (Deltamethrin) — national; 7 veg, 14 grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Sorghum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Cotton', 14, NULL, NULL, 'All', true),

-- Delegate WG (Spinetoram) — national; 1 day veg, 7 days fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Vegetable', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Citrus', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Strawberry', 7, NULL, NULL, 'All', true),

-- Dimethoate 400 EC — national; 14 grain, 7 veg
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Pasture', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Brassica', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Vegetable', 7, NULL, NULL, 'All', true)

ON CONFLICT DO NOTHING;
