import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ItemState,
  ItemStates,
  Note,
  Notes,
  PregnancyConfig,
} from '@/lib/pregnancy';
import { DEFAULT_PREGNANCY } from '@/lib/pregnancy-plan';
import * as sharing from '@/lib/sharing';
import Storage from '@/lib/storage';
import { useCycle } from '@/lib/store';

const PREGNANCY_KEY = 'pregnancy.v1';
const NOTE_PUSH_DELAY = 1500;

interface StoredPregnancy {
  config: PregnancyConfig;
  items: ItemStates;
  notes: Notes;
}

const EMPTY: StoredPregnancy = { config: DEFAULT_PREGNANCY, items: {}, notes: {} };

function load(): StoredPregnancy {
  try {
    const raw = Storage.getItemSync(PREGNANCY_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredPregnancy>;
    return {
      config: { ...DEFAULT_PREGNANCY, ...(parsed.config ?? {}) },
      items: parsed.items ?? {},
      notes: parsed.notes ?? {},
    };
  } catch {
    // Storage unavailable (e.g. web preview) — run with in-memory data only.
    return EMPTY;
  }
}

function save(value: StoredPregnancy) {
  try {
    Storage.setItemSync(PREGNANCY_KEY, JSON.stringify(value));
  } catch {
    // Ignore: data simply won't persist in environments without SQLite.
  }
}

/** Newer wins, per row. Protects local edits from a stale server copy. */
function newer<T extends { updatedAt: string }>(a: T | undefined, b: T | undefined) {
  if (!a) return b;
  if (!b) return a;
  return b.updatedAt > a.updatedAt ? b : a;
}

function mergeById<T extends { updatedAt: string }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = { ...local };
  for (const key of Object.keys(remote)) {
    const winner = newer(local[key], remote[key]);
    if (winner) out[key] = winner;
  }
  return out;
}

interface PregnancyContextValue {
  config: PregnancyConfig;
  items: ItemStates;
  notes: Notes;
  /** This device's Supabase user id, once known — used to label notes. */
  userId?: string;
  updateConfig: (patch: Partial<PregnancyConfig>) => void;
  /** Write one item's status. Pass null to clear it back to 'none'. */
  setItemState: (itemId: string, next: Omit<ItemState, 'updatedAt'> | null) => void;
  setNote: (key: string, text: string) => void;
  refresh: () => Promise<void>;
}

const PregnancyContext = createContext<PregnancyContextValue | null>(null);

export function PregnancyProvider({ children }: { children: ReactNode }) {
  const { settings } = useCycle();
  const coupleId = settings.coupleId;

  const [state, setState] = useState<StoredPregnancy>(load);
  const [userId, setUserId] = useState<string | undefined>();
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => save(state), [state]);

  const refresh = useCallback(async () => {
    if (!coupleId) return;
    try {
      const remote = await sharing.fetchPregnancy(coupleId);
      setState((prev) => ({
        config: remote.config ?? prev.config,
        items: mergeById(prev.items, remote.items),
        notes: mergeById(prev.notes, remote.notes),
      }));
    } catch {
      // Offline or the couple was dissolved — keep showing local data.
    }
  }, [coupleId]);

  // Pull once when a pair exists, so a second device starts in step.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateConfig = useCallback(
    (patch: Partial<PregnancyConfig>) => {
      setState((prev) => {
        const config = { ...prev.config, ...patch };
        if (coupleId) {
          sharing.pushPregnancyConfig(coupleId, config).catch(() => {});
        }
        return { ...prev, config };
      });
    },
    [coupleId],
  );

  const setItemState = useCallback(
    (itemId: string, next: Omit<ItemState, 'updatedAt'> | null) => {
      const updatedAt = new Date().toISOString();
      setState((prev) => {
        const items = { ...prev.items };
        if (!next || next.status === 'none') {
          delete items[itemId];
        } else {
          items[itemId] = { ...next, updatedAt };
        }
        if (coupleId) {
          const row: ItemState = next
            ? { ...next, updatedAt }
            : { status: 'none', updatedAt };
          sharing.pushItemState(coupleId, itemId, row).catch(() => {});
        }
        return { ...prev, items };
      });
    },
    [coupleId],
  );

  const setNote = useCallback(
    (key: string, text: string) => {
      const updatedAt = new Date().toISOString();
      const note: Note = {
        text,
        authorId: userId ?? '',
        authorName: settings.displayName,
        updatedAt,
      };
      setState((prev) => {
        const notes = { ...prev.notes };
        if (text.trim()) notes[key] = note;
        else delete notes[key];
        return { ...prev, notes };
      });

      // Notes are typed, not tapped: let the keystrokes settle before pushing.
      if (!coupleId) return;
      clearTimeout(noteTimers.current[key]);
      noteTimers.current[key] = setTimeout(() => {
        sharing.pushNote(coupleId, key, text.trim() ? note : null).catch(() => {});
      }, NOTE_PUSH_DELAY);
    },
    [coupleId, userId, settings.displayName],
  );

  // Clear pending note pushes on unmount.
  useEffect(() => {
    const timers = noteTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  // Learn this device's id so notes can be labelled "you" vs your partner.
  useEffect(() => {
    if (!coupleId || userId) return;
    let cancelled = false;
    import('@/lib/supabase')
      .then(({ ensureSignedIn }) => ensureSignedIn())
      .then((id) => {
        if (!cancelled) setUserId(id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [coupleId, userId]);

  const value = useMemo<PregnancyContextValue>(
    () => ({
      config: state.config,
      items: state.items,
      notes: state.notes,
      userId,
      updateConfig,
      setItemState,
      setNote,
      refresh,
    }),
    [state, userId, updateConfig, setItemState, setNote, refresh],
  );

  return <PregnancyContext.Provider value={value}>{children}</PregnancyContext.Provider>;
}

export function usePregnancy(): PregnancyContextValue {
  const ctx = useContext(PregnancyContext);
  if (!ctx) throw new Error('usePregnancy must be used inside PregnancyProvider');
  return ctx;
}
