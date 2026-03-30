/*
  # Enable pg_cron Extension
  
  1. Changes
    - Enable pg_cron extension for scheduled jobs
    
  2. Notes
    - This extension must be enabled before creating cron jobs
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
