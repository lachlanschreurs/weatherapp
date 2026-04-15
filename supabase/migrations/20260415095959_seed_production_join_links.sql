/*
  # Production Join Table Links

  Links chemicals to diseases, pests and weeds with efficacy ratings and application notes.
  Uses subqueries to resolve IDs by name.
*/

-- ============================================================
-- DISEASE <-> CHEMICAL LINKS
-- ============================================================
INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply preventively on 5-7 day schedule. Curative activity up to 48 hours post-infection.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora infestans' AND c.product_name = 'Ridomil Gold MZ 68 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Contact protectant. Apply before rain on 7-10 day schedule.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora infestans' AND c.product_name = 'Mancozeb 750 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Preventive plus curative activity on late blight.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora infestans' AND c.product_name = 'Vento Duo';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'moderate', 'Curative oomycete control. Mix with contact fungicide.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora infestans' AND c.product_name = 'Forum 500 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply as protectant before wet weather. 7-14 day intervals.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Botrytis cinerea' AND c.product_name = 'Switch 62.5 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at flowering and fruit development. Good rainfastness.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Botrytis cinerea' AND c.product_name = 'Scala 400 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'moderate', 'Protectant and curative. Remove infected material after spraying.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Botrytis cinerea' AND c.product_name = 'Rovral 500 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at 20-30% flowering. Timing is critical.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Sclerotinia sclerotiorum' AND c.product_name = 'Cantus WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at 20% flowering in canola for sclerotinia control.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Sclerotinia sclerotiorum' AND c.product_name = 'Endura WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply preventively at early infection risk. Curative within 72 hours.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Puccinia striiformis f.sp. tritici' AND c.product_name = 'Folicur 250 EW';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply from tillering to flag leaf stage. Best yield protection.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Puccinia striiformis f.sp. tritici' AND c.product_name = 'Prosaro 420 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Excellent broad-spectrum cereal fungicide. Apply at flag leaf.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Puccinia striiformis f.sp. tritici' AND c.product_name = 'Miravis Ace';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at 50% anthesis. Critical timing for efficacy.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Fusarium graminearum' AND c.product_name = 'Prosaro 420 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at anthesis timing (50% flower). Apply with adjuvant.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Fusarium graminearum' AND c.product_name = 'Folicur 250 EW';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Preventive sprays from budburst. Curative activity post-rain.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Plasmopara viticola' AND c.product_name = 'Ridomil Gold MZ 68 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Contact protectant. Apply before rain events.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Plasmopara viticola' AND c.product_name = 'Mancozeb 750 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Curative activity 3-4 days post-infection. Preventive plus curative.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Plasmopara viticola' AND c.product_name = 'Forum 500 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply from budburst. Preventive spray every 14 days.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Erysiphe necator' AND c.product_name = 'Flint 500 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply every 10-14 days from budburst. Strong systemic activity.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Erysiphe necator' AND c.product_name = 'Topas 100 EC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply from budbreak. Mix with protectant for resistance management.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Venturia inaequalis' AND c.product_name = 'Score 250 EC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Pre-rain protectant. Apply from budburst to end of primary season.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Venturia inaequalis' AND c.product_name = 'Mancozeb 750 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at flowering and 3 weeks before harvest. Excellent brown rot control.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Monilinia spp.' AND c.product_name = 'Switch 62.5 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at bloom and again 2 weeks before harvest. Systemic activity.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Monilinia spp.' AND c.product_name = 'Folicur 250 EW';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at flowering. Good curative activity on brown rot.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Monilinia spp.' AND c.product_name = 'Vangard WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at flowering. Luna Sensation covers both brown rot and powdery mildew.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Monilinia spp.' AND c.product_name = 'Luna Sensation';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Preventive copper sprays from panicle emergence through fruit development.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Colletotrichum gloeosporioides' AND c.product_name = 'Kocide 3000';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Contact protectant. Apply from flowering through harvest.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Colletotrichum gloeosporioides' AND c.product_name = 'Mancozeb 750 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply preventively. Broad-spectrum contact copper.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Xanthomonas perforans' AND c.product_name = 'Kocide 3000';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply preventively at 7-10 day intervals. Multi-site copper.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Xanthomonas perforans' AND c.product_name = 'Copper Oxychloride 500 WP';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Foliar or trunk injection. Apply twice per year for avocado.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora cinnamomi' AND c.product_name = 'Aliette 800 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Annual trunk injections or foliar applications.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora cinnamomi' AND c.product_name = 'Phosphorous Acid 600';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Trunk injection annual. Foliar 2x per year.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Phytophthora parasitica' AND c.product_name = 'Aliette 800 WG';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Key cereal septoria product. Apply from flag leaf.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Septoria tritici' AND c.product_name = 'Prosaro 420 SC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Excellent septoria control. Apply from GS31-61.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Septoria tritici' AND c.product_name = 'Miravis Ace';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at first sign of net blotch. Flag leaf stage critical.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Pyrenophora teres' AND c.product_name = 'Folicur 250 EW';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Broad-spectrum cereal foliar. Apply at GS31-45.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Pyrenophora teres' AND c.product_name = 'Amistar Top';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at stem elongation. Excellent blackleg curative activity.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Leptosphaeria maculans' AND c.product_name = 'Score 250 EC';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Apply at chickpea flowering. 10-14 day schedule.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Didymella rabiei' AND c.product_name = 'Amistar Top';

