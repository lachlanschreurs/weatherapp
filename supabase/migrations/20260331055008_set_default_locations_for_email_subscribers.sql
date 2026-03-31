/*
  # Set Default Locations for Email Subscribers

  1. Purpose
    - Ensure all email subscribers have a default location set
    - This is required for daily forecast emails to work
    
  2. Changes
    - Update email_subscriptions table to set location for subscribers without one
    - Use Melbourne as default location for Australian users
  
  3. Notes
    - Only updates subscribers who don't already have a location
    - Sets timezone to Australia/Melbourne for consistency
*/

-- Update email subscribers without location to use Melbourne as default
UPDATE email_subscriptions
SET 
  location = 'Melbourne, VIC, Australia',
  timezone = 'Australia/Melbourne'
WHERE location IS NULL OR location = '';
