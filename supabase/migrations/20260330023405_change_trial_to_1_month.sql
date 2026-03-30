/*
  # Change Trial Period from 3 Months to 1 Month
  
  1. Changes
    - Update trial period from 3 months to 1 month for new signups
    - Update trigger functions to set trial_end_date to 1 month instead of 3 months
    - Update existing active trials to reflect 1 month period
    
  2. Security
    - Maintains existing RLS policies
    - Only affects trial_end_date calculation
*/

-- Drop existing trigger function and recreate with 1 month trial
DROP FUNCTION IF EXISTS handle_new_user_profile() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set trial end date to 1 month from now
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date = now() + INTERVAL '1 month';
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Update email subscriptions trigger to use 1 month
DROP FUNCTION IF EXISTS create_email_subscription_on_signup() CASCADE;

CREATE OR REPLACE FUNCTION create_email_subscription_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.email_subscriptions (
    user_id,
    email,
    daily_forecast_enabled,
    trial_active,
    trial_end_date,
    requires_subscription
  ) VALUES (
    NEW.id,
    NEW.email,
    true,
    true,
    now() + INTERVAL '1 month',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_email_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_email_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_email_subscription_on_signup();

-- Update existing active trials that are beyond 1 month to end in 1 month from signup
UPDATE profiles
SET trial_end_date = email_subscription_started_at + INTERVAL '1 month'
WHERE trial_end_date > now()
  AND email_subscription_started_at IS NOT NULL
  AND trial_end_date > email_subscription_started_at + INTERVAL '1 month';

-- Update email subscriptions table
UPDATE email_subscriptions
SET trial_end_date = created_at + INTERVAL '1 month'
WHERE trial_active = true
  AND trial_end_date > now()
  AND created_at IS NOT NULL
  AND trial_end_date > created_at + INTERVAL '1 month';
