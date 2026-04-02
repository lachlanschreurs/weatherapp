/*
  # Add Trial End Date Field
  
  This migration adds the trial_end_date field back to profiles table
  to track when free trials expire.
  
  1. Changes
    - Add `trial_end_date` column (timestamptz)
    - Set default trial end date to 30 days from now for new signups
    
  2. Notes
    - Field is nullable to support existing users
    - Trial period is 30 days (1 month)
*/

-- Add trial_end_date if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_end_date timestamptz;
  END IF;
END $$;

-- Update the signup trigger to set trial_end_date
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    farmer_joe_subscription_status,
    farmer_joe_subscription_started_at,
    email_subscription_started_at,
    probe_report_subscription_started_at,
    trial_end_date,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    'active',
    now(),
    now(),
    now(),
    now() + interval '30 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
