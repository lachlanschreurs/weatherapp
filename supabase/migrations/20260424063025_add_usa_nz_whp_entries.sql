/*
  # Add USA and New Zealand WHP entries

  Adds per-country WHP entries for USA and New Zealand for commonly registered
  Australian agrichemicals that also have registrations in those markets.
  
  state values used: 'USA', 'NZ'
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes, application_notes, state, registered) VALUES

-- Abamectin (Agri-Mectin / Vertimec)
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Vegetable', 7, NULL, 'EPA reg. equiv. Agri-Mek', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Cotton', 7, NULL, 'EPA reg. equiv. Agri-Mek', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Grape', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Agri-Mectin 18 EC'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Vegetable', 7, NULL, 'EPA reg. equiv. Agri-Mek', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Cotton', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Grape', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Vertimec 18 EC'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),

-- Azoxystrobin (Amistar)
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Grape', 0, NULL, 'EPA reg. as Abound/Quadris', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Potato', 0, NULL, 'EPA reg. as Quadris', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Vegetable', 0, NULL, 'EPA reg. as Quadris', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Wheat', 0, NULL, 'EPA reg. as Quadris', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Grape', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Potato', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Wheat', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amistar 250 SC'), 'Onion', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Chlorantraniliprole (Altacor / Coragen)
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Apple', 5, NULL, 'EPA reg. as Altacor', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Stone Fruit', 5, NULL, 'EPA reg. as Altacor', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Vegetable', 1, NULL, 'EPA reg. as Rynaxypyr', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Apple', 3, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Stone Fruit', 3, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Altacor 35 WG'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Vegetable', 1, NULL, 'EPA reg. as Coragen', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Maize', 1, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Coragen 200 SC'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),

-- Spinosad (Success / Tracer)
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Vegetable', 1, NULL, 'EPA reg. as Entrust/SpinTor', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Apple', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Citrus', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Success 480 SC'), 'Apple', 7, NULL, 'ACVM reg.', 'NZ', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Vegetable', 1, NULL, 'EPA reg. as SpinTor', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Apple', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Cotton', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tracer 480 SC'), 'Apple', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Lambda-cyhalothrin (Karate)
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Vegetable', 5, NULL, 'EPA reg. as Karate Z', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Wheat', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Cotton', 1, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Vegetable', 3, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Wheat', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Deltamethrin (Decis)
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Vegetable', 3, NULL, 'EPA reg. as Decis', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Wheat', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Decis 100 EC'), 'Wheat', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Imidacloprid (Confidor)
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Vegetable', 7, NULL, 'EPA reg. as Admire/Provado', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Apple', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Citrus', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Vegetable', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Confidor 200 SL'), 'Apple', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Thiamethoxam (Actara)
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Vegetable', 7, NULL, 'EPA reg. as Actara', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Apple', 14, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Cotton', 0, 'Not registered for cotton in NZ', NULL, 'NZ', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Vegetable', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Actara 240 SC'), 'Apple', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Glyphosate (Roundup)
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'All crops (pre-plant)', 0, NULL, 'EPA reg. as Roundup', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Fallow', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'All crops (pre-plant)', 0, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Fallow', 0, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Roundup Ultra MAX'), 'Pasture', 0, NULL, 'ACVM reg.', 'NZ', true),

-- Mancozeb (Dithane / Mancozeb 750)
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Potato', 5, NULL, 'EPA reg. as Dithane M-45', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Tomato', 5, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Apple', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Potato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Tomato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Apple', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dithane M-45'), 'Onion', 7, NULL, 'ACVM reg.', 'NZ', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Potato', 5, NULL, 'EPA reg. as Dithane/Mancozeb', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Tomato', 5, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Potato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Tomato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Grape', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Copper Hydroxide (Kocide)
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Tomato', 0, NULL, 'EPA reg. as Kocide 3000', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Potato', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Grape', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Citrus', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Tomato', 1, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Potato', 1, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Grape', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Copper Oxychloride
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Apple', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Tomato', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Apple', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Tomato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Copper Oxychloride 500 WP'), 'Potato', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Tebuconazole (Folicur)
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Wheat', 30, NULL, 'EPA reg. as Folicur', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Barley', 30, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Grape', 14, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Wheat', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Barley', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Propiconazole (Tilt)
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Wheat', 30, NULL, 'EPA reg. as Tilt', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Barley', 30, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Banana', 0, 'Not registered in NZ', NULL, 'NZ', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Tilt 250 EC'), 'Wheat', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Difenoconazole (Score)
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Potato', 14, NULL, 'EPA reg. as Inspire Super', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Tomato', 14, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Potato', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Tomato', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Score 250 EC'), 'Wheat', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Myclobutanil (Rally)
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Apple', 7, NULL, 'EPA reg. as Rally', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Grape', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Stone Fruit', 14, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Apple', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rally 400 WP'), 'Grape', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Iprodione (Rovral)
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Grape', 7, NULL, 'EPA reg. as Rovral', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Stone Fruit', 14, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Strawberry', 1, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Rovral 500 SC'), 'Grape', 1, NULL, 'ACVM reg.', 'NZ', true),

-- Cyprodinil + Fludioxonil (Switch)
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Grape', 0, NULL, 'EPA reg. as Switch', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Strawberry', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Stone Fruit', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Grape', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Switch 62.5 WG'), 'Strawberry', 3, NULL, 'ACVM reg.', 'NZ', true),

-- Pyrimethanil (Scala)
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Grape', 7, NULL, 'EPA reg. as Scala', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Stone Fruit', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Grape', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Scala 400 SC'), 'Strawberry', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Pyraclostrobin (Cabrio / Headline)
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Grape', 0, NULL, 'EPA reg. as Cabrio', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Apple', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Wheat', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Apple', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cabrio 200 SC'), 'Grape', 7, NULL, 'ACVM reg.', 'NZ', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Wheat', 7, NULL, 'EPA reg. as Headline', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Soybean', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Headline 250 EC'), 'Wheat', 28, NULL, 'ACVM reg.', 'NZ', true),

-- Chlorothalonil (Bravo) — cancelled in USA 2020; NZ still registered
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'All crops', 0, 'EPA registration cancelled 2020', NULL, 'USA', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Potato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Tomato', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Bravo WeatherStik'), 'Onion', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Fluopyram + Trifloxystrobin (Luna Sensation)
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Apple', 7, NULL, 'EPA reg. as Luna Sensation', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Grape', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Strawberry', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Apple', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Strawberry', 3, NULL, 'ACVM reg.', 'NZ', true),

-- Spirotetramat (Movento)
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Apple', 7, NULL, 'EPA reg. as Movento', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Citrus', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Grape', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Apple', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Grape', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Spinetoram (Delegate)
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Apple', 7, NULL, 'EPA reg. as Delegate', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Vegetable', 1, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Stone Fruit', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Apple', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Delegate WG'), 'Vegetable', 1, NULL, 'ACVM reg.', 'NZ', true),

-- Chlorpyrifos — USA banned for food uses 2021; NZ restricted
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'All crops', 0, 'Banned for food uses (EPA 2021)', NULL, 'USA', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Chlorpyrifos 500 EC'), 'All crops', 0, 'Use being phased out — verify ACVM status', NULL, 'NZ', false),

-- Methomyl (Lannate)
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Tomato', 1, NULL, 'EPA reg. as Lannate', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Vegetable', 3, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Tomato', 0, 'Verify ACVM status', NULL, 'NZ', false),

-- Paraquat — USA cancelled 2023; NZ restricted
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'All crops', 0, 'Not EPA registered — cancelled 2023', NULL, 'USA', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Paraquat 250 SL'), 'Fallow', 0, NULL, 'ACVM registered with restrictions', 'NZ', true),

-- 2,4-D (Amicide / Weedmaster)
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Wheat', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Pasture', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Wheat', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Amicide 625'), 'Pasture', 7, NULL, 'ACVM reg.', 'NZ', true),

((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Wheat', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Pasture', 7, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Wheat', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Weedmaster Duo'), 'Pasture', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Dimethoate — USA food tolerances revoked 2019; NZ restricted
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'All crops', 0, 'Food tolerances revoked by EPA 2019', NULL, 'USA', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Wheat', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Dimethoate 400 EC'), 'Brassica', 7, NULL, 'ACVM reg.', 'NZ', true),

-- Boscalid (Cantus / Endura)
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Canola', 0, NULL, 'EPA reg. as Endura', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Grape', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Canola', 14, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Cantus WG'), 'Grape', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Fosetyl-Al (Aliette)
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Avocado', 0, NULL, 'EPA reg. as Aliette', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Citrus', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Avocado', 7, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Aliette 800 WG'), 'Citrus', 14, NULL, 'ACVM reg.', 'NZ', true),

-- Potassium Phosphonate
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Avocado', 0, NULL, 'EPA reg. as ProPhyt', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Citrus', 0, NULL, 'EPA reg.', 'USA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Avocado', 0, NULL, 'ACVM reg.', 'NZ', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Phosphorous Acid 600'), 'Citrus', 0, NULL, 'ACVM reg.', 'NZ', true)

ON CONFLICT DO NOTHING;
