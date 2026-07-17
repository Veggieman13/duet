export type FlowLevel = 'light' | 'medium' | 'heavy';

export interface DayLog {
  flow?: FlowLevel;
  symptoms: string[];
  note?: string;
}

/** All logged days, keyed by local date string YYYY-MM-DD. */
export type LogsByDate = Record<string, DayLog>;

export type Role = 'tracker' | 'partner';

export interface CycleSettings {
  onboarded: boolean;
  /** Fallback average cycle length in days, used until enough periods are logged. */
  cycleLength: number;
  /** Fallback average period length in days. */
  periodLength: number;
  /** 'tracker' logs their own cycle; 'partner' follows a tracker's shared data. */
  role: Role;
  /** Set once sharing is initiated (both roles). */
  coupleId?: string;
  /** Tracker only: the invite code awaiting a partner. */
  inviteCode?: string;
  /** Tracker only: whether a partner has joined. */
  partnerLinked?: boolean;
  /** Last successful sync, ISO timestamp. */
  lastSyncAt?: string;
}

export const DEFAULT_SETTINGS: CycleSettings = {
  onboarded: false,
  cycleLength: 28,
  periodLength: 5,
  role: 'tracker',
};

export const FLOW_LEVELS: { value: FlowLevel; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

export const SYMPTOMS = [
  'Cramps',
  'Headache',
  'Bloating',
  'Tender breasts',
  'Fatigue',
  'Mood swings',
  'Acne',
  'Back pain',
  'Nausea',
  'Cravings',
] as const;
