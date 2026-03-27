/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Added Missing Indexes on Foreign Keys**
     - `chat_messages.user_id` - Index for user's chat history queries
     - `moisture_probes.user_id` - Index for user's probe lookups
     - `moisture_readings.probe_id` - Index for probe reading queries
     - `probe_api_endpoints.user_id` - Index for user's API endpoint queries
     - `profiles.default_location_id` - Index for location lookups
     - `saved_locations.user_id` - Index for user's saved locations

  2. **Removed Unused Indexes**
     - Dropped `idx_profiles_trial_end_date` - Not being used in queries
     - Dropped `idx_profiles_stripe_customer_id` - Not being used in queries

  ## Performance Impact
  
  These indexes will significantly improve query performance for:
  - Fetching user's chat messages
  - Loading user's moisture probes
  - Retrieving probe readings
  - Accessing user's API endpoints
  - Looking up saved locations
  - Profile location references

  ## Security Notes
  
  - Auth DB Connection Strategy and Leaked Password Protection are configuration settings
    that must be changed through the Supabase dashboard, not via SQL migrations
  - These indexes support the existing RLS policies by improving query performance
*/

-- Add index for chat_messages.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
ON public.chat_messages(user_id);

-- Add index for moisture_probes.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_moisture_probes_user_id 
ON public.moisture_probes(user_id);

-- Add index for moisture_readings.probe_id foreign key
CREATE INDEX IF NOT EXISTS idx_moisture_readings_probe_id 
ON public.moisture_readings(probe_id);

-- Add index for probe_api_endpoints.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_probe_api_endpoints_user_id 
ON public.probe_api_endpoints(user_id);

-- Add index for profiles.default_location_id foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id 
ON public.profiles(default_location_id);

-- Add index for saved_locations.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id 
ON public.saved_locations(user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_profiles_trial_end_date;
DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;