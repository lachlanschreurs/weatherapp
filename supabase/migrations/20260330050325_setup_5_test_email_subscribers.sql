/*
  # Setup 5 Test Email Subscribers

  1. Creates 5 email subscriptions for testing:
     - lachlan@schreurs.com.au
     - farmer1@farmcast.test
     - farmer2@farmcast.test
     - farmer3@farmcast.test
     - farmer4@farmcast.test

  2. Each subscription includes:
     - Default location: Melbourne, Australia
     - Timezone: Australia/Melbourne
     - Daily forecast: Enabled
     - Weekly probe report: Enabled
     - Trial period: 1 month

  3. Notes:
     - Subscriptions work without user_id (for users who haven't signed up yet)
     - When users sign up with these emails, their accounts will link automatically
*/

-- Delete any existing test subscriptions to start fresh
DELETE FROM email_subscriptions 
WHERE email IN (
  'lachlan@schreurs.com.au',
  'farmer1@farmcast.test',
  'farmer2@farmcast.test',
  'farmer3@farmcast.test',
  'farmer4@farmcast.test'
);

-- Insert 5 test email subscriptions
INSERT INTO email_subscriptions (
  user_id,
  email,
  daily_forecast_enabled,
  weekly_probe_report_enabled,
  location,
  timezone,
  trial_active,
  trial_end_date,
  requires_subscription,
  created_at,
  updated_at
) VALUES
  (NULL, 'lachlan@schreurs.com.au', true, true, 'Melbourne, Australia', 'Australia/Melbourne', true, NOW() + INTERVAL '1 month', false, NOW(), NOW()),
  (NULL, 'farmer1@farmcast.test', true, true, 'Melbourne, Australia', 'Australia/Melbourne', true, NOW() + INTERVAL '1 month', false, NOW(), NOW()),
  (NULL, 'farmer2@farmcast.test', true, true, 'Melbourne, Australia', 'Australia/Melbourne', true, NOW() + INTERVAL '1 month', false, NOW(), NOW()),
  (NULL, 'farmer3@farmcast.test', true, true, 'Melbourne, Australia', 'Australia/Melbourne', true, NOW() + INTERVAL '1 month', false, NOW(), NOW()),
  (NULL, 'farmer4@farmcast.test', true, true, 'Melbourne, Australia', 'Australia/Melbourne', true, NOW() + INTERVAL '1 month', false, NOW(), NOW());
