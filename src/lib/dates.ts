/**
 * All dates in the app are plain local-date strings ("2026-07-11").
 * Date objects are only created at noon local time so day math is
 * immune to daylight-saving shifts.
 */

export function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayKey(): string {
  return dateToKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateToKey(d);
}

/** Days from `from` to `to`; positive when `to` is later. */
export function diffDays(from: string, to: string): number {
  return Math.round((keyToDate(to).getTime() - keyToDate(from).getTime()) / 86_400_000);
}

/** "Sat, Jul 11" */
export function formatKey(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "Jul 11" */
export function formatShort(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "July 2026" */
export function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
