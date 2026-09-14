import {
  ItemState,
  ItemStates,
  Note,
  Notes,
  PregnancyConfig,
} from '@/lib/pregnancy';
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

// --- Pregnancy module -------------------------------------------------------
// Both partners write here, so state syncs as one row per item rather than as
// a single document. Pushes are per-change and best-effort, matching the cycle
// sync above: a failed push costs that one change, never the other person's.

interface ItemRow {
  item_id: string;
  status: ItemState['status'];
  scheduled_date: string | null;
  place: string | null;
  updated_at: string;
  updated_by: string;
}

interface NoteRow {
  note_key: string;
  body: string;
  author_id: string;
  author_name: string | null;
  updated_at: string;
}

interface ConfigRow {
  active: boolean;
  lmp: string;
  edd: string;
}

export interface PregnancySnapshot {
  config: PregnancyConfig | null;
  items: ItemStates;
  notes: Notes;
}

/** Either partner: save which pregnancy is being followed. */
export async function pushPregnancyConfig(
  coupleId: string,
  config: PregnancyConfig,
): Promise<void> {
  const uid = await ensureSignedIn();
  const { error } = await supabase.from('pregnancy_config').upsert(
    {
      couple_id: coupleId,
      active: config.active,
      lmp: config.lmp,
      edd: config.edd,
      updated_at: new Date().toISOString(),
      updated_by: uid,
    },
    { onConflict: 'couple_id' },
  );
  if (error) throw new Error(error.message);
}

/** Either partner: save one item's status. */
export async function pushItemState(
  coupleId: string,
  itemId: string,
  state: ItemState,
): Promise<void> {
  const uid = await ensureSignedIn();
  const { error } = await supabase.from('pregnancy_items').upsert(
    {
      couple_id: coupleId,
      item_id: itemId,
      status: state.status,
      scheduled_date: state.scheduledDate ?? null,
      place: state.place ?? null,
      updated_at: state.updatedAt,
      updated_by: uid,
    },
    { onConflict: 'couple_id,item_id' },
  );
  if (error) throw new Error(error.message);
}

/** Either partner: save one note. Passing null clears it. */
export async function pushNote(
  coupleId: string,
  key: string,
  note: Note | null,
): Promise<void> {
  const uid = await ensureSignedIn();
  if (!note || !note.text.trim()) {
    const { error } = await supabase
      .from('pregnancy_notes')
      .delete()
      .eq('couple_id', coupleId)
      .eq('note_key', key);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from('pregnancy_notes').upsert(
    {
      couple_id: coupleId,
      note_key: key,
      body: note.text,
      author_id: uid,
      author_name: note.authorName ?? null,
      updated_at: note.updatedAt,
    },
    { onConflict: 'couple_id,note_key' },
  );
  if (error) throw new Error(error.message);
}

/** Either partner: pull the whole module in one go (three small tables). */
export async function fetchPregnancy(coupleId: string): Promise<PregnancySnapshot> {
  const [configRes, itemsRes, notesRes] = await Promise.all([
    supabase
      .from('pregnancy_config')
      .select('active, lmp, edd')
      .eq('couple_id', coupleId)
      .maybeSingle(),
    supabase
      .from('pregnancy_items')
      .select('item_id, status, scheduled_date, place, updated_at, updated_by')
      .eq('couple_id', coupleId),
    supabase
      .from('pregnancy_notes')
      .select('note_key, body, author_id, author_name, updated_at')
      .eq('couple_id', coupleId),
  ]);

  const firstError = configRes.error ?? itemsRes.error ?? notesRes.error;
  if (firstError) throw new Error(firstError.message);

  const items: ItemStates = {};
  for (const row of (itemsRes.data ?? []) as ItemRow[]) {
    items[row.item_id] = {
      status: row.status,
      scheduledDate: row.scheduled_date ?? undefined,
      place: row.place ?? undefined,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  const notes: Notes = {};
  for (const row of (notesRes.data ?? []) as NoteRow[]) {
    notes[row.note_key] = {
      text: row.body,
      authorId: row.author_id,
      authorName: row.author_name ?? undefined,
      updatedAt: row.updated_at,
    };
  }

  const cfg = configRes.data as ConfigRow | null;
  return {
    config: cfg ? { active: cfg.active, lmp: cfg.lmp, edd: cfg.edd } : null,
    items,
    notes,
  };
}
