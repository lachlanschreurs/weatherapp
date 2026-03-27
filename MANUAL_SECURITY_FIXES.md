# Manual Security Configuration Required

The following security improvements require manual configuration in the Supabase Dashboard:

## 1. Auth DB Connection Strategy (Performance)

**Issue:** Auth server uses fixed 10 connections instead of percentage-based allocation.

**Fix Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Find **Connection Pooling** section
5. Change Auth connection strategy from **Fixed (10 connections)** to **Percentage-based**
6. Recommended: Set to **5-10%** of total connections
7. Click **Save**

**Why:** This allows Auth server to scale with your database instance size.

## 2. Leaked Password Protection (Security)

**Issue:** HaveIBeenPwned password breach detection is disabled.

**Fix Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Scroll to **Security and Protection** section
5. Enable **"Enable HaveIBeenPwned password breach detection"**
6. Click **Save**

**Why:** Prevents users from using passwords that have been exposed in data breaches.

---

## Summary

All database-level security issues have been automatically fixed via migration:
- ✅ RLS policy performance optimizations (user_sessions table)
- ✅ Removed unused indexes
- ✅ Fixed function search paths

The two issues above require dashboard access and should be configured by the project administrator.
