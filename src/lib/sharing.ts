import { ensureSignedIn, supabase } from '@/lib/supabase';
import { LogsByDate } from '@/lib/types';

/** The full state the tracker shares with their partner. */
export interface SharePayload {
  logs: LogsByDate;
  cycleLength: number;
  periodLength: number;
  updatedAt: string;
}

// No 0/O/1/I/L — codes get read aloud or typed from another phone.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Tracker: create a couple with a fresh invite code. */
export async function createInvite(): Promise<{ coupleId: string; code: string }> {
  const uid = await ensureSignedIn();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('couples')
      .insert({ tracker_id: uid, invite_code: code })
      .select('id')
      .single();
    if (!error && data) return { coupleId: data.id, code };
    // 23505 = unique violation (code collision) — try another code.
    if (error && error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('Could not generate a unique invite code');
}

/** Partner: claim the partner seat using an invite code. Returns the couple id. */
export async function redeemInvite(code: string): Promise<string> {
  await ensureSignedIn();
  const { data, error } = await supabase.rpc('redeem_invite', { code });
  if (error) {
    if (error.message.includes('invalid_or_used_code')) {
      throw new Error('That code is not valid (or was already used). Double-check it with your partner.');
    }
    throw new Error(error.message);
  }
  return data as string;
}

/** Tracker: has the partner joined yet? */
export async function isPartnerLinked(coupleId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('couples')
    .select('partner_id')
    .eq('id', coupleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data?.partner_id;
}

/** Tracker: push the latest cycle data for the partner to see. */
export async function pushSnapshot(coupleId: string, payload: SharePayload): Promise<void> {
  const { error } = await supabase
    .from('snapshots')
    .upsert({ couple_id: coupleId, payload, updated_at: payload.updatedAt });
  if (error) throw new Error(error.message);
}

/** Partner: fetch the tracker's latest cycle data. */
export async function fetchSnapshot(coupleId: string): Promise<SharePayload | null> {
  const { data, error } = await supabase
    .from('snapshots')
    .select('payload')
    .eq('couple_id', coupleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.payload as SharePayload) ?? null;
}

/** Either side: dissolve the couple. Snapshot is deleted with it (cascade). */
export async function stopSharing(coupleId: string): Promise<void> {
  const { error } = await supabase.from('couples').delete().eq('id', coupleId);
  if (error) throw new Error(error.message);
}
