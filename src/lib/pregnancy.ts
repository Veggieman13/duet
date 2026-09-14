/**
 * Pregnancy module — types and derived state.
 *
 * The plan itself lives in pregnancy-plan.ts. Nothing here is stored except
 * what the user sets: every state below is computed from today's date, so a
 * phone left closed for a week shows the right thing when it reopens.
 */

import { diffDays } from '@/lib/dates';
import { Locale, Localized } from '@/lib/i18n';

/**
 * Comfort-and-expectation signal for the person going in — what it physically
 * feels like — not a clinical risk classification. Don't present it as one.
 */
export type Invasiveness = 'none' | 'blood-draw' | 'invasive';

/** Timeline entries are either a test/scan or a routine consult. */
export type PlanItemType = 'test' | 'consult';

export interface PlanItem {
  id: string;
  type: PlanItemType;
  trimester: 1 | 2 | 3;
  /** Gestational weeks as the clinic writes them, e.g. "11–13" or "35+". */
  weekLabel: string;
  /**
   * Explicit dates from the printed form. NOT derived from weekLabel — the
   * clinic's dates don't always match a naive LMP + 7×week calculation, and
   * the printed dates are what the appointment desk works from.
   * null start = no lower bound; null end = open-ended.
   */
  windowStart: string | null;
  windowEnd: string | null;
  optional: boolean;
  /** Struck out on the clinic's form: listed for completeness, not planned. */
  struckOut?: boolean;
  /** Transcribed from handwriting we couldn't read with confidence. */
  unconfirmed?: boolean;
  invasiveness: Invasiveness;
  /** The clinic's name for it. The Hebrew is verbatim from the form. */
  label: Localized;
  /** What it's for. */
  explain: Localized;
  /** What physically happens, how long, how it feels. */
  method: Localized;
}

export interface Supplement {
  id: string;
  label: Localized;
  /** Language-neutral, e.g. "400 mcg". Absent when we only know the timing. */
  dose?: string;
  note?: Localized;
  /** Doses were hard to read on the form and get adjusted to blood results. */
  unconfirmed: boolean;
}

/** User-set. `scheduled` carries a date; `done` overrides every derived state. */
export type ItemStatus = 'none' | 'scheduled' | 'done';

export interface ItemState {
  status: ItemStatus;
  /** Set when status is 'scheduled'. */
  scheduledDate?: string;
  place?: string;
  updatedAt: string;
  /** Supabase user id of whoever last changed it. */
  updatedBy?: string;
}

export type ItemStates = Record<string, ItemState>;

/**
 * One note per item (and one per trimester), last-write-wins — not a thread.
 * Two people sharing one list don't need replies.
 */
export interface Note {
  text: string;
  authorId: string;
  /** Display name at the time of writing, so it survives a later rename. */
  authorName?: string;
  updatedAt: string;
}

/** Keyed by item id, plus "trimester-1" | "trimester-2" | "trimester-3". */
export type Notes = Record<string, Note>;

export function trimesterNoteKey(trimester: 1 | 2 | 3): string {
  return `trimester-${trimester}`;
}

export interface PregnancyConfig {
  active: boolean;
  /** Last menstrual period. Every window in the app shifts with it. */
  lmp: string;
  /** Estimated due date, as given by the clinic. */
  edd: string;
}

/**
 * Only `closing` and `overdue` should draw attention. Everything else stays
 * quiet — this is a reference sheet, not a nagging app.
 */
export type DerivedState = 'upcoming' | 'open' | 'closing' | 'overdue' | 'done';

/** How near windowEnd counts as `closing`. */
const CLOSING_DAYS = 10;

export function deriveState(
  item: PlanItem,
  state: ItemState | undefined,
  today: string,
): DerivedState {
  if (state?.status === 'done') return 'done';
  if (item.windowEnd && diffDays(today, item.windowEnd) < 0) return 'overdue';
  if (item.windowStart && diffDays(today, item.windowStart) > 0) return 'upcoming';
  if (item.windowEnd && diffDays(today, item.windowEnd) <= CLOSING_DAYS) return 'closing';
  return 'open';
}

export interface Gestation {
  /** Whole days since LMP. Negative before it, which shouldn't happen. */
  days: number;
  weeks: number;
  /** The "+n days" part. */
  remainder: number;
}

/**
 * Gestational age runs from LMP, not from EDD — that's how the clinic counts,
 * and it's what the week labels on the form refer to.
 */
export function getGestation(lmp: string, today: string): Gestation {
  const days = diffDays(lmp, today);
  return { days, weeks: Math.floor(days / 7), remainder: ((days % 7) + 7) % 7 };
}

/** "12+3" — the numerals stay in this order in every locale. */
export function formatGestation(g: Gestation): string {
  return `${g.weeks}+${g.remainder}`;
}

/** Days until the due date; negative once past it. */
export function daysUntilDue(edd: string, today: string): number {
  return diffDays(today, edd);
}

export const INVASIVENESS_LABELS: Record<Invasiveness, Localized> = {
  none: { he: 'ללא דקירה', en: 'No needle', nl: 'Geen prik' },
  'blood-draw': { he: 'דקירה בזרוע', en: 'Blood draw', nl: 'Prik in de arm' },
  invasive: { he: 'פולשני', en: 'Invasive', nl: 'Invasief' },
};

/** Sort key: by window start, then by how far the window runs. */
export function comparePlanItems(a: PlanItem, b: PlanItem): number {
  const aStart = a.windowStart ?? a.windowEnd ?? '';
  const bStart = b.windowStart ?? b.windowEnd ?? '';
  if (aStart !== bStart) return aStart < bStart ? -1 : 1;
  return (a.windowEnd ?? '9999-12-31') < (b.windowEnd ?? '9999-12-31') ? -1 : 1;
}

export function pick(text: Localized, locale: Locale): string {
  return text[locale];
}
