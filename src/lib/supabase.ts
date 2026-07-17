import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import Storage from '@/lib/storage';

// These identify our Supabase project; they are public by design.
// Security comes from row-level security policies (see db/schema.sql).
const SUPABASE_URL = 'https://hohvrrtwnrvmrviapyus.supabase.co';
const SUPABASE_KEY = 'sb_publishable_x_SuBmneBy4Gp70xffoaBA_mWIr_97O';

const storageAdapter = {
  getItem: (key: string) => Promise.resolve(Storage.getItemSync(key)),
  setItem: (key: string, value: string) => {
    Storage.setItemSync(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    Storage.removeItemSync(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Each device gets a silent anonymous identity — no email, no password.
 * Returns the device's stable user id.
 */
export async function ensureSignedIn(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Anonymous sign-in returned no user');
  return data.user.id;
}
