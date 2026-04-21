import { supabase } from '../lib/supabase';

export const DISCLAIMER_VERSION = '2025-v1';
const LOCAL_KEY = 'farmcast_agronomy_disclaimer';

interface AcceptanceRecord {
  version: string;
  acceptedAt: string;
}

function readLocal(): AcceptanceRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AcceptanceRecord) : null;
  } catch {
    return null;
  }
}

function writeLocal() {
  const record: AcceptanceRecord = { version: DISCLAIMER_VERSION, acceptedAt: new Date().toISOString() };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(record));
}

export function hasLocalAcceptance(): boolean {
  const record = readLocal();
  return record?.version === DISCLAIMER_VERSION;
}

export async function checkDisclaimerAccepted(): Promise<boolean> {
  if (!hasLocalAcceptance()) return false;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return true;

  const { data } = await supabase
    .from('profiles')
    .select('agronomy_disclaimer_version, agronomy_disclaimer_accepted_at')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!data) return true;
  return data.agronomy_disclaimer_version === DISCLAIMER_VERSION;
}

export async function recordDisclaimerAcceptance() {
  writeLocal();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase
    .from('profiles')
    .update({
      agronomy_disclaimer_version: DISCLAIMER_VERSION,
      agronomy_disclaimer_accepted_at: new Date().toISOString(),
    })
    .eq('id', session.user.id);
}
