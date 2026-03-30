# Daily Email Cron Job Setup

## Issue Found
The daily emails were not sending because the database cron jobs couldn't access the service role key needed to call the edge functions.

## What Was Fixed

1. **Enabled pg_net extension** - Required for making HTTP requests from the database
2. **Created wrapper functions** - `trigger_daily_forecast_email()` and `trigger_weekly_probe_report()`
3. **Updated cron jobs** - Now using the correct Supabase URL and calling the wrapper functions

## Required Configuration

**CRITICAL**: You must configure the service role key in the database for the cron jobs to work.

### Steps to Configure:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ryohnlsfnbuizblcpbyd
2. Navigate to **SQL Editor**
3. Run this command (replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key from Settings > API):

```sql
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

4. To get your service role key:
   - Go to Settings > API in your Supabase dashboard
   - Copy the `service_role` key (NOT the anon key)
   - It starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

5. After setting the key, test the function:

```sql
SELECT trigger_daily_forecast_email();
```

## Cron Schedule

- **Daily Forecast**: Runs every day at 8:00 PM UTC (7:00 AM AEDT next day)
- **Weekly Probe Report**: Runs every Sunday at 8:00 PM UTC (7:00 AM AEDT Monday)

## Verification

To verify the cron jobs are working:

```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname LIKE '%forecast%' OR jobname LIKE '%probe%';

-- Check last run details
SELECT * FROM cron.job_run_details ORDER BY runid DESC LIMIT 10;

-- Manually trigger for testing
SELECT trigger_daily_forecast_email();
```

## Why This Will Work Tomorrow

Once the service role key is configured:
1. ✅ pg_net extension is enabled
2. ✅ Cron jobs are scheduled correctly (8:00 PM UTC = 7:00 AM AEDT)
3. ✅ Wrapper functions are created with correct Supabase URL
4. ⚠️ **YOU MUST**: Set the service role key using the SQL command above

After setting the service role key, emails will send automatically every morning at 7 AM AEDT.
