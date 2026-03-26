/*
  # Add Free Trial Period for Email Subscriptions

  ## Overview
  Adds trial period tracking to email subscriptions so users get 3 months free
  before being required to have an active Farmer Joe subscription.

  ## Changes

  1. Add trial tracking columns to email_subscriptions
    - `trial_start_date` - When the trial started (defaults to creation date)
    - `trial_end_date` - When the trial ends (3 months from start)
    - `trial_active` - Whether the trial is currently active

  2. Update trigger to set trial dates on creation
    - Automatically sets trial_end_date to 3 months from signup
    - Sets trial_active to true by default

  3. Add function to check if email features should be enabled
    - Returns true if trial is active OR user has premium subscription
    - Used by edge functions to determine if emails should be sent

  ## Security
    - No RLS changes needed (inherits from existing table)
    - Functions are SECURITY DEFINER for internal use

  ## Impact
  - New users get 3-month free trial automatically
  - After trial, email reports require Farmer Joe subscription
  - Existing users get trial period backdated from their signup
*/

-- Add trial tracking columns to email_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_subscriptions' AND column_name = 'trial_start_date'
  ) THEN
    ALTER TABLE email_subscriptions 
    ADD COLUMN trial_start_date timestamptz DEFAULT now(),
    ADD COLUMN trial_end_date timestamptz DEFAULT (now() + interval '3 months'),
    ADD COLUMN trial_active boolean DEFAULT true;
  END IF;
END $$;

-- Update existing subscriptions to have trial period
UPDATE email_subscriptions 
SET 
  trial_start_date = created_at,
  trial_end_date = created_at + interval '3 months',
  trial_active = CASE 
    WHEN created_at + interval '3 months' > now() THEN true 
    ELSE false 
  END
WHERE trial_start_date IS NULL;

-- Function to automatically set trial dates on new subscriptions
CREATE OR REPLACE FUNCTION set_email_subscription_trial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trial_start_date := now();
  NEW.trial_end_date := now() + interval '3 months';
  NEW.trial_active := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set trial dates on insert
DROP TRIGGER IF EXISTS set_trial_dates_on_email_subscription ON email_subscriptions;
CREATE TRIGGER set_trial_dates_on_email_subscription
  BEFORE INSERT ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_email_subscription_trial();

-- Function to check if user should receive email reports
-- Returns true if trial is active OR user has premium subscription
CREATE OR REPLACE FUNCTION should_send_email_reports(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  subscription_record RECORD;
  has_premium boolean;
BEGIN
  -- Get email subscription record
  SELECT * INTO subscription_record
  FROM email_subscriptions
  WHERE user_id = user_uuid;
  
  -- If no subscription record, return false
  IF subscription_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if trial is still active
  IF subscription_record.trial_active AND subscription_record.trial_end_date > now() THEN
    RETURN true;
  END IF;
  
  -- Check if user has active premium subscription
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid 
    AND status = 'active'
    AND subscription_tier = 'premium'
  ) INTO has_premium;
  
  RETURN has_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trial_active status (can be run periodically)
CREATE OR REPLACE FUNCTION update_trial_status()
RETURNS void AS $$
BEGIN
  UPDATE email_subscriptions
  SET trial_active = false
  WHERE trial_active = true 
  AND trial_end_date <= now();
END;
$$ LANGUAGE plpgsql;

-- Create index for efficient trial lookups
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_trial_active 
ON email_subscriptions(trial_active) 
WHERE trial_active = true;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION should_send_email_reports(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_trial_status() TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION should_send_email_reports(uuid) IS 'Checks if user should receive email reports based on trial status or premium subscription';
COMMENT ON COLUMN email_subscriptions.trial_end_date IS 'Date when the 3-month free trial ends';
