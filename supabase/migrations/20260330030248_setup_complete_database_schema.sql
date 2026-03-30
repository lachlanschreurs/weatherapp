/*
  # Complete Database Setup for FarmCast
  
  1. Tables Created
    - profiles: User profiles with subscription info
    - saved_locations: User's favorite weather locations
    - email_subscriptions: Email notification preferences
    - probe_apis: API configurations for soil probes
    - probe_data: Soil probe readings
    - chat_messages: Farmer Joe chat history
    - notifications: User notifications
    
  2. Security
    - All tables have RLS enabled
    - Policies restrict access to user's own data
    - Service role has admin access for backend operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone_number text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  farmer_joe_subscription_status text DEFAULT 'none' CHECK (farmer_joe_subscription_status IN ('none', 'active', 'cancelled', 'expired')),
  farmer_joe_subscription_started_at timestamptz,
  farmer_joe_subscription_ends_at timestamptz,
  farmer_joe_messages_count integer DEFAULT 0,
  email_subscription_started_at timestamptz,
  probe_report_subscription_started_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_end_date timestamptz DEFAULT (now() + INTERVAL '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create saved_locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_primary boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_primary ON saved_locations(user_id, is_primary) WHERE is_primary = true;

ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own locations"
  ON saved_locations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create email_subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  daily_forecast_enabled boolean DEFAULT true,
  weekly_probe_report_enabled boolean DEFAULT false,
  location text,
  timezone text DEFAULT 'Australia/Sydney',
  trial_active boolean DEFAULT true,
  trial_end_date timestamptz DEFAULT (now() + INTERVAL '1 month'),
  requires_subscription boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_daily ON email_subscriptions(daily_forecast_enabled) WHERE daily_forecast_enabled = true;

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email subscription"
  ON email_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email subscription"
  ON email_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to email subscriptions"
  ON email_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create probe_apis table
CREATE TABLE IF NOT EXISTS probe_apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_name text NOT NULL,
  api_key text NOT NULL,
  api_endpoint text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_probe_apis_user_id ON probe_apis(user_id);

ALTER TABLE probe_apis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own probe APIs"
  ON probe_apis FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create probe_data table
CREATE TABLE IF NOT EXISTS probe_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  probe_api_id uuid REFERENCES probe_apis(id) ON DELETE CASCADE,
  location_name text,
  depth_cm numeric,
  temperature_c numeric,
  moisture_percent numeric,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_probe_data_user_id ON probe_data(user_id);
CREATE INDEX IF NOT EXISTS idx_probe_data_recorded_at ON probe_data(recorded_at DESC);

ALTER TABLE probe_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own probe data"
  ON probe_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own probe data"
  ON probe_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert', 'success')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function for new user profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_end_date)
  VALUES (NEW.id, NEW.email, now() + INTERVAL '1 month')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create trigger function for email subscriptions
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

DROP TRIGGER IF EXISTS on_auth_user_created_email_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_email_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_email_subscription_on_signup();

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_probe_data_probe_api_id ON probe_data(probe_api_id);
