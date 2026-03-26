/*
  # Send Welcome Email on User Signup

  ## Overview
  Automatically send a welcome email to new users when they sign up.
  This migration adds a trigger that calls the send-welcome-email edge function
  when a new profile is created.

  ## Changes

  1. Create function to send welcome email via edge function
    - Triggers when new profile is created
    - Calls send-welcome-email edge function
    - Passes user email and default location
    - Runs asynchronously so signup isn't blocked

  2. Create trigger on profiles table
    - Fires after new profile is inserted
    - Executes welcome email function

  ## Security
    - Function runs as SECURITY DEFINER
    - Only sends email for new signups
    - No sensitive data exposed

  ## Impact
  - All new users automatically receive welcome email
  - Email includes information about daily forecasts and weekly reports
  - Users informed about 3-month free trial
*/

-- Function to send welcome email via edge function
CREATE OR REPLACE FUNCTION send_welcome_email_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  payload jsonb;
BEGIN
  -- Build the edge function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email';
  
  -- Build the payload
  payload := jsonb_build_object(
    'userId', NEW.id,
    'email', NEW.email,
    'location', 'Sydney, Australia'
  );
  
  -- Make async HTTP request to edge function
  -- Using pg_net extension for async requests
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON profiles;

-- Create trigger that fires when a new profile is created
CREATE TRIGGER on_profile_created_send_welcome_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_on_signup();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_welcome_email_on_signup() TO authenticated;
