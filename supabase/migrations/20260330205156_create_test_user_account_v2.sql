/*
  # Create Test User Account
  
  Creates a test user account for testing email subscriptions and the application.
  
  ## Changes
  1. Inserts a test user into auth.users
  2. The triggers will automatically:
     - Create a profile entry
     - Create an email subscription entry
     - Set up the 1-month trial period
  
  ## Test User Details
  - Email: schreurslach@icloud.com
  - Password: TestPassword123!
  - Trial: 1 month from creation
*/

-- Create test user if they don't already exist
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'schreurslach@icloud.com';
  
  -- Only insert if user doesn't exist
  IF test_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'schreurslach@icloud.com',
      crypt('TestPassword123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;
