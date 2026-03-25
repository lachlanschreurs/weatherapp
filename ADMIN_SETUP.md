# Admin Setup Guide

## Creating the Admin Account

### Step 1: Sign Up
1. Open the app and click "Sign Up"
2. Use these credentials:
   - **Email:** lachlan@farmcast
   - **Password:** lachlan@farmcast

### Step 2: Grant Admin Access
1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Run this query:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'lachlan@farmcast';
```

4. Refresh the app - you now have full admin access!

## Making Other Users Admin

To grant admin access to any other user account:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'their-email@example.com';
```

### Alternative: Using the API

You can also call the make-admin edge function:

```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/make-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### What Admin Access Provides

When a user has `is_admin = true` in their profile:
- Full access to all premium features
- No subscription or trial restrictions
- No expiration date
- Access to all forecasts and premium content

### Security Notes

- Admin status can only be set via direct database access or service role operations
- Users cannot promote themselves to admin through the UI
- The is_admin field is read-only for regular authenticated users
