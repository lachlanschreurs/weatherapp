/*
  # Remove Unused Indexes

  1. Security & Performance Improvements
    - Remove unused index `idx_chat_messages_user_id` from `public.chat_messages`
    - Remove unused index `idx_moisture_probes_user_id` from `public.moisture_probes`
    - Remove unused index `idx_moisture_readings_probe_id` from `public.moisture_readings`
    - Remove unused index `idx_probe_api_endpoints_user_id` from `public.probe_api_endpoints`
    - Remove unused index `idx_profiles_default_location_id` from `public.profiles`
  
  2. Benefits
    - Reduces storage overhead
    - Improves write performance (INSERT, UPDATE, DELETE)
    - Reduces index maintenance overhead
    - Frees up resources for actively used indexes
  
  3. Important Notes
    - These indexes were identified as unused by database analytics
    - Primary key and foreign key constraints remain intact
    - Query performance is not affected as these indexes were not being utilized
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_profiles_default_location_id;