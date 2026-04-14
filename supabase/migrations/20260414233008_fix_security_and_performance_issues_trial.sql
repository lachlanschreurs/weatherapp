/*
  # Fix Security and Performance Issues

  ## Changes

  1. Add missing foreign key indexes
     - `historical_weather_data.user_id` index
     - `used_trial_phone_numbers.profile_id` index

  2. Remove unused indexes
     - `idx_probe_apis_user_id` on probe_apis
     - `idx_probe_csv_imports_user_id` on probe_csv_imports
     - `idx_probe_data_probe_api_id` on probe_data
     - `idx_probe_data_user_id` on probe_data
     - `idx_probe_import_mappings_user_id` on probe_import_mappings
     - `agri_entries_name_idx` on agri_entries
     - `idx_used_trial_phones_phone` on used_trial_phone_numbers (covered by unique index)

  3. Add RLS policies for used_trial_phone_numbers
     - Authenticated users can check if a phone number is in the table (via function only)
     - Service role handles inserts via trigger (no policy needed for service role)
     - Add a SELECT policy so authenticated users can see their own record
*/

-- Add missing foreign key covering indexes
CREATE INDEX IF NOT EXISTS idx_historical_weather_data_user_id
  ON historical_weather_data(user_id);

CREATE INDEX IF NOT EXISTS idx_used_trial_phones_profile_id
  ON used_trial_phone_numbers(profile_id);

-- Remove unused indexes (drop only if they exist)
DROP INDEX IF EXISTS idx_probe_apis_user_id;
DROP INDEX IF EXISTS idx_probe_csv_imports_user_id;
DROP INDEX IF EXISTS idx_probe_data_probe_api_id;
DROP INDEX IF EXISTS idx_probe_data_user_id;
DROP INDEX IF EXISTS idx_probe_import_mappings_user_id;
DROP INDEX IF EXISTS agri_entries_name_idx;
DROP INDEX IF EXISTS idx_used_trial_phones_phone;

-- Add RLS policies for used_trial_phone_numbers
-- Authenticated users can view their own record
CREATE POLICY "Users can view their own trial phone record"
  ON used_trial_phone_numbers
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
