# Supabase Dashboard Configuration Required

The following security improvements have been completed via database migrations:

## ✅ Completed (via Migration)
- Added foreign key indexes for performance optimization
- Removed unused indexes
- Fixed function search path security vulnerabilities
- Fixed overly permissive RLS policy on user_roles table

## ⚠️ Manual Configuration Required

The following settings must be configured in the Supabase Dashboard:

### 1. Enable Leaked Password Protection

**Location:** Dashboard > Authentication > Providers > Email

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Click on "Email" provider
4. Scroll to "Password Protection"
5. Enable "Check HaveIBeenPwned for leaked passwords"
6. Save changes

**Why:** This prevents users from using passwords that have been compromised in data breaches by checking against the HaveIBeenPwned database.

### 2. Configure Auth DB Connection Strategy

**Location:** Dashboard > Project Settings > Database

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to Project Settings → Database
3. Find "Auth Connection Pooling" section
4. Change from "Fixed" (10 connections) to "Percentage" based allocation
5. Set an appropriate percentage (recommended: 10-20%)
6. Save changes

**Why:** Percentage-based connection allocation automatically scales with instance size upgrades, improving Auth server performance.

## Security Status

All SQL-configurable security issues have been resolved. The two remaining items require Supabase Dashboard access and cannot be automated through migrations.
