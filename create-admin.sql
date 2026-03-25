-- Create Admin User Script
-- Run this in your Supabase SQL Editor to create the admin account

-- First, you need to sign up manually with:
-- Email: lachlan@farmcast
-- Password: lachlan@farmcast

-- Then run this to grant admin privileges:
UPDATE profiles
SET is_admin = true
WHERE email = 'lachlan@farmcast';

-- Verify the admin was created:
SELECT id, email, is_admin, subscription_status
FROM profiles
WHERE email = 'lachlan@farmcast';
