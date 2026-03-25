/*
  # Add Foreign Key Indexes and Security Fixes

  1. Performance Improvements
    - Add indexes for foreign keys on `moisture_probes.user_id`
    - Add indexes for foreign keys on `moisture_readings.probe_id`
    - Add indexes for foreign keys on `probe_api_endpoints.user_id`
    - Add indexes for foreign keys on `saved_locations.user_id`
    - Remove unused index `idx_profiles_default_location_id`

  2. Security Notes
    - Foreign key indexes improve query performance and prevent table scans
    - These indexes are critical for RLS policy performance
    - Auth DB connection strategy and leaked password protection must be configured via Supabase Dashboard

  3. Important Notes
    - Auth DB Connection Strategy: Must be changed to percentage-based in Supabase Dashboard > Settings > Database
    - Leaked Password Protection: Must be enabled in Supabase Dashboard > Authentication > Policies
*/

-- Add index for moisture_probes.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id 
  ON moisture_probes(user_id);

-- Add index for moisture_readings.probe_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id 
  ON moisture_readings(probe_id);

-- Add index for probe_api_endpoints.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id 
  ON probe_api_endpoints(user_id);

-- Add index for saved_locations.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id 
  ON saved_locations(user_id);

-- Remove unused index on profiles.default_location_id
DROP INDEX IF EXISTS idx_profiles_default_location_id;

-- Add additional performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_moisture_readings_reading_timestamp 
  ON moisture_readings(probe_id, reading_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_saved_locations_last_accessed 
  ON saved_locations(user_id, last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_locations_primary 
  ON saved_locations(user_id, is_primary) 
  WHERE is_primary = true;
