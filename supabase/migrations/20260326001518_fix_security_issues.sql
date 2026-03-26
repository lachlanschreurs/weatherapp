/*
  # Fix Database Security Issues

  This migration addresses the following security concerns:
  
  1. Indexing Issues
    - Add missing index for `profiles.default_location_id` foreign key
    - Remove unused indexes that are not being utilized:
      - `idx_moisture_probes_user_id`
      - `idx_moisture_readings_probe_id`
      - `idx_probe_api_endpoints_user_id`
      - `idx_saved_locations_user_id`
      - `idx_moisture_readings_reading_timestamp`
      - `idx_saved_locations_last_accessed`
      - `idx_saved_locations_primary`
  
  2. Performance Optimization
    - Ensure all foreign key columns have covering indexes for optimal query performance
    
  Note: Auth configuration (connection strategy and leaked password protection) 
  must be configured via Supabase Dashboard as they are not exposed via SQL.
*/

-- Add covering index for profiles.default_location_id foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id 
  ON profiles(default_location_id);

-- Drop unused indexes to reduce maintenance overhead
DROP INDEX IF EXISTS idx_moisture_probes_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_probe_id;
DROP INDEX IF EXISTS idx_probe_api_endpoints_user_id;
DROP INDEX IF EXISTS idx_saved_locations_user_id;
DROP INDEX IF EXISTS idx_moisture_readings_reading_timestamp;
DROP INDEX IF EXISTS idx_saved_locations_last_accessed;
DROP INDEX IF EXISTS idx_saved_locations_primary;