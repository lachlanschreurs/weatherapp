# Single Device Session Management

This application now enforces single-device login per account. When a user logs in on a new device, all other active sessions are automatically logged out.

## How It Works

### 1. Session Registration
When a user logs in, the system:
- Creates a unique session record in the `user_sessions` table
- Generates a device fingerprint based on browser characteristics
- Automatically deactivates all other active sessions for that user via database trigger

### 2. Session Validation
The application continuously validates sessions by:
- Checking session validity every 30 seconds
- Comparing the current session token against active sessions in the database
- Automatically logging out if the session is no longer active

### 3. Automatic Logout
When a user logs in on a new device:
- The new session is created and activated
- All other sessions for that user are immediately deactivated
- Users on other devices are automatically logged out within 30 seconds
- A notification appears: "You have been logged out because you signed in on another device."

### 4. Session Cleanup
- Expired sessions are automatically deactivated
- Old sessions (>30 days past expiry) are permanently deleted
- Session activity timestamps are updated every 30 seconds

## Database Schema

**user_sessions table:**
- `id` - Unique session identifier
- `user_id` - User who owns the session
- `session_token` - Supabase access token (unique)
- `device_fingerprint` - Browser/device identifier
- `is_active` - Current session status
- `last_activity` - Last activity timestamp
- `created_at` - Session creation time
- `expires_at` - Session expiration (default 7 days)

## Security Features

- Row Level Security (RLS) enabled on all session operations
- Users can only read/modify their own sessions
- Automatic cleanup prevents session table bloat
- Device fingerprinting helps identify unique devices
- Session tokens are unique and indexed for fast lookups

## User Experience

When attempting to use multiple devices:
1. User logs in on Device A → Session created, user can access app
2. User logs in on Device B → New session created, Device A session deactivated
3. Device A checks session validity → Finds session inactive
4. Device A automatically logs out → User sees notification
5. Only Device B remains logged in

This ensures account security while maintaining a smooth user experience.
