# Auth Security Configuration

The following security settings must be configured via the Supabase Dashboard as they are not available through SQL migrations.

## Required Configuration Changes

### 1. Auth DB Connection Strategy (High Priority)

**Issue:** Your project's Auth server uses a fixed 10 connections instead of a percentage-based allocation.

**Impact:** Increasing the instance size won't improve Auth server performance without manual adjustment.

**How to Fix:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `ryohnlsfnbuizblcpbyd`
3. Go to **Settings** → **Database** → **Connection Pooling**
4. Change Auth server connection allocation from **Fixed (10)** to **Percentage-based**
5. Set an appropriate percentage (recommended: 20-30% for most applications)
6. Save changes

### 2. Leaked Password Protection (High Priority)

**Issue:** Protection against compromised passwords is currently disabled.

**Impact:** Users can set passwords that have been exposed in data breaches, increasing account security risks.

**How to Fix:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `ryohnlsfnbuizblcpbyd`
3. Go to **Authentication** → **Policies**
4. Find the **Password Protection** section
5. Enable **"Check against HaveIBeenPwned database"**
6. Save changes

## Database Optimizations Completed

The following database security issues have been automatically fixed via migration:

- ✅ Added covering index for `profiles.default_location_id` foreign key
- ✅ Removed 7 unused indexes to reduce maintenance overhead

## Verification

After making the above changes in the Dashboard, verify:
- Auth connection pool is using percentage-based allocation
- Password breach protection is enabled
- No security warnings appear in the Supabase Dashboard

## Additional Security Recommendations

1. **Regular Security Audits:** Review the Supabase Dashboard security recommendations monthly
2. **Monitor Connection Usage:** Keep an eye on connection pool utilization in the Dashboard
3. **Password Policies:** Consider implementing additional password requirements (minimum length, complexity) in your application logic
4. **Rate Limiting:** Enable rate limiting for authentication endpoints to prevent brute force attacks
