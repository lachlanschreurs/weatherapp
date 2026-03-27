/*
  # Add Device Session Management

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key) - Unique session identifier
      - `user_id` (uuid, references auth.users) - User who owns the session
      - `session_token` (text, unique) - The Supabase session access token
      - `device_fingerprint` (text) - Browser/device identifier
      - `ip_address` (text) - IP address of the device
      - `user_agent` (text) - Browser user agent string
      - `is_active` (boolean) - Whether this session is currently active
      - `last_activity` (timestamptz) - Last time this session was used
      - `created_at` (timestamptz) - When session was created
      - `expires_at` (timestamptz) - When session expires

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for users to read/update only their own sessions
    - Add function to automatically deactivate old sessions when new one is created

  3. Important Notes
    - Only ONE active session per user is allowed at a time
    - When a user logs in on a new device, all other sessions are deactivated
    - Sessions are tracked by access token to enable automatic logout
    - Inactive sessions are cleaned up after 30 days
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  device_fingerprint text,
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true NOT NULL,
  last_activity timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to deactivate all other sessions when a new session is created
CREATE OR REPLACE FUNCTION deactivate_other_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Deactivate all other active sessions for this user
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically deactivate other sessions
DROP TRIGGER IF EXISTS trigger_deactivate_other_sessions ON user_sessions;
CREATE TRIGGER trigger_deactivate_other_sessions
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_other_sessions();

-- Function to clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Delete sessions that expired more than 30 days ago
  DELETE FROM user_sessions
  WHERE expires_at < now() - interval '30 days';
  
  -- Deactivate sessions that have expired
  UPDATE user_sessions
  SET is_active = false
  WHERE expires_at < now()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a session is still valid
CREATE OR REPLACE FUNCTION is_session_valid(p_session_token text)
RETURNS boolean AS $$
DECLARE
  v_is_valid boolean;
BEGIN
  SELECT is_active AND expires_at > now()
  INTO v_is_valid
  FROM user_sessions
  WHERE session_token = p_session_token;
  
  RETURN COALESCE(v_is_valid, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
