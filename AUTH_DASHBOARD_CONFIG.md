# Auth Dashboard Configuration Required

The following configuration changes must be made manually in the Supabase Dashboard. These cannot be automated via SQL migrations.

## 1. Auth DB Connection Strategy (Performance)

**Issue:** Your project's Auth server uses a fixed number of connections (10). This won't scale when you increase instance size.

**Fix Required:**
1. Navigate to: **Project Settings → Database → Connection Pooling**
2. Find the "Auth" connection pool settings
3. Change from **Fixed (10 connections)** to **Percentage-based allocation**
4. Recommended: Set to **5-10%** of total connections
5. Click **Save**

**Why:** Percentage-based allocation automatically scales with your database instance size, ensuring Auth performance improves when you upgrade.

---

## 2. Leaked Password Protection (Security)

**Issue:** Protection against compromised passwords (via HaveIBeenPwned.org) is currently disabled.

**Fix Required:**
1. Navigate to: **Authentication → Policies**
2. Find the **"Password Checks"** or **"Leaked Password Protection"** section
3. Enable **"Block leaked passwords"** or **"Check against HaveIBeenPwned"**
4. Click **Save**

**Why:** This prevents users from setting passwords that have been compromised in known data breaches, significantly improving account security.

---

## Summary

✅ **Fixed via SQL Migration:**
- RLS policy performance optimization on `user_roles` table
- Removed duplicate permissive policies
- Removed 5 unused indexes

⚠️ **Requires Manual Dashboard Configuration:**
- Auth DB Connection Strategy → Switch to percentage-based
- Leaked Password Protection → Enable feature

These manual changes should be completed to fully resolve all security and performance warnings.
