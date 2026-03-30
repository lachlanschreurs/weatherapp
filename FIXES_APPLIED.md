# Fixes Applied - OpenAI API Key and Password Reset

## Issues Fixed

### 1. OpenAI API Key Not Working ✓

**Problem:** Farmer Joe edge function was looking for `API_KEY_FARMCAST` but the deployed secret is named `OPENAI_KEY_FARMCAST`

**Solution:**
- Updated `supabase/functions/farmer-joe/index.ts` line 96
- Changed from `Deno.env.get('API_KEY_FARMCAST')` to `Deno.env.get('OPENAI_KEY_FARMCAST')`
- Deployed updated function to Supabase

**Result:** Farmer Joe AI assistant now works correctly with the OpenAI API

### 2. Password Reset Not Working ✓

**Problem:** Existing users couldn't reset their passwords via email link

**Solution:**

#### A. Updated AuthModal.tsx (lines 127-135)
- Changed redirect URL from `/reset-password` to root `/`
- This ensures the link works without requiring a separate password reset page
- Improved success message for clarity
- Clears email field after sending reset link

#### B. Updated App.tsx (lines 153-169)
- Added `PASSWORD_RECOVERY` event handler in `onAuthStateChange`
- When user clicks reset link, they're prompted to enter new password
- Password is validated (minimum 6 characters)
- Updates password via `supabase.auth.updateUser()`
- Shows success/error messages
- Redirects to homepage after successful reset

**How Password Reset Now Works:**

1. User clicks "Forgot password?" in AuthModal
2. Enters email address
3. Supabase sends password reset email
4. User clicks link in email
5. App detects `PASSWORD_RECOVERY` event
6. Prompt appears asking for new password
7. Password is validated and updated
8. User is notified of success
9. User is redirected to homepage to log in

**Alternative Approach Available:**

If you prefer a dedicated password reset page instead of a prompt:
1. Create a new `/reset-password` route
2. Add a password reset form component
3. Update the redirect URL back to `/reset-password`
4. Remove the prompt-based handler

## Deployed Secrets Verified

Current edge function secrets:
- ✓ `OPENAI_KEY_FARMCAST` - OpenAI API key for Farmer Joe
- ✓ `STRIPE_SECRET_KEY` - Stripe payments
- ✓ `STRIPE_WEBHOOK_SECRET` - Stripe webhooks
- ✓ `STRIPE_PRICE_ID` - Stripe subscription price
- ✓ `RESEND_API_KEY` - Email service
- ✓ `XWEATHER_CLIENT_ID` - Weather API
- ✓ `XWEATHER_CLIENT_SECRET` - Weather API
- ✓ `OPENWEATHER_API_KEY` - Weather API
- ✓ `SUPABASE_URL` - Auto-configured
- ✓ `SUPABASE_ANON_KEY` - Auto-configured
- ✓ `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured
- ✓ `SUPABASE_DB_URL` - Auto-configured

## Testing Instructions

### Test OpenAI/Farmer Joe:
1. Log in to the app
2. Click on Farmer Joe chat
3. Ask a farming question (e.g., "What are good spray conditions?")
4. Should receive intelligent AI response

### Test Password Reset:
1. Go to login page
2. Click "Forgot password?"
3. Enter your email address
4. Check email inbox for reset link
5. Click link in email
6. Enter new password when prompted
7. Verify password is at least 6 characters
8. Click OK
9. Should see success message
10. Try logging in with new password

## Build Status

✓ Build completed successfully
✓ No TypeScript errors
✓ All edge functions deployed
