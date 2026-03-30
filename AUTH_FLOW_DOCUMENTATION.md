# Authentication Flow Documentation

## Current Status: FIXED ✓

The authentication system is now properly configured to create users in Supabase Authentication for all signup paths.

## How Authentication Works

### 1. Website Signup Flow (Primary Path)

**Location:** `src/components/AuthModal.tsx` lines 174-238

**Steps:**
1. User fills out signup form (name, email, password, phone, payment details)
2. Form validation checks email format and phone number
3. **`supabase.auth.signUp()`** is called with email and password (line 174)
4. Supabase creates user in `auth.users` table
5. Database trigger `on_auth_user_created` automatically creates profile in `profiles` table
6. Database trigger `on_auth_user_created_email_subscription` creates email subscription
7. Stripe Setup Intent is created to save payment method
8. User profile is updated with phone number, trial date, and Stripe customer ID
9. User is logged in and redirected to dashboard

**Result:** User appears in Supabase Authentication > Users immediately

### 2. Stripe Direct Checkout Flow (Secondary Path)

**Location:** `supabase/functions/stripe-webhook/index.ts` lines 65-163

**Scenario:** Someone subscribes through a direct Stripe payment link (not through website signup)

**Steps:**
1. Customer completes Stripe checkout
2. Stripe webhook fires `checkout.session.completed` event
3. Webhook checks if `supabase_user_id` exists in session metadata
4. **If NO user ID exists:**
   - Webhook extracts customer email from Stripe session
   - Checks if auth user already exists with that email
   - **If user doesn't exist:**
     - Creates new auth user with `supabase.auth.admin.createUser()` (line 120)
     - Marks email as confirmed automatically
     - Database triggers create profile and email subscription
     - Updates profile with Stripe subscription details
     - Generates password reset link and sends email
   - **If user already exists:**
     - Updates existing user's profile with subscription details

**Result:** User appears in Supabase Authentication > Users via webhook

### 3. Login Flow

**Location:** `src/components/AuthModal.tsx` lines 137-147

**Steps:**
1. User enters email and password
2. **`supabase.auth.signInWithPassword()`** is called (line 138)
3. Supabase validates credentials against `auth.users` table
4. Session is created and user is logged in

### 4. Password Reset Flow

**Location:** `src/components/AuthModal.tsx` lines 127-135

**Steps:**
1. User clicks "Forgot password?"
2. Enters email address
3. **`supabase.auth.resetPasswordForEmail()`** is called (line 128)
4. Supabase sends password reset email
5. User clicks link and sets new password

## Database Triggers

### Trigger 1: Auto-create Profile
**Name:** `on_auth_user_created`
**Function:** `handle_new_user()`
**Purpose:** Automatically creates a profile record when a new auth user is created

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Trigger 2: Auto-create Email Subscription
**Name:** `on_auth_user_created_email_subscription`
**Function:** `create_email_subscription_on_signup()`
**Purpose:** Automatically creates email subscription when new auth user is created

## Why Users Might Not Appear

### Possible Issues:

1. **Signup form not submitted properly**
   - Check browser console for JavaScript errors
   - Verify Stripe elements loaded correctly
   - Check network tab for failed API calls

2. **Email already exists**
   - Supabase will reject duplicate emails
   - User will see error message: "User already registered"

3. **Database triggers disabled**
   - Verify triggers exist with: `SELECT * FROM pg_trigger WHERE tgname LIKE '%auth_user%'`
   - Re-run migration if triggers are missing

4. **Stripe webhook not configured**
   - Stripe webhook must be configured in Stripe Dashboard
   - Webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Webhook must listen for `checkout.session.completed` event

## Verifying Users Are Created

### Check Auth Users:
```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
```

### Check Profiles:
```sql
SELECT id, email, full_name, phone_number, stripe_customer_id, created_at
FROM profiles
ORDER BY created_at DESC;
```

### Check Email Subscriptions:
```sql
SELECT id, user_id, email, trial_end_date, created_at
FROM email_subscriptions
ORDER BY created_at DESC;
```

## Testing the Flow

### Test Website Signup:
1. Go to website
2. Click "Get Started" or "Sign Up"
3. Fill out form with test data
4. Use Stripe test card: 4242 4242 4242 4242
5. Submit form
6. Check Supabase Authentication > Users - should see new user immediately

### Test Stripe Direct Checkout:
1. Create Stripe Payment Link with subscription
2. Complete checkout with test email
3. Stripe sends webhook to your endpoint
4. Check Supabase Authentication > Users - should see new user
5. User receives password reset email

## Current Database State

- **Auth Users:** 0
- **Profiles:** 0
- **Email Subscriptions:** 0

This confirms no users have successfully signed up yet. The system is ready to accept signups.

## All Authentication Methods Use Supabase Auth

✓ Website signup → `supabase.auth.signUp()`
✓ Stripe checkout webhook → `supabase.auth.admin.createUser()`
✓ Login → `supabase.auth.signInWithPassword()`
✓ Password reset → `supabase.auth.resetPasswordForEmail()`
✓ Profiles table → Linked to `auth.users.id` via foreign key
