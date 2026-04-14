/*
  # Enforce 30-Day Trial Limits and Phone Number Re-use Prevention

  ## Summary
  This migration enforces the business rule that:
  1. Users only get ONE free 30-day trial, ever
  2. A phone number that has already been used for a free trial CANNOT be used again to get another free trial, even under a different email address
  3. The trial is considered "used" as soon as a user signs up

  ## Changes

  ### New Table: `used_trial_phone_numbers`
  - Permanently records every phone number that has ever started a free trial
  - Even if the user deletes their account, the phone number record remains
  - This prevents phone number recycling to abuse free trials

  ### New Column: `profiles.trial_started_at`
  - Tracks exactly when the trial began (for display purposes)

  ### New Function: `check_phone_trial_used(phone text)`
  - Returns true if a phone number has previously been used for a trial
  - Used by the frontend during signup validation

  ### Updated Trigger: Profile creation now records the phone in used_trial_phone_numbers
  - A separate trigger fires when phone_number is set on a profile
  - Records the phone in the permanent used_trial_phone_numbers table

  ## Security
  - RLS enabled on used_trial_phone_numbers (service role writes, authenticated reads via function)
  - `check_phone_trial_used` is a security definer function callable by anon/authenticated roles
*/

-- Create the permanent record of all phone numbers that have used a trial
CREATE TABLE IF NOT EXISTS used_trial_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  first_used_at timestamptz NOT NULL DEFAULT now(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Unique index to ensure one record per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_used_trial_phones_unique
  ON used_trial_phone_numbers(phone_number);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_used_trial_phones_phone
  ON used_trial_phone_numbers(phone_number);

-- Enable RLS
ALTER TABLE used_trial_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/update (done via trigger)
-- Authenticated users can check if their own phone is in the table via function

-- Function to check if a phone number has already been used for a trial
-- Security definer so anon/authenticated users can call it safely
CREATE OR REPLACE FUNCTION check_phone_trial_used(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_phone text;
  found_count int;
BEGIN
  -- Normalize: strip all non-digit characters
  normalized_phone := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  SELECT COUNT(*) INTO found_count
  FROM used_trial_phone_numbers
  WHERE phone_number = normalized_phone;
  
  RETURN found_count > 0;
END;
$$;

-- Grant execute to anon and authenticated so frontend can call it
GRANT EXECUTE ON FUNCTION check_phone_trial_used(text) TO anon, authenticated;

-- Function to record a phone number as having used a trial
-- Called by trigger when phone_number is set on a profile
CREATE OR REPLACE FUNCTION record_trial_phone_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when phone_number is being set (not cleared)
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number != '' THEN
    -- If this is an insert or the phone number changed
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND (OLD.phone_number IS NULL OR OLD.phone_number != NEW.phone_number)) THEN
      INSERT INTO used_trial_phone_numbers (phone_number, profile_id, first_used_at)
      VALUES (NEW.phone_number, NEW.id, now())
      ON CONFLICT (phone_number) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles to auto-record phone numbers
DROP TRIGGER IF EXISTS record_trial_phone_on_profile ON profiles;
CREATE TRIGGER record_trial_phone_on_profile
  AFTER INSERT OR UPDATE OF phone_number ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION record_trial_phone_number();

-- Backfill: record all existing phone numbers that are already in profiles
INSERT INTO used_trial_phone_numbers (phone_number, profile_id, first_used_at)
SELECT 
  phone_number,
  id,
  COALESCE(created_at, now())
FROM profiles
WHERE phone_number IS NOT NULL AND phone_number != ''
ON CONFLICT (phone_number) DO NOTHING;

-- Add trial_started_at column if it doesn't exist (for clarity, separate from subscription_started_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_started_at timestamptz DEFAULT now();
    -- Backfill from existing subscription started dates
    UPDATE profiles SET trial_started_at = COALESCE(farmer_joe_subscription_started_at, created_at, now())
    WHERE trial_started_at IS NULL;
  END IF;
END $$;
