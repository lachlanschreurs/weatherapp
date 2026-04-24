/*
  # Re-seed WHP entries with per-state data (Part 2 — F to M)
*/

INSERT INTO chemical_whp_entries (chemical_id, crop, days, notes, application_notes, state, registered) VALUES

-- Folicur 250 EW (Tebuconazole) — national; 14 grain, 7 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Soybean', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Peanut', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Peanut', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Sunflower', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Banana', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Banana', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Folicur 250 EW'), 'Grape', 7, NULL, NULL, 'All', true),

-- Fontelis (Penthiopyrad) — national; 3 veg, 7 fruit
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Tomato', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Cucumber', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Pear', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Stone Fruit', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Fontelis'), 'Strawberry', 7, NULL, NULL, 'All', true),

-- Forum 500 SC (Dimethomorph) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Grape', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Cucumber', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Forum 500 SC'), 'Lettuce', 7, NULL, NULL, 'All', true),

-- Karate Zeon 250 CS (Lambda-cyhalothrin) — national; 7 veg, 14 grain
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Vegetable', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Wheat', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Barley', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Canola', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Sorghum', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Cotton', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Karate Zeon 250 CS'), 'Legume', 14, NULL, NULL, 'All', true),

-- Kocide 3000 (Copper Hydroxide) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Tomato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Potato', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Mango', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Mango', 14, NULL, NULL, 'NT', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Banana', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Banana', 14, NULL, NULL, 'NT', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Kocide 3000'), 'Avocado', 14, NULL, NULL, 'All', true),

-- Lannate 250 L (Methomyl) — national; 1 day tomato, 14 days apple
-- Not registered for apple in some states
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Tomato', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Celery', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Vegetable', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Cotton', 1, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 14, NULL, NULL, 'VIC', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 14, NULL, NULL, 'SA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 14, NULL, NULL, 'TAS', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Apple', 0, 'Not registered', NULL, 'WA', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Grape', 14, NULL, NULL, 'NSW', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Grape', 14, NULL, NULL, 'VIC', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Grape', 14, NULL, NULL, 'SA', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Lannate 250 L'), 'Grape', 14, NULL, NULL, 'QLD', true),

-- Luna Sensation (Fluopyram + Trifloxystrobin) — national; 3 strawberry, 14 others
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Strawberry', 3, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Pear', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Luna Sensation'), 'Tomato', 14, NULL, NULL, 'All', true),

-- Mancozeb 750 WG — national; 7 potato/tomato, 14 grape
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Potato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Tomato', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Apple', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Onion', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Brassica', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Wheat', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Barley', 7, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Mancozeb 750 WG'), 'Grape', 14, NULL, NULL, 'All', true),

-- Movento 240 SC (Spirotetramat) — national
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Grape', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Apple', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Citrus', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Mango', 14, NULL, NULL, 'QLD', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Mango', 14, NULL, NULL, 'NT', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Mango', 0, 'Not registered', NULL, 'WA', false),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Avocado', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Stone Fruit', 14, NULL, NULL, 'All', true),
((SELECT id FROM agro_chemicals WHERE product_name = 'Movento 240 SC'), 'Vegetable', 14, NULL, NULL, 'All', true)

ON CONFLICT DO NOTHING;
