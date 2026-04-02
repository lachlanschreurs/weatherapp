/*
  # Fix Welcome Email Trigger
  
  1. Purpose
    - Update welcome email trigger to use hardcoded Supabase URL
    - Ensure new users receive welcome emails automatically
  
  2. Changes
    - Replace function to use direct URL instead of app.settings
*/

-- Drop and recreate the welcome email trigger function with hardcoded URL
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
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

  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://afiqwbvdnrrzqkxjwddh.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3YnZkbnJyenFreGp3ZGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzYyMzUsImV4cCI6MjA4OTk1MjIzNX0.P49AvWPm90_9Tbhzg47EIHLiRYlA7vVQeVcLAjbqHSE"}'::jsonb,
    body := jsonb_build_object(
      'userId', NEW.id::text,
      'email', user_email,
      'location', user_location
    )
  );

  RETURN NEW;
END;
$$;
