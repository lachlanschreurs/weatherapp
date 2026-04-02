/*
  # Add Welcome Email Trigger on User Signup
  
  1. Purpose
    - Automatically send welcome emails to new users when they sign up
    - Trigger fires when a new profile is created in the profiles table
    - Uses pg_net extension to call the send-welcome-email edge function
  
  2. Changes
    - Creates trigger function that calls send-welcome-email edge function
    - Attaches trigger to profiles table on INSERT
    - Sends user's email and default location to the welcome email function
  
  3. Important Notes
    - Every new signup will receive a welcome email immediately
    - Uses pg_net.http_post for async HTTP requests
    - Runs with security definer to ensure proper permissions
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.send_welcome_email_on_signup();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
  user_email text;
  user_location text;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Skip if no email found
  IF user_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user's favorite location if they have one
  SELECT name INTO user_location
  FROM public.saved_locations
  WHERE user_id = NEW.id
    AND (is_primary = true OR is_favorite = true)
  ORDER BY is_primary DESC NULLS LAST, last_accessed_at DESC NULLS LAST
  LIMIT 1;

  -- Default to Melbourne if no location found
  IF user_location IS NULL THEN
    user_location := 'Melbourne, Australia';
  END IF;

  -- Build the function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email';

  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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

-- Create the trigger
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();

-- Verify the trigger was created
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.profiles'::regclass 
  AND tgname = 'send_welcome_email_trigger';
