# Supabase Dashboard Configuration Required

The following security improvements require manual configuration in the Supabase Dashboard:

## 1. Auth Database Connection Strategy

**Issue:** Auth server uses fixed connection pool (10 connections) instead of percentage-based allocation.

**How to Fix:**
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection Pooling** section
4. Find **Auth Connection Pool Mode**
5. Change from **Transaction** mode with fixed connections to **Percentage** mode
6. Set percentage to **10-15%** of total connections
7. Click **Save**

**Why:** This allows the auth server to scale automatically when you upgrade your database instance.

---

## 2. Enable Leaked Password Protection

**Issue:** Password breach detection is currently disabled.

**How to Fix:**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Policies**
3. Find **Password Protection** section
4. Enable **"Check for breached passwords"**
5. This will check passwords against the HaveIBeenPwned database
6. Click **Save**

**Why:** Prevents users from using passwords that have been exposed in data breaches, significantly improving account security.

---

## All Other Security Issues

All other security issues have been automatically fixed via database migration:
- ✅ Added indexes for all foreign key columns (chat_messages, moisture_probes, moisture_readings, probe_api_endpoints, profiles)
- ✅ Fixed multiple permissive policies on user_roles table
- ✅ Combined duplicate SELECT policies into single comprehensive policy

These changes are now live in your database.
