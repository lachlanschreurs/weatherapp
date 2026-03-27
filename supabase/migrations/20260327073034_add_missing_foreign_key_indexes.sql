/*
  # Add Missing Foreign Key Indexes
  
  1. Changes
    - Add indexes for all unindexed foreign keys to improve query performance
    - chat_messages.user_id
    - moisture_probes.user_id
    - moisture_readings.probe_id
    - probe_api_endpoints.user_id
    - profiles.default_location_id
  
  2. Performance Impact
    - Significantly improves JOIN performance
    - Speeds up foreign key constraint checks
    - Reduces query execution time for filtered queries on these columns
*/

-- Add index for chat_messages.user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
ON public.chat_messages(user_id);

-- Add index for moisture_probes.user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id 
ON public.moisture_probes(user_id);

-- Add index for moisture_readings.probe_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id 
ON public.moisture_readings(probe_id);

-- Add index for probe_api_endpoints.user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id 
ON public.probe_api_endpoints(user_id);

-- Add index for profiles.default_location_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id 
ON public.profiles(default_location_id);
