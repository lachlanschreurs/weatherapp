# Admin Setup Guide

## Making a User an Admin

To grant admin access to a user account, you need to update their profile in the database.

### Quick Method: Using Supabase Dashboard SQL Editor

1. First, create an account by signing up in the app
2. Go to your Supabase project dashboard at https://supabase.com/dashboard
3. Navigate to the SQL Editor
4. Run this query (replace the email with your account email):

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

5. Refresh the app - you now have full admin access!

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
