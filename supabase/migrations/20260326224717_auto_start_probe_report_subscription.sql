/*
  # Auto-start probe report subscription on signup

  1. Changes
    - Create trigger function to automatically set probe_report_subscription_started_at when a new user signs up
    - This ensures all new users get the 3-month free trial for weekly probe reports
  
  2. Security
    - Function runs with SECURITY DEFINER to ensure it has proper permissions
    - Only sets the timestamp if it's not already set
*/

-- Create function to auto-start probe report subscription
CREATE OR REPLACE FUNCTION auto_start_probe_report_subscription()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set probe report subscription start date to now if not already set
  IF NEW.probe_report_subscription_started_at IS NULL THEN
    NEW.probe_report_subscription_started_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_probe_subscription ON profiles;

-- Create trigger that fires when a new profile is created
CREATE TRIGGER on_auth_user_created_probe_subscription
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_start_probe_report_subscription();
