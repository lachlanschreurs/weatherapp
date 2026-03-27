import { supabase } from '../lib/supabase';

// Generate a simple device fingerprint
function generateDeviceFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;

  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

// Register a new session when user logs in
export async function registerSession(sessionToken: string, userId: string): Promise<void> {
  try {
    const deviceFingerprint = generateDeviceFingerprint();
    const userAgent = navigator.userAgent;

    // Try to get IP address (will be null in browser, but that's okay)
    const ipAddress = null;

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert the new session (trigger will automatically deactivate other sessions)
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('Error registering session:', error);
    }
  } catch (error) {
    console.error('Failed to register session:', error);
  }
}

// Update session activity timestamp
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .eq('is_active', true);
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}

// Check if current session is still active
export async function checkSessionValidity(sessionToken: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('is_active, expires_at')
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // Check if session is active and not expired
    const isValid = data.is_active && new Date(data.expires_at) > new Date();
    return isValid;
  } catch (error) {
    console.error('Failed to check session validity:', error);
    return false;
  }
}

// Deactivate current session (logout)
export async function deactivateSession(sessionToken: string): Promise<void> {
  try {
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
  } catch (error) {
    console.error('Failed to deactivate session:', error);
  }
}

// Get all sessions for current user (for debugging/admin)
export async function getUserSessions(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get user sessions:', error);
    return [];
  }
}
