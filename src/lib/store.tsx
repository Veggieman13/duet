import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CycleInfo, getCycleInfo } from '@/lib/cycle';
import { addDays, todayKey } from '@/lib/dates';
import * as sharing from '@/lib/sharing';
import Storage from '@/lib/storage';
import { CycleSettings, DayLog, DEFAULT_SETTINGS, LogsByDate } from '@/lib/types';

const LOGS_KEY = 'cycle.logs.v1';
const SETTINGS_KEY = 'cycle.settings.v1';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = Storage.getItemSync(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    // Storage unavailable (e.g. web preview) — run with in-memory data only.
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    Storage.setItemSync(key, JSON.stringify(value));
  } catch {
    // Ignore: data simply won't persist in environments without SQLite.
  }
}

interface OnboardingAnswers {
  lastPeriodStart?: string;
  cycleLength: number;
  periodLength: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

interface CycleContextValue {
  logs: LogsByDate;
  settings: CycleSettings;
  info: CycleInfo;
  syncStatus: SyncStatus;
  /** Save a day's log; pass null to clear the day entirely. */
  setDayLog: (date: string, log: DayLog | null) => void;
  updateSettings: (patch: Partial<CycleSettings>) => void;
  completeOnboarding: (answers: OnboardingAnswers) => void;
  resetAll: () => void;
  /** Tracker: create an invite code for the partner. */
  startSharing: () => Promise<string>;
  /** Tracker: poll whether the partner has joined. */
  checkPartnerJoined: () => Promise<boolean>;
  /** Partner: redeem an invite code and switch this device to partner mode. */
  joinAsPartner: (code: string) => Promise<void>;
  /** Either side: dissolve the link. */
  endSharing: () => Promise<void>;
  /** Partner: pull the latest data from the tracker. */
  refreshFromPartner: () => Promise<void>;
}

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogsByDate>(() => loadJSON(LOGS_KEY, {}));
  const [settings, setSettings] = useState<CycleSettings>(() =>
    loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => saveJSON(LOGS_KEY, logs), [logs]);
  useEffect(() => saveJSON(SETTINGS_KEY, settings), [settings]);

  const info = useMemo(() => getCycleInfo(logs, settings, todayKey()), [logs, settings]);

  // Tracker with a linked partner: push a fresh snapshot shortly after any change.
  const shouldPush =
    settings.role === 'tracker' && !!settings.coupleId && !!settings.partnerLinked;
  useEffect(() => {
    if (!shouldPush) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const updatedAt = new Date().toISOString();
        await sharing.pushSnapshot(settings.coupleId!, {
          logs,
          cycleLength: settings.cycleLength,
          periodLength: settings.periodLength,
          updatedAt,
        });
        setSyncStatus('idle');
        setSettings((prev) => ({ ...prev, lastSyncAt: updatedAt }));
      } catch {
        setSyncStatus('error');
      }
    }, 1500);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, settings.cycleLength, settings.periodLength, shouldPush, settings.coupleId]);

  const refreshFromPartner = async () => {
    if (settings.role !== 'partner' || !settings.coupleId) return;
    try {
      setSyncStatus('syncing');
      const payload = await sharing.fetchSnapshot(settings.coupleId);
      if (payload) {
        setLogs(payload.logs ?? {});
        setSettings((prev) => ({
          ...prev,
          cycleLength: payload.cycleLength,
          periodLength: payload.periodLength,
          lastSyncAt: payload.updatedAt,
        }));
      }
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    }
  };

  // Partner: pull once when the app starts.
  const isPartner = settings.role === 'partner' && !!settings.coupleId;
  useEffect(() => {
    if (isPartner) refreshFromPartner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartner]);

  const value = useMemo<CycleContextValue>(
    () => ({
      logs,
      settings,
      info,
      syncStatus,
      setDayLog: (date, log) => {
        setLogs((prev) => {
          const next = { ...prev };
          const isEmpty = !log || (!log.flow && log.symptoms.length === 0 && !log.note);
          if (isEmpty) {
            delete next[date];
          } else {
            next[date] = log;
          }
          return next;
        });
      },
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      completeOnboarding: ({ lastPeriodStart, cycleLength, periodLength }) => {
        if (lastPeriodStart) {
          setLogs((prev) => {
            const next = { ...prev };
            for (let i = 0; i < periodLength; i++) {
              const date = addDays(lastPeriodStart, i);
              const existing = next[date] as DayLog | undefined;
              if (!existing) {
                next[date] = { flow: 'medium', symptoms: [] };
              } else if (!existing.flow) {
                next[date] = { ...existing, flow: 'medium' };
              }
            }
            return next;
          });
        }
        setSettings((prev) => ({ ...prev, cycleLength, periodLength, onboarded: true }));
      },
      resetAll: () => {
        setLogs({});
        setSettings(DEFAULT_SETTINGS);
      },
      startSharing: async () => {
        const { coupleId, code } = await sharing.createInvite();
        setSettings((prev) => ({
          ...prev,
          coupleId,
          inviteCode: code,
          partnerLinked: false,
        }));
        return code;
      },
      checkPartnerJoined: async () => {
        if (!settings.coupleId) return false;
        const linked = await sharing.isPartnerLinked(settings.coupleId);
        if (linked) {
          setSettings((prev) => ({ ...prev, partnerLinked: true, inviteCode: undefined }));
        }
        return linked;
      },
      joinAsPartner: async (code) => {
        const coupleId = await sharing.redeemInvite(code);
        setLogs({});
        setSettings((prev) => ({
          ...prev,
          role: 'partner',
          coupleId,
          onboarded: true,
          inviteCode: undefined,
          partnerLinked: true,
        }));
      },
      endSharing: async () => {
        if (settings.coupleId) {
          try {
            await sharing.stopSharing(settings.coupleId);
          } catch {
            // Even if the server call fails, unlink locally.
          }
        }
        if (settings.role === 'partner') {
          // Partner devices hold no data of their own.
          setLogs({});
          setSettings({ ...DEFAULT_SETTINGS, onboarded: false });
        } else {
          setSettings((prev) => ({
            ...prev,
            coupleId: undefined,
            inviteCode: undefined,
            partnerLinked: false,
            lastSyncAt: undefined,
          }));
        }
      },
      refreshFromPartner,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs, settings, info, syncStatus],
  );

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}

export function useCycle(): CycleContextValue {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error('useCycle must be used inside CycleProvider');
  return ctx;
}
