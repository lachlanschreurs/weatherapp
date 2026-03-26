/*
  # Add Weekly Probe Report Subscription

  1. Changes to profiles table
    - Add `probe_report_subscription_started_at` (timestamptz) - When probe report subscription started
    - Add index for faster queries on probe report subscription date
  
  2. Notes
    - Probe reports are free for the first 3 months after signup
    - After 3 months, they require an active Farmer Joe subscription
    - Subscription start date is automatically set on user signup
*/

-- Add probe report subscription tracking to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'probe_report_subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN probe_report_subscription_started_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for probe report subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_probe_report_subscription 
  ON profiles(probe_report_subscription_started_at);

-- Update existing users to have probe report subscription started at their signup date
UPDATE profiles 
SET probe_report_subscription_started_at = created_at 
WHERE probe_report_subscription_started_at IS NULL;
