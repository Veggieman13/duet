/**
 * "Add to Google Calendar" as a plain link — no Google sign-in, no calendar
 * permission, no native module. The phone opens Google Calendar's own
 * event-creation page with everything filled in, and the person taps Save.
 *
 * It's a one-time copy: if the appointment moves, the calendar entry has to be
 * moved by hand. That trade was deliberate — anything that keeps the event in
 * sync needs either a native calendar module or Google OAuth (see AGENTS.md).
 */

import { addDays } from '@/lib/dates';
import { Locale } from '@/lib/i18n';
import { PlanItem } from '@/lib/pregnancy';

/** Clinic appointments rarely run longer; people can adjust before saving. */
const DEFAULT_DURATION_MINUTES = 60;

function compactDate(key: string): string {
  return key.replaceAll('-', '');
}

function compactTime(hhmm: string, plusMinutes = 0): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + plusMinutes;
  const hh = `${Math.floor(total / 60)}`.padStart(2, '0');
  const mm = `${total % 60}`.padStart(2, '0');
  return `${hh}${mm}00`;
}

export function googleCalendarUrl(
  item: PlanItem,
  locale: Locale,
  date: string,
  time: string | undefined,
  place: string | undefined,
): string {
  // Each partner adds to their own calendar, so the title follows their
  // language — but the Hebrew label goes alongside, because that's the name
  // said at the clinic desk.
  const title =
    locale === 'he' ? item.label.he : `${item.label[locale]} (${item.label.he})`;

  // Without a time it becomes an all-day event; Google wants the day after as
  // the (exclusive) end. With a time and no timezone, Google reads it in the
  // calendar's own timezone — the right one for an appointment you attend in
  // person.
  const dates = time
    ? `${compactDate(date)}T${compactTime(time)}/${compactDate(date)}T${compactTime(
        time,
        DEFAULT_DURATION_MINUTES,
      )}`
    : `${compactDate(date)}/${compactDate(addDays(date, 1))}`;

  const details = `${item.explain[locale]}\n\n${item.method[locale]}`;

  const params = [
    ['action', 'TEMPLATE'],
    ['text', title],
    ['dates', dates],
    ['details', details],
    ...(place ? [['location', place]] : []),
  ];
  const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `https://calendar.google.com/calendar/render?${query}`;
}
