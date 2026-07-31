export type FlowLevel = 'light' | 'medium' | 'heavy';

export interface DayLog {
  flow?: FlowLevel;
  mood?: string;
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

/** Opacity of the period colour used for each flow level, as hex alpha. */
export const FLOW_LEVELS: { value: FlowLevel; label: string; alpha: string }[] = [
  { value: 'light', label: 'Light', alpha: '4D' },
  { value: 'medium', label: 'Medium', alpha: 'A6' },
  { value: 'heavy', label: 'Heavy', alpha: 'FF' },
];

export const MOODS: { value: string; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'loving', label: 'Loving', emoji: '🥰' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'irritable', label: 'Irritable', emoji: '😤' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
];

export const SYMPTOMS: { value: string; emoji: string }[] = [
  { value: 'Cramps', emoji: '⚡' },
  { value: 'Headache', emoji: '🤕' },
  { value: 'Bloating', emoji: '🎈' },
  { value: 'Tender breasts', emoji: '💗' },
  { value: 'Fatigue', emoji: '😴' },
  { value: 'Mood swings', emoji: '🎭' },
  { value: 'Acne', emoji: '🫧' },
  { value: 'Back pain', emoji: '🔥' },
  { value: 'Nausea', emoji: '🤢' },
  { value: 'Cravings', emoji: '🍫' },
];