INSERT INTO agro_disease_chemicals (disease_id, chemical_id, efficacy_rating, application_notes)
SELECT d.id, c.id, 'high', 'Protectant fungicide for chickpea blight. Apply before wet weather.'
FROM agro_diseases d, agro_chemicals c
WHERE d.disease_name = 'Didymella rabiei' AND c.product_name = 'Bravo WeatherStik';

-- ============================================================
-- PEST <-> CHEMICAL LINKS
-- ============================================================
INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply when egg counts exceed threshold. Avoid pyrethroids due to resistance.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Helicoverpa armigera' AND c.product_name = 'Altacor 35 WG';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at threshold. Excellent residual against heliothis.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Helicoverpa armigera' AND c.product_name = 'Avatar 600 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply when larvae are small (L1-L2). Excellent curative activity.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Helicoverpa armigera' AND c.product_name = 'Coragen 200 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply when caterpillars are young. Good residual protection.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Helicoverpa armigera' AND c.product_name = 'Tracer 480 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'moderate', 'Biological control. Apply in late afternoon. Short residual.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Helicoverpa armigera' AND c.product_name = 'Dipel DF';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at threshold. Most effective diamide for caterpillar control.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Plutella xylostella' AND c.product_name = 'Belt 480 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply to young larvae. Excellent DBM control.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Plutella xylostella' AND c.product_name = 'Delegate WG';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'moderate', 'Bt product. Apply in the evening. Good safety profile.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Plutella xylostella' AND c.product_name = 'Dipel DF';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Selective aphicide - spares beneficial insects. Apply at threshold.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Myzus persicae' AND c.product_name = 'Pirimicarb 500 WG';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Systemic. Good persistence against aphids.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Myzus persicae' AND c.product_name = 'Confidor 200 SL';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Translaminar systemic. Good aphid control.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Myzus persicae' AND c.product_name = 'Assail 70 WP';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Best product for silverleaf whitefly. Apply early before population explosion.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Bemisia tabaci' AND c.product_name = 'Oberon 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Systemic activity against whitefly. Apply early.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Bemisia tabaci' AND c.product_name = 'Actara 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Unique - active against whitefly in diamide class. Use at first detection.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Bemisia tabaci' AND c.product_name = 'Exirel 100 SE';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply to leaf undersurfaces when mites detected. Translaminar activity.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Tetranychus urticae' AND c.product_name = 'Vertimec 18 EC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Ovicidal. One application provides season-long control.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Tetranychus urticae' AND c.product_name = 'Envidor 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Ovicidal and larvicidal. Apply in spring before population builds.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Tetranychus urticae' AND c.product_name = 'Miticide 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at threshold. Active against all mobile stages.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Tetranychus urticae' AND c.product_name = 'Portal 250 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at threshold in spring. Long residual.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Panonychus ulmi' AND c.product_name = 'Envidor 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Dormant oil spray controls overwintering eggs on bark.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Panonychus ulmi' AND c.product_name = 'Oil DC Tron Plus';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at first thrips detection. Most effective group for thrips.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Frankliniella occidentalis' AND c.product_name = 'Tracer 480 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Unique in diamide class for thrips activity. Apply at threshold.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Frankliniella occidentalis' AND c.product_name = 'Exirel 100 SE';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply when thrips detected in flowers. Difficult to penetrate flowers.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Frankliniella occidentalis' AND c.product_name = 'Delegate WG';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply as foliar at threshold. Systemic activity against thrips.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Thrips tabaci' AND c.product_name = 'Tracer 480 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply when larvae first detected. Excellent FAW activity.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Spodoptera frugiperda' AND c.product_name = 'Altacor 35 WG';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at first detection of FAW larvae. Good residual.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Spodoptera frugiperda' AND c.product_name = 'Coragen 200 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Best product for QFF. Protein bait spray.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Bactrocera tryoni' AND c.product_name = 'Success 480 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Bidirectional systemic ideal for scale and mealybug. Apply with adjuvant.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Pseudococcus longispinus' AND c.product_name = 'Movento 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Systemic scale and mealybug control. Apply to roots or foliage.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Coccus hesperidum' AND c.product_name = 'Movento 240 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Oil spray for scale control. Apply when crawlers active.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Coccus hesperidum' AND c.product_name = 'Oil DC Tron Plus';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Selective aphicide - spares beneficial insects in canola.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Lipaphis erysimi' AND c.product_name = 'Pirimicarb 500 WG';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at threshold. Good knockdown of plague thrips.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Thrips imaginis' AND c.product_name = 'Tracer 480 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Systemic activity against russeting thrips in apple.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Thrips imaginis' AND c.product_name = 'Assail 70 WP';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at dusk for cutworm control. Soil applied for grub control.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Agrotis infusa' AND c.product_name = 'Coragen 200 SC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Fast knockdown. Apply at dusk when cutworms active.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Agrotis infusa' AND c.product_name = 'Karate Zeon 250 CS';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at threshold. Good leafminer translaminar activity.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Phyllocnistis citrella' AND c.product_name = 'Vertimec 18 EC';

