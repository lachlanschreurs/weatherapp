/*
  # Update Email Subscriptions to Use User's Favorite Location

  1. Purpose
    - Automatically set email subscription location based on user's favorite saved location
    - Fall back to Melbourne if user has no favorite location set
    - This ensures daily forecast emails are sent for the right location

  2. Changes
    - Create function to get user's favorite location or default to Melbourne
    - Update trigger to set location from saved_locations when favorite is set
    - Update all existing subscriptions to use favorite location or Melbourne

  3. Security
    - No RLS changes needed
*/

-- Function to get user's favorite location or default to Melbourne
CREATE OR REPLACE FUNCTION get_user_location_for_email(user_id_param uuid)
RETURNS TABLE(location_name text, location_timezone text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fav_location RECORD;
BEGIN
  -- Try to get favorite location
  SELECT 
    name || CASE WHEN state IS NOT NULL THEN ', ' || state ELSE '' END || ', ' || country as loc_name,
    'Australia/Melbourne' as tz
  INTO fav_location
  FROM saved_locations
  WHERE saved_locations.user_id = user_id_param
    AND is_favorite = true
  LIMIT 1;

  -- If found, return it
  IF FOUND THEN
    RETURN QUERY SELECT fav_location.loc_name, fav_location.tz;
  ELSE
    -- Default to Melbourne
    RETURN QUERY SELECT 'Melbourne, VIC, Australia'::text, 'Australia/Melbourne'::text;
  END IF;
END;
$$;

-- Update existing email subscriptions to use favorite location or Melbourne
DO $$
DECLARE
  sub RECORD;
  loc RECORD;
BEGIN
  FOR sub IN SELECT user_id FROM email_subscriptions
  LOOP
    SELECT * INTO loc FROM get_user_location_for_email(sub.user_id);
    
    UPDATE email_subscriptions
    SET 
      location = loc.location_name,
      timezone = loc.location_timezone
    WHERE user_id = sub.user_id;
  END LOOP;
END;
$$;

-- Create trigger to update email subscription location when favorite changes
CREATE OR REPLACE FUNCTION update_email_subscription_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loc RECORD;
BEGIN
  -- Only process if is_favorite is being set to true
  IF NEW.is_favorite = true THEN
    -- Get location details
    SELECT 
      NEW.name || CASE WHEN NEW.state IS NOT NULL THEN ', ' || NEW.state ELSE '' END || ', ' || NEW.country as location_name,
      'Australia/Melbourne' as location_timezone
    INTO loc;

    -- Update email subscription for this user
    UPDATE email_subscriptions
    SET 
      location = loc.location_name,
      timezone = loc.location_timezone
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_favorite_location_changed ON saved_locations;
CREATE TRIGGER on_favorite_location_changed
  AFTER INSERT OR UPDATE OF is_favorite ON saved_locations
  FOR EACH ROW
  WHEN (NEW.is_favorite = true)
  EXECUTE FUNCTION update_email_subscription_location();
