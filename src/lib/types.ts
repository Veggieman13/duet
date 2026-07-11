export type FlowLevel = 'light' | 'medium' | 'heavy';

export interface DayLog {
  flow?: FlowLevel;
  symptoms: string[];
  note?: string;
}

/** All logged days, keyed by local date string YYYY-MM-DD. */
export type LogsByDate = Record<string, DayLog>;

export interface CycleSettings {
  onboarded: boolean;
  /** Fallback average cycle length in days, used until enough periods are logged. */
  cycleLength: number;
  /** Fallback average period length in days. */
  periodLength: number;
}

export const DEFAULT_SETTINGS: CycleSettings = {
  onboarded: false,
  cycleLength: 28,
  periodLength: 5,
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
