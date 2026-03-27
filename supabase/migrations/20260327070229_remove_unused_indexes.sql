/*
  # Remove Unused Indexes
  
  1. Performance Improvements
    - Remove unused indexes to reduce storage overhead
    - Improve insert/update performance by eliminating unnecessary index maintenance
  
  2. Indexes Being Removed
    - `idx_probe_api_endpoints_user_id` on probe_api_endpoints
    - `idx_profiles_default_location_id` on profiles
    - `idx_saved_locations_user_id` on saved_locations
    - `idx_chat_messages_user_id` on chat_messages
    - `idx_moisture_probes_user_id` on moisture_probes
    - `idx_moisture_readings_probe_id` on moisture_readings
    - `idx_saved_locations_is_favorite` on saved_locations
  
  3. Notes
    - These indexes were identified as unused by database monitoring
    - Removing unused indexes improves write performance and reduces storage costs
    - Primary key and foreign key constraints still provide necessary query optimization
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_profiles_default_location_id;
DROP INDEX IF EXISTS idx_saved_locations_user_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_saved_locations_is_favorite;