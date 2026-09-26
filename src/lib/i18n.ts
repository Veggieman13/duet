/**
 * Three locales, all equal citizens: he, en, nl.
 *
 * Hebrew is the clinical source language — the plan's `label.he` strings are
 * transcribed from the clinic's printed form and are what gets said at the
 * desk. There is no fallback path: a missing string is a bug, not a design
 * decision, which is why every table below is typed as a full record.
 *
 * The handover brief for this module was written against the web platform and
 * asks for `dir`, `unicode-bidi: isolate`, `<bdi>` and logical CSS properties.
 * None of those exist in React Native. The equivalents used here:
 *   - `<bdi>` / `unicode-bidi: isolate`  ->  U+2068..U+2069 around the run
 *   - `dir="auto"`                       ->  writingDirection on the Text style
 *   - `margin-inline-start`              ->  marginStart / marginEnd
 * Layout does not mirror (see AGENTS.md): React Native can only flip layout
 * via I18nManager, which needs an app reload, and this module's language
 * switch has to be instant. Hebrew text renders and aligns correctly; chrome
 * like back arrows stays LTR.
 */

export type Locale = 'he' | 'en' | 'nl';

export const LOCALES: Locale[] = ['he', 'en', 'nl'];

/** Every translatable string carries all three languages side by side. */
export interface Localized {
  he: string;
  en: string;
  nl: string;
}

/** Shown in the language switch, each in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  he: 'עברית',
  en: 'English',
  nl: 'Nederlands',
};

export function isRTL(locale: Locale): boolean {
  return locale === 'he';
}

/** Unicode isolate controls — the RN stand-in for `<bdi>`. */
const FSI = '⁨';
const PDI = '⁩';

/**
 * Wrap Latin/Greek runs and numbers so the bidi algorithm can't reorder them
 * inside Hebrew text. Without this, strings like "PAPP-A ו-β-hCG", "תרבית
 * ל-GBS" and "כ-1 ל-500" scramble on screen.
 *
 * Only applied to Hebrew: the controls are inert in LTR text, but there's no
 * reason to carry them where they do nothing.
 */
export function isolateLatin(text: string, locale: Locale): string {
  if (!isRTL(locale)) return text;
  // A run starting with a Latin or Greek letter and continuing through
  // letters, digits and the punctuation that binds them (β-hCG, PAPP-A,
  // 50 g), or a bare number (the "500" in "1 ל-500").
  return text.replace(
    /[A-Za-zÀ-ɏͰ-Ͽ][A-Za-z0-9À-ɏͰ-Ͽ._\-–/]*|\d+(?:[.,:\-–/]\d+)*/g,
    (run) => `${FSI}${run}${PDI}`,
  );
}

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Day first in every locale, so a date is never ambiguous between two people
 * reading the same screen in different languages. Formatted by hand rather
 * than through Intl, whose locale data is uneven across Hermes builds.
 */
export function formatDate(key: string, locale: Locale): string {
  const [y, m, d] = key.split('-');
  if (locale === 'en') return `${Number(d)} ${EN_MONTHS[Number(m) - 1]} ${y}`;
  return `${d}/${m}/${y}`;
}

/** "28/10/2026 – 04/11/2026", or an open-ended window. */
export function formatWindow(
  start: string | null,
  end: string | null,
  locale: Locale,
): string {
  if (start && end) return `${formatDate(start, locale)} – ${formatDate(end, locale)}`;
  if (end) return `${t('by', locale)} ${formatDate(end, locale)}`;
  if (start) return `${t('from', locale)} ${formatDate(start, locale)}`;
  return '';
}

