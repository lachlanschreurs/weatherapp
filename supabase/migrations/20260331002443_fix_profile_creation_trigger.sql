/*
  # Fix Profile Creation Trigger

  1. Issue
    - The trigger `on_auth_user_created` is calling the wrong function
    - It's calling `trigger_welcome_email` instead of `handle_new_user`
    - This means new user profiles are NOT being created in the profiles table

  2. Changes
    - Drop and recreate the trigger to call the correct function `handle_new_user`
    - This ensures profiles are created when users sign up

  3. Security
    - No security changes, just fixing the trigger function reference
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
