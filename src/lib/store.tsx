import Storage from 'expo-sqlite/kv-store';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { CycleInfo, getCycleInfo } from '@/lib/cycle';
import { addDays, todayKey } from '@/lib/dates';
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

interface CycleContextValue {
  logs: LogsByDate;
  settings: CycleSettings;
  info: CycleInfo;
  /** Save a day's log; pass null to clear the day entirely. */
  setDayLog: (date: string, log: DayLog | null) => void;
  updateSettings: (patch: Partial<CycleSettings>) => void;
  completeOnboarding: (answers: OnboardingAnswers) => void;
  resetAll: () => void;
}

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogsByDate>(() => loadJSON(LOGS_KEY, {}));
  const [settings, setSettings] = useState<CycleSettings>(() =>
    loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS),
  );

  useEffect(() => saveJSON(LOGS_KEY, logs), [logs]);
  useEffect(() => saveJSON(SETTINGS_KEY, settings), [settings]);

  const info = useMemo(() => getCycleInfo(logs, settings, todayKey()), [logs, settings]);

  const value = useMemo<CycleContextValue>(
    () => ({
      logs,
      settings,
      info,
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
    }),
    [logs, settings, info],
  );

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}

export function useCycle(): CycleContextValue {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error('useCycle must be used inside CycleProvider');
  return ctx;
}