type StringKey =
  | 'pregnancy' | 'week' | 'due' | 'dueIn' | 'overdueBy' | 'days'
  | 'trimester1' | 'trimester2' | 'trimester3'
  | 'status' | 'statusNone' | 'statusScheduled' | 'statusDone'
  | 'stateUpcoming' | 'stateOpen' | 'stateClosing' | 'stateOverdue' | 'stateDone'
  | 'optional' | 'notPlanned' | 'unconfirmed' | 'unconfirmedDose'
  | 'whatHappens' | 'whatFor' | 'notes' | 'addNote' | 'trimesterNotes'
  | 'markDone' | 'markScheduled' | 'clearStatus' | 'undo' | 'undone'
  | 'schedule' | 'changeDate' | 'place' | 'placeHint'
  | 'addToCalendar' | 'calendarHint'
  | 'time' | 'noTime' | 'hour' | 'minutes' | 'otherDates' | 'windowOnly' | 'outsideWarning'
  | 'supplements' | 'daily' | 'by' | 'from' | 'you' | 'partner'
  | 'savedBy' | 'disclaimer' | 'language' | 'displayName' | 'displayNameHint'
  | 'noPlan' | 'planIntro';

const STRINGS: Record<StringKey, Localized> = {
  pregnancy: { he: 'היריון', en: 'Pregnancy', nl: 'Zwangerschap' },
  week: { he: 'שבוע', en: 'Week', nl: 'Week' },
  due: { he: 'תאריך לידה משוער', en: 'Due', nl: 'Uitgerekende datum' },
  dueIn: { he: 'עוד', en: 'in', nl: 'over' },
  overdueBy: { he: 'עברו', en: 'past by', nl: 'over tijd met' },
  days: { he: 'ימים', en: 'days', nl: 'dagen' },

  trimester1: { he: 'שליש ראשון', en: 'First trimester', nl: 'Eerste trimester' },
  trimester2: { he: 'שליש שני', en: 'Second trimester', nl: 'Tweede trimester' },
  trimester3: { he: 'שליש שלישי', en: 'Third trimester', nl: 'Derde trimester' },

  status: { he: 'סטטוס', en: 'Status', nl: 'Status' },
  statusNone: { he: 'לא נקבע', en: 'Not scheduled', nl: 'Niet gepland' },
  statusScheduled: { he: 'נקבע', en: 'Scheduled', nl: 'Gepland' },
  statusDone: { he: 'בוצע', en: 'Done', nl: 'Gedaan' },

  stateUpcoming: { he: 'בהמשך', en: 'Upcoming', nl: 'Komt nog' },
  stateOpen: { he: 'בחלון', en: 'Window open', nl: 'Kan nu' },
  stateClosing: { he: 'החלון נסגר', en: 'Window closing', nl: 'Bijna dicht' },
  stateOverdue: { he: 'החלון עבר', en: 'Window passed', nl: 'Termijn voorbij' },
  stateDone: { he: 'בוצע', en: 'Done', nl: 'Gedaan' },

  optional: { he: 'אופציונלי', en: 'Optional', nl: 'Optioneel' },
  notPlanned: { he: 'לא בתוכנית', en: 'Not in this plan', nl: 'Niet in dit plan' },
  unconfirmed: {
    he: 'לאימות מול המרפאה',
    en: 'To confirm with the clinic',
    nl: 'Nog navragen bij de kliniek',
  },
  unconfirmedDose: {
    he: 'המינונים טעונים אישור הרופא',
    en: 'Doses need confirming with your doctor',
    nl: 'Doseringen nog bevestigen met de arts',
  },

  whatHappens: { he: 'מה קורה בפועל', en: 'What happens', nl: 'Wat er gebeurt' },
  whatFor: { he: 'למה זה', en: 'What it is for', nl: 'Waarvoor' },
  notes: { he: 'הערות', en: 'Notes', nl: 'Notities' },
  addNote: { he: 'הוספת הערה', en: 'Add a note', nl: 'Notitie toevoegen' },
  trimesterNotes: { he: 'הערות כלליות', en: 'General notes', nl: 'Algemene notities' },

  markDone: { he: 'סימון כבוצע', en: 'Mark done', nl: 'Markeer als gedaan' },
  markScheduled: { he: 'סימון כנקבע', en: 'Mark scheduled', nl: 'Markeer als gepland' },
  clearStatus: { he: 'ניקוי סטטוס', en: 'Clear status', nl: 'Status wissen' },
  undo: { he: 'ביטול', en: 'Undo', nl: 'Ongedaan maken' },
  undone: { he: 'בוטל', en: 'Undone', nl: 'Ongedaan gemaakt' },

  schedule: { he: 'קביעת תאריך', en: 'Set a date', nl: 'Datum kiezen' },
  changeDate: { he: 'שינוי תאריך', en: 'Change date', nl: 'Datum wijzigen' },
  place: { he: 'מקום', en: 'Place', nl: 'Locatie' },
  placeHint: { he: 'מרפאה, כתובת', en: 'Clinic, address', nl: 'Kliniek, adres' },
  addToCalendar: {
    he: 'הוספה ליומן Google',
    en: 'Add to Google Calendar',
    nl: 'Toevoegen aan Google Agenda',
  },
  calendarHint: {
    he: 'מוסיף עותק ליומן שלך. אם התור זז, צריך לעדכן גם שם.',
    en: 'Adds a copy to your own calendar. If the appointment moves, change it there too.',
    nl: 'Zet een kopie in je eigen agenda. Verschuift de afspraak, pas hem daar dan ook aan.',
  },
  time: { he: 'שעה', en: 'Time', nl: 'Tijd' },
  noTime: { he: 'ללא שעה', en: 'No time', nl: 'Geen tijd' },
  hour: { he: 'שעה', en: 'Hour', nl: 'Uur' },
  minutes: { he: 'דקות', en: 'Minutes', nl: 'Minuten' },
  otherDates: {
    he: 'תאריך מחוץ לחלון…',
    en: 'A date outside the window…',
    nl: 'Een datum buiten de termijn…',
  },
  windowOnly: {
    he: 'רק תאריכים בתוך החלון',
    en: 'Only dates inside the window',
    nl: 'Alleen datums binnen de termijn',
  },
  outsideWarning: {
    he: 'התאריך הזה מחוץ לחלון שבטופס של המרפאה. כדאי לוודא מול המרפאה שהבדיקה עדיין תקפה במועד הזה.',
    en: 'This date is outside the window on the clinic\u2019s form. Worth checking with the clinic that the test still counts on this date.',
    nl: 'Deze datum valt buiten de termijn op het formulier van de kliniek. Vraag de kliniek even na of het onderzoek op deze datum nog telt.',
  },

  supplements: { he: 'תוספי תזונה', en: 'Daily supplements', nl: 'Dagelijkse supplementen' },
  daily: { he: 'כל יום', en: 'Every day', nl: 'Elke dag' },
  by: { he: 'עד', en: 'By', nl: 'Vóór' },
  from: { he: 'מ-', en: 'From', nl: 'Vanaf' },
  you: { he: 'את/ה', en: 'You', nl: 'Jij' },
  partner: { he: 'בן/בת הזוג', en: 'Your partner', nl: 'Je partner' },
  savedBy: { he: 'נכתב על ידי', en: 'Written by', nl: 'Geschreven door' },

  disclaimer: {
    he: 'המידע כאן הוא שכתוב של תוכנית המעקב של המרפאה, לא ייעוץ רפואי. בכל שאלה פנו לרופא/ה.',
    en: 'This restates your clinic’s follow-up plan. It is not medical advice — ask your doctor or midwife about anything here.',
    nl: 'Dit is een weergave van het controleplan van je kliniek, geen medisch advies. Vraag je arts of verloskundige bij twijfel.',
  },

  language: { he: 'שפה', en: 'Language', nl: 'Taal' },
  displayName: { he: 'השם שלי', en: 'My name', nl: 'Mijn naam' },
  displayNameHint: {
    he: 'מופיע ליד ההערות שכתבת. נשמר אצלכם בלבד.',
    en: 'Shown next to notes you write. Shared only with your partner.',
    nl: 'Staat bij notities die je schrijft. Alleen met je partner gedeeld.',
  },

  noPlan: { he: 'אין תוכנית פעילה', en: 'No active plan', nl: 'Geen actief plan' },
  planIntro: {
    he: 'תוכנית המעקב של המרפאה, לשניכם.',
    en: 'Your clinic’s follow-up plan, for both of you.',
    nl: 'Het controleplan van de kliniek, voor jullie samen.',
  },
};

export function t(key: StringKey, locale: Locale): string {
  return STRINGS[key][locale];
}

export function trimesterLabel(trimester: 1 | 2 | 3, locale: Locale): string {
  return t(`trimester${trimester}` as StringKey, locale);
}
