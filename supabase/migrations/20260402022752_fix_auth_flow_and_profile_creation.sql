/*
  # Fix Auth Flow and Profile Creation

  This migration fixes the authentication and onboarding flow to ensure new users
  are properly initialized without race conditions.

  ## Changes
  
  1. Profile Creation Function
    - Enhanced handle_new_user() to automatically set all user defaults
    - Sets subscription status to 'active' for all new users (free service)
    - Activates email and probe report subscriptions immediately
    - Uses ON CONFLICT to handle race conditions gracefully
    
  2. Email Subscription Creation
    - Ensures email subscription is created automatically
    - Sets all new users as active immediately
    
  3. RLS Policies
    - Add policy for users to insert their own profile (for manual creation fallback)
    - Keep existing policies intact
    
  ## Notes
  
  - All new users get full access immediately (no payment required)
  - Profile creation is idempotent (safe to call multiple times)
  - Race conditions are handled with ON CONFLICT DO UPDATE
*/

-- Drop and recreate the handle_new_user function with better defaults
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile with all defaults set for free access
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    farmer_joe_subscription_status,
    farmer_joe_subscription_started_at,
    email_subscription_started_at,
    probe_report_subscription_started_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    'active',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    farmer_joe_subscription_status = COALESCE(profiles.farmer_joe_subscription_status, 'active'),
    farmer_joe_subscription_started_at = COALESCE(profiles.farmer_joe_subscription_started_at, NOW()),
    email_subscription_started_at = COALESCE(profiles.email_subscription_started_at, NOW()),
    probe_report_subscription_started_at = COALESCE(profiles.probe_report_subscription_started_at, NOW()),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enhanced email subscription creation function
CREATE OR REPLACE FUNCTION create_email_subscription_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create email subscription for new profile
  INSERT INTO public.email_subscriptions (
    user_id,
    email,
    daily_forecast_enabled,
    weekly_probe_report_enabled,
    trial_active,
    requires_subscription,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    true,
    true,
    true,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate the email subscription trigger
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_email_subscription_on_signup();

-- Add policy for users to insert their own profile (fallback for manual creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Backfill any existing users without active subscriptions
UPDATE profiles
SET 
  farmer_joe_subscription_status = 'active',
  farmer_joe_subscription_started_at = COALESCE(farmer_joe_subscription_started_at, NOW()),
  email_subscription_started_at = COALESCE(email_subscription_started_at, NOW()),
  probe_report_subscription_started_at = COALESCE(probe_report_subscription_started_at, NOW()),
  updated_at = NOW()
WHERE farmer_joe_subscription_status IS NULL
   OR farmer_joe_subscription_status = 'none'
   OR email_subscription_started_at IS NULL
   OR probe_report_subscription_started_at IS NULL;