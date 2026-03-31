/*
  # Remove Unused Indexes

  1. Changes
    - Drop unused indexes that are not being utilized by queries
    - Improves database performance by reducing index maintenance overhead
    - Frees up storage space

  2. Indexes Removed
    - idx_saved_locations_primary (unused)
    - idx_probe_apis_user_id (unused)
    - idx_probe_data_user_id (unused)
    - idx_probe_data_recorded_at (unused)
    - idx_chat_messages_user_id (unused)
    - idx_chat_messages_created_at (unused)
    - idx_notifications_user_id (unused)
    - idx_notifications_unread (unused)
    - idx_profiles_stripe_customer (unused)
    - idx_probe_data_probe_api_id (unused)

  3. Performance Impact
    - Reduces overhead on INSERT, UPDATE, DELETE operations
    - Decreases storage requirements
*/

DROP INDEX IF EXISTS idx_saved_locations_primary;
DROP INDEX IF EXISTS idx_probe_apis_user_id;
DROP INDEX IF EXISTS idx_probe_data_user_id;
DROP INDEX IF EXISTS idx_probe_data_recorded_at;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_unread;
DROP INDEX IF EXISTS idx_profiles_stripe_customer;
DROP INDEX IF EXISTS idx_probe_data_probe_api_id;
