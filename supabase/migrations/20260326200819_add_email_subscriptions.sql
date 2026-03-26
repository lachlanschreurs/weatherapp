/*
  # Email Subscriptions Feature

  1. New Tables
    - `email_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text, user's email address)
      - `daily_forecast_enabled` (boolean, subscribe to daily 7am weather forecasts)
      - `weekly_probe_report_enabled` (boolean, subscribe to weekly soil probe reports)
      - `location` (text, user's location for weather reports)
      - `timezone` (text, user's timezone for scheduling)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_subscriptions` table
    - Add policy for authenticated users to read their own subscriptions
    - Add policy for authenticated users to insert their own subscriptions
    - Add policy for authenticated users to update their own subscriptions
    - Add policy for authenticated users to delete their own subscriptions
*/

CREATE TABLE IF NOT EXISTS email_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  daily_forecast_enabled boolean DEFAULT true,
  weekly_probe_report_enabled boolean DEFAULT true,
  location text,
  timezone text DEFAULT 'Australia/Sydney',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_daily ON email_subscriptions(daily_forecast_enabled) WHERE daily_forecast_enabled = true;
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_weekly ON email_subscriptions(weekly_probe_report_enabled) WHERE weekly_probe_report_enabled = true;

-- Enable RLS
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own email subscription"
  ON email_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own email subscription"
  ON email_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email subscription"
  ON email_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email subscription"
  ON email_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS email_subscriptions_updated_at ON email_subscriptions;
CREATE TRIGGER email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_email_subscriptions_updated_at();