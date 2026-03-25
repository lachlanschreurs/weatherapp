import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  trial_started_at: string;
  trial_ends_at: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  subscription_ends_at: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};
