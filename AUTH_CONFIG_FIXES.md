# Auth Configuration Security Fixes

This document outlines the Auth configuration changes that need to be applied in your Supabase Dashboard.

## 1. Auth DB Connection Strategy (CRITICAL)

**Issue:** Auth server is configured to use a fixed 10 connections, which doesn't scale with instance size upgrades.

**Fix Required:**
1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Database**
3. Find the **Auth DB Connection Strategy** setting
4. Change from **Fixed** to **Percentage-based**
5. Set to recommended value: **10%** of available connections

**Benefits:**
- Automatically scales with database instance upgrades
- Better resource utilization
- Improved Auth server performance under load
- No manual adjustment needed when scaling up

---

## 2. Leaked Password Protection (CRITICAL)

**Issue:** Password breach detection via HaveIBeenPwned.org is currently disabled.

**Fix Required:**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Policies**
3. Find **Password Protection** section
4. Enable **"Check passwords against HaveIBeenPwned database"**

**Benefits:**
- Prevents users from using compromised passwords
- Reduces account takeover risk
- Enhances overall security posture
- No impact on user experience (only affects signup/password change)

---

## How to Apply These Changes

### Step 1: Access Supabase Dashboard
Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

### Step 2: Apply Connection Strategy Fix
1. Click on **Settings** (gear icon) in the left sidebar
2. Click **Database**
3. Scroll to **Connection Pooling** section
4. Under **Auth Connection Pool**, change strategy to **Percentage**
5. Set percentage to **10%**
6. Click **Save**

### Step 3: Enable Leaked Password Protection
1. Click on **Authentication** (lock icon) in the left sidebar
2. Click **Policies**
3. Scroll to **Password Policy** section
4. Toggle ON: **"Prevent users from using compromised passwords"**
5. Click **Save**

---

## Verification

After applying both changes:

1. **Connection Strategy:** Check database metrics to confirm Auth server scales with load
2. **Password Protection:** Try signing up with a known breached password (e.g., "password123") - it should be rejected

---

## Impact Assessment

### Connection Strategy Change
- **Risk:** Low - improves performance
- **Downtime:** None
- **User Impact:** None (transparent improvement)

### Leaked Password Protection
- **Risk:** Low - security enhancement
- **Downtime:** None
- **User Impact:** Users with breached passwords will need to choose different passwords

---

## Questions?

If you need help locating these settings in your Supabase Dashboard, refer to:
- https://supabase.com/docs/guides/database/connection-pooling
- https://supabase.com/docs/guides/auth/passwords
