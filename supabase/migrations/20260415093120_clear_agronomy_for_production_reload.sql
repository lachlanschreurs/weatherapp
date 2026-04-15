/*
  # Clear all agronomy data for full production reload

  Truncates all agronomy tables in dependency order so fresh production data can be inserted.
*/

TRUNCATE agro_weed_chemicals, agro_pest_chemicals, agro_disease_chemicals RESTART IDENTITY CASCADE;
TRUNCATE agro_weeds, agro_pests, agro_diseases, agro_chemicals RESTART IDENTITY CASCADE;