INSERT INTO agro_pest_chemicals (pest_id, chemical_id, efficacy_rating, application_notes)
SELECT p.id, c.id, 'high', 'Apply at armyworm threshold. Morning application preferred.'
FROM agro_pests p, agro_chemicals c
WHERE p.pest_name = 'Mythimna convecta' AND c.product_name = 'Karate Zeon 250 CS';

-- ============================================================
-- WEED <-> CHEMICAL LINKS
-- ============================================================
INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent application essential. Requires rainfall activation.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Sakura 850 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent dual mode for ryegrass. Apply and incorporate with rainfall.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Boxer Gold';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'moderate', 'Post-emergent in cereals. Check resistance before use - widespread resistance.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Topik 240 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Post-emergent grass control in broadleaf crops. Highly effective.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Verdict 520 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent dual grass herbicide. Excellent resistance management tool.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Sakura Duo';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Dual mode for radish - covers Group B resistant plants.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Raphanus raphanistrum' AND c.product_name = 'Pixxaro EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply at 2-6 leaf stage of radish. Excellent broadleaf control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Raphanus raphanistrum' AND c.product_name = 'Logran 750 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'moderate', 'Apply at rosette stage before flowering. Reduced efficacy on hairy leaves.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Raphanus raphanistrum' AND c.product_name = 'Amicide 625';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'New HPPD chemistry. Excellent on ALS-resistant radish populations.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Raphanus raphanistrum' AND c.product_name = 'Talinor 400 SC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply at rosette to early bolt stage. Good capeweed control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Arctotheca calendula' AND c.product_name = 'Amicide 625';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to actively growing capeweed. Good efficacy at rosette.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Arctotheca calendula' AND c.product_name = 'MCPA 750 SL';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to emerged weeds. Cannot be used on glyphosate-resistant fleabane alone.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Conyza spp.' AND c.product_name = 'Roundup Ultra MAX';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Tank-mix with glyphosate for resistant fleabane. Apply to rosette stage.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Conyza spp.' AND c.product_name = 'Amicide 625';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Tank-mix with glyphosate for fleabane. Adds knockdown to contact mode.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Conyza spp.' AND c.product_name = 'Paraquat 250 SL';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Selective in broadleaf crops. Apply when barnyard grass is actively growing.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Echinochloa crus-galli' AND c.product_name = 'Verdict 520 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent in maize and sorghum. Apply before weed emergence.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Echinochloa crus-galli' AND c.product_name = 'Atrazine 900 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent for summer grasses. Apply before sowing.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Echinochloa crus-galli' AND c.product_name = 'Dual Gold 960 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to actively growing johnsongrass regrowth. Multiple applications needed.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Sorghum halepense' AND c.product_name = 'Roundup Ultra MAX';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Post-emergent grass control in broadleaf crops.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Sorghum halepense' AND c.product_name = 'Aramo 50 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to actively growing sowthistle. Repeat for new flushes.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Sonchus oleraceus' AND c.product_name = 'Roundup Ultra MAX';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply in cereals at 3-5 leaf stage of weed.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Sonchus oleraceus' AND c.product_name = 'Logran 750 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply in cereals. Most effective Group B for hairy fleabane before bolting.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Conyza bonariensis' AND c.product_name = 'Ally Max';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply pre-emergent in wheat and barley. Key wild oat herbicide.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Avena fatua' AND c.product_name = 'Avadex Xtra';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Post-emergent in broadleaf crops for wild oat control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Avena fatua' AND c.product_name = 'Verdict 520 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Post-emergent grass control. Add crop oil for best efficacy.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Avena fatua' AND c.product_name = 'Matador 500 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent brome grass control in wheat and chickpea.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Bromus diandrus' AND c.product_name = 'Boxer Gold';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent application in cereals. Good brome grass control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Hordeum leporinum' AND c.product_name = 'Sakura 850 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply post-emergence in maize and sorghum. Key summer weed control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Chenopodium album' AND c.product_name = 'Atrazine 900 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to nutsedge in peanut and sugarcane. Provides tuber suppression.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Cyperus rotundus' AND c.product_name = 'Nugrass 200 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Best sulfonylurea for nutsedge in maize and sorghum.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Cyperus rotundus' AND c.product_name = 'Halosulfuron 750 WG';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to actively growing serrated tussock at rosette stage.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Nassella trichotoma' AND c.product_name = 'Roundup Ultra MAX';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply at rosette to bolting. Best for small annual thistles.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Cirsium vulgare' AND c.product_name = 'Amicide 625';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Best herbicide for St Johns Wort in pasture. Apply at rosette.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Hypericum perforatum' AND c.product_name = 'MCPA 750 SL';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to rosette stage. Excellent Patersons Curse control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Echium plantagineum' AND c.product_name = 'MCPA 750 SL';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Apply to woody weeds in pasture. Excellent woody broadleaf control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lantana camara' AND c.product_name = 'Grazon Extra';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent in maize and cotton. Good summer annual control.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Amaranthus hybridus' AND c.product_name = 'Dual Gold 960 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Pre-emergent for summer grasses and broadleaves. Apply before sowing.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Echinochloa colona' AND c.product_name = 'Dual Gold 960 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Post-emergent ryegrass control. Most effective DIM against resistant ryegrass.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Aramo 50 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Clethodim post-emergent against ryegrass. Better on younger plants.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Lolium rigidum' AND c.product_name = 'Select 240 EC';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Dock control requires repeat treatments. Apply at rosette stage.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Rumex crispus' AND c.product_name = 'MCPA 750 SL';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'high', 'Broad-spectrum fallow herbicide. Apply to actively growing weeds.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Convolvulus arvensis' AND c.product_name = 'Roundup Ultra MAX';

INSERT INTO agro_weed_chemicals (weed_id, chemical_id, efficacy_rating, application_notes)
SELECT w.id, c.id, 'moderate', 'Bindweed control requires repeat 2,4-D applications as regrowth occurs.'
FROM agro_weeds w, agro_chemicals c
WHERE w.weed_name = 'Convolvulus arvensis' AND c.product_name = 'Amicide 625';
