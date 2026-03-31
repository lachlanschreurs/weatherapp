/*
  # Add Welcome Email Trigger

  1. New Functions
    - `trigger_welcome_email()` - Sends welcome email when new user signs up
    - Uses pg_net extension to call the send-welcome-email edge function

  2. New Triggers
    - `on_auth_user_created` - Fires after new user is inserted into auth.users
    - Automatically sends welcome email with user's email and default location

  3. Security
    - Function runs with SECURITY DEFINER to allow access to auth schema
    - Uses service role context to call edge function
*/

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  function_url text;
  service_role_key text;
  user_email text;
  user_location text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email';
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  user_email := NEW.email;
  
  SELECT location INTO user_location
  FROM email_subscriptions
  WHERE user_id = NEW.id
  LIMIT 1;
  
  IF user_location IS NULL THEN
    user_location := 'Sydney, Australia';
  END IF;
  
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'userId', NEW.id::text,
      'email', user_email,
      'location', user_location
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
