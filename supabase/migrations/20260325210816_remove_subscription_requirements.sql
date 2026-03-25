/*
  # Remove Subscription Requirements - Make Premium Features Free

  1. Changes
    - Drop the subscriptions table as it's no longer needed
    - Remove subscription-related columns from profiles
    - All authenticated users now get full access to all features
  
  2. Security
    - Maintains existing RLS policies
    - Features now require only authentication, not subscription
*/

DROP TABLE IF EXISTS subscriptions CASCADE;

ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_status CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at CASCADE;