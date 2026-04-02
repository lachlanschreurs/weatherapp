/*
  # Fix Foreign Key Indexes and Security Issues

  ## Changes
  
  1. Foreign Key Indexes
     - Add index on `chat_messages(user_id)` for foreign key `chat_messages_user_id_fkey`
     - Add index on `notifications(user_id)` for foreign key `notifications_user_id_fkey`
     - Add index on `probe_apis(user_id)` for foreign key `probe_apis_user_id_fkey`
     - Add index on `probe_data(probe_api_id)` for foreign key `probe_data_probe_api_id_fkey`
     - Add index on `probe_data(user_id)` for foreign key `probe_data_user_id_fkey`
  
  2. Remove Unused Indexes
     - Drop `idx_profiles_stripe_customer_id` (unused)
     - Drop `idx_profiles_stripe_subscription_id` (unused)
     - Drop `idx_profiles_stripe_subscription_status` (unused)
  
  ## Performance Impact
  - Foreign key indexes improve JOIN and DELETE CASCADE performance
  - Removing unused indexes reduces write overhead and storage
  
  ## Notes
  - All indexes use `IF NOT EXISTS` to prevent errors on re-run
  - Unused index drops use `IF EXISTS` for safety
*/

-- Add missing foreign key indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_apis_user_id ON public.probe_apis(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_data_probe_api_id ON public.probe_data(probe_api_id);
CREATE INDEX IF NOT EXISTS idx_probe_data_user_id ON public.probe_data(user_id);

-- Remove unused indexes to reduce write overhead
DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;
DROP INDEX IF EXISTS idx_profiles_stripe_subscription_id;
DROP INDEX IF EXISTS idx_profiles_stripe_subscription_status;