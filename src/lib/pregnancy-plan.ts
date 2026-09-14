/**
 * The clinic's follow-up plan, as shipped seed data.
 *
 * Source: Maccabi (Israel) printed follow-up form. The `label.he` strings are
 * transcribed verbatim — they are what gets said at the desk and written on
 * referrals, so do not "improve" them or back-translate them from English.
 * `explain.he` and `method.he` are written for this app and can be edited.
 *
 * Windows are the printed dates, not LMP + 7×week. The two don't always agree
 * and the printed dates are what the appointment desk works from.
 *
 * The three languages live next to each other on the item rather than in
 * separate locale files: the content is fixed and small, and adjacency is what
 * stops them drifting apart.
 */

import { PlanItem, PregnancyConfig, Supplement } from '@/lib/pregnancy';

/**
 * Seeded with the pregnancy this module was built for. Config, not constants —
 * the doctor may revise the LMP after a dating scan, and every derived week
 * shifts with it.
 */
export const DEFAULT_PREGNANCY: PregnancyConfig = {
  active: false,
  lmp: '2026-07-30',
  edd: '2027-05-06',
};

export const PLAN: PlanItem[] = [
  {
    id: 'first-visit',
    type: 'consult',
    trimester: 1,
    weekLabel: '≤12',
    windowStart: null,
    windowEnd: '2026-10-28',
    optional: false,
    invasiveness: 'none',
    label: { he: 'בדיקת רופא ראשונה', en: 'First doctor visit', nl: 'Eerste consult' },
    explain: {
      he: 'פגישת היכרות: היסטוריה רפואית, לחץ דם והפניות לסבב הבדיקות הראשון.',
      en: 'Intake appointment: history, blood pressure, referrals for the first round of tests.',
      nl: 'Intakegesprek: voorgeschiedenis, bloeddruk, verwijzingen voor de eerste onderzoeken.',
    },
    method: {
      he: 'פגישה במרפאה, כ-20 עד 30 דקות. ללא דקירה.',
      en: 'Clinic appointment, about 20 to 30 minutes. Nothing invasive.',
      nl: 'Afspraak in de kliniek, ongeveer 20 tot 30 minuten. Geen prik.',
    },
  },
  {
    id: 'blood-tests',
    type: 'test',
    trimester: 1,
    weekLabel: '≤12',
    windowStart: null,
    windowEnd: '2026-10-28',
    optional: false,
    invasiveness: 'blood-draw',
    label: { he: 'בדיקות דם', en: 'Blood tests', nl: 'Bloedonderzoek' },
    explain: {
      he: 'סוג דם ו-Rh, ספירת דם, ברזל, בלוטת התריס, סוכר, וכן חסינות וזיהומים: אדמת, צהבת B ו-C, HIV ועגבת.',
      en: 'Blood group and rhesus, full blood count, iron, thyroid, glucose, and immunity/infection screening (rubella, hepatitis B and C, HIV, syphilis).',
      nl: 'Bloedgroep en rhesus, bloedbeeld, ijzer, schildklier, glucose, en immuniteit/infecties (rodehond, hepatitis B en C, hiv, syfilis).',
    },
    method: {
      he: 'דקירה אחת, כמה מבחנות יחד. בדרך כלל אין צורך לצום. תוצאות תוך כשבוע.',
      en: 'One needle, several tubes at once. Fasting usually not required. Results generally within a week.',
      nl: 'Eén prik, meerdere buisjes tegelijk. Nuchter zijn is meestal niet nodig. Uitslag doorgaans binnen een week.',
    },
  },
  {
    id: 'urine-tests',
    type: 'test',
    trimester: 1,
    weekLabel: '≤12',
    windowStart: null,
    windowEnd: '2026-10-28',
    optional: false,
    invasiveness: 'none',
    label: { he: 'בדיקות שתן', en: 'Urine tests', nl: 'Urineonderzoek' },
    explain: {
      he: 'חלבון, סוכר וזיהום נסתר בדרכי השתן.',
      en: 'Protein, glucose, and hidden urinary tract infection.',
      nl: 'Eiwit, glucose en verborgen blaasontsteking.',
    },
    method: {
      he: 'מסירת מיכל, רצוי משתן הבוקר. ללא דקירה.',
      en: 'Drop off a sample, preferably first morning urine. Nothing else.',
      nl: 'Potje inleveren, bij voorkeur ochtendurine. Verder niets.',
    },
  },
  {
    id: 'first-ultrasound',
    type: 'test',
    trimester: 1,
    weekLabel: '7–8',
    windowStart: '2026-09-17',
    windowEnd: '2026-09-30',
    optional: false,
    invasiveness: 'none',
    label: { he: 'אולטרסאונד ראשון', en: 'First ultrasound', nl: 'Eerste echo' },
    explain: {
      he: 'מאשר שההיריון ברחם, דופק, מספר עוברים וקביעת שבוע מדויקת.',
      en: 'Confirms the pregnancy is in the uterus, heartbeat, number of embryos, and precise dating.',
      nl: 'Bevestigt dat de zwangerschap in de baarmoeder zit, hartslag, aantal vruchtjes en de precieze termijn.',
    },
    method: {
      he: 'לרוב אולטרסאונד וגינלי, כי העובר עדיין קטן מכדי להיראות היטב דרך הבטן. כ-10 דקות, ללא כאב וללא הכנה.',
      en: 'Usually a transvaginal scan — the embryo is still too small to see well through the abdomen. About 10 minutes, painless, no preparation.',
      nl: 'Meestal een inwendige echo via de vagina — de vrucht is nog te klein om via de buik goed te zien. Ongeveer 10 minuten, niet pijnlijk, geen voorbereiding.',
    },
  },
  {
    id: 'carrier-screening',
    type: 'test',
    trimester: 1,
    weekLabel: '0–13',
    windowStart: '2026-07-30',
    windowEnd: '2026-11-04',
    optional: false,
    invasiveness: 'blood-draw',
    label: {
      he: 'בדיקות סקר גנטיות',
      en: 'Genetic carrier screening',
      nl: 'Genetische dragerschapsscreening',
    },
    explain: {
      he: 'בדיקת דם לשני בני הזוג: האם שניכם נשאים של אותה מחלה תורשתית. הפאנל נקבע לפי מוצא.',
      en: 'Blood test for both partners, checking whether both carry the same inherited condition. Panel depends on ancestry.',
      nl: 'Bloedtest bij beide partners: zijn jullie drager van dezelfde erfelijke aandoening? Het panel hangt af van de afkomst.',
    },
    method: {
      he: 'דקירה בזרוע לשניכם, לעיתים גם משטח לחי. התוצאות מגיעות תוך שלושה עד ארבעה שבועות.',
      en: 'Blood draw for both of you, sometimes a cheek swab as well. Expect three to four weeks for results.',
      nl: 'Bloedprik bij jullie allebei, soms een wanguitstrijkje. Reken op drie tot vier weken wachten op de uitslag.',
    },
  },
  {
    id: 'nuchal-translucency',
    type: 'test',
    trimester: 1,
    weekLabel: '11–13',
    windowStart: '2026-10-15',
    windowEnd: '2026-11-04',
    optional: false,
    invasiveness: 'none',
    label: { he: 'שקיפות עורפית', en: 'Nuchal translucency scan', nl: 'Nekplooimeting' },
    explain: {
      he: 'אולטרסאונד המודד את שכבת הנוזל בעורף העובר. מדידה עבה יותר עשויה להצביע על בעיה כרומוזומלית או לבבית.',
      en: 'Ultrasound measuring the fluid layer at the back of the neck. A thicker measurement can point to a chromosomal or heart condition.',
      nl: 'Echo die het vochtlaagje in de nek meet. Een dikkere nekplooi kan wijzen op een chromosoom- of hartafwijking.',
    },
    method: {
      he: 'אולטרסאונד חיצוני דרך הבטן, 20 עד 30 דקות. ללא סיכון לעובר. לעיתים ממתינים עד שהעובר נכנס לתנוחה מתאימה.',
      en: 'External scan over the abdomen, 20 to 30 minutes. No risk to the baby. Sometimes you wait for the baby to move into position.',
      nl: 'Uitwendige echo over de buik, 20 tot 30 minuten. Geen enkel risico voor de baby. Soms moet je even wachten tot het kindje goed ligt.',
    },
  },
  {
    id: 'biochem-t1',
    type: 'test',
    trimester: 1,
    weekLabel: '11–13',
    windowStart: '2026-10-15',
    windowEnd: '2026-11-04',
    optional: false,
    invasiveness: 'blood-draw',
    label: {
      he: 'סקר ביוכימי שליש ראשון',
      en: 'First trimester biochemical screen',
      nl: 'Biochemische screening eerste trimester',
    },
    explain: {
      he: 'בדיקת דם (PAPP-A ו-β-hCG חופשי). יחד עם השקיפות העורפית והגיל מתקבל מספר סיכון, לא אבחנה.',
      en: 'Blood test (PAPP-A, free β-hCG). Combined with the nuchal scan and maternal age it produces a risk figure, not a diagnosis.',
      nl: 'Bloedtest (PAPP-A, vrij β-hCG). Samen met de nekplooi en de leeftijd geeft dit een risicogetal, geen diagnose.',
    },
    method: {
      he: 'דקירה רגילה בזרוע. משולב עם השקיפות העורפית לתוצאה אחת, ולכן כדאי לקבוע אותן בסמיכות.',
      en: 'Ordinary blood draw. Combined with the nuchal scan into a single result, so schedule the two close together.',
      nl: 'Gewone bloedprik. Wordt gecombineerd met de nekplooi tot één risicogetal, dus plan ze dicht bij elkaar.',
    },
  },
  {
    id: 'cvs',
    type: 'test',
    trimester: 1,
    weekLabel: '11–13',
    windowStart: '2026-10-15',
    windowEnd: '2026-11-04',
    optional: true,
    struckOut: true,
    invasiveness: 'invasive',
    label: { he: 'סיסי שליה', en: 'Chorionic villus sampling', nl: 'Vlokkentest' },
    explain: {
      he: 'בדיקה אבחנתית פולשנית. מחוקה בטופס של המרפאה — אינה חלק מהתוכנית.',
      en: 'Invasive diagnostic test. Struck out on the clinic’s form — not part of this plan.',
      nl: 'Invasieve diagnostische test. Doorgestreept op het formulier van de kliniek — geen onderdeel van dit plan.',
    },
    method: {
      he: 'מחט או צינורית דקה אל השליה לנטילת רקמה. לא מתוכננת.',
      en: 'Needle or thin catheter to the placenta to take tissue. Not planned — listed only for completeness.',
      nl: 'Naald of dun slangetje naar de placenta om weefsel af te nemen. Niet gepland — staat er alleen voor de volledigheid.',
    },
  },
  {
    id: 'anatomy-early',
    type: 'test',
    trimester: 2,
    weekLabel: '14–16',
    windowStart: '2026-11-05',
    windowEnd: '2026-11-25',
    optional: false,
    invasiveness: 'none',
    label: { he: 'סקירת מערכות מוקדמת', en: 'Early anatomy scan', nl: 'Vroege orgaanscan' },
    explain: {
      he: 'הבדיקה השיטתית הראשונה של איברי העובר.',
      en: 'First systematic check of the organs.',
      nl: 'Eerste systematische controle van de organen.',
    },
    method: {
      he: 'אולטרסאונד חיצוני, 20 עד 30 דקות. המין לרוב כבר נראה, אז כדאי לומר מראש אם אתם רוצים לדעת.',
      en: 'External scan, 20 to 30 minutes. The sex is usually visible by now, so say in advance whether you want to know.',
      nl: 'Uitwendige echo, 20 tot 30 minuten. Het geslacht is meestal al zichtbaar, dus zeg vooraf of je het wilt weten.',
    },
  },
  {
    id: 'biochem-t2',
    type: 'test',
    trimester: 2,
    weekLabel: '16–19',
    windowStart: '2026-11-19',
    windowEnd: '2026-12-16',
    optional: false,
    invasiveness: 'blood-draw',
    label: {
      he: 'סקר ביוכימי שליש שני',
      en: 'Second trimester biochemical screen',
      nl: 'Biochemische screening tweede trimester',
    },
    explain: {
      he: 'בדיקת דם הכוללת גם את הסיכון למום בתעלה העצבית.',
      en: 'Blood test that also covers the risk of a neural tube defect.',
      nl: 'Bloedtest die ook het risico op een neuralebuisdefect meeneemt.',
    },
    method: {
      he: 'דקירה רגילה בזרוע, ללא הכנה.',
      en: 'Ordinary blood draw, no preparation.',
      nl: 'Gewone bloedprik, geen voorbereiding.',
    },
  },
  {
    id: 'amniocentesis',
    type: 'test',
    trimester: 2,
    weekLabel: '16–20',
    windowStart: '2026-11-19',
    windowEnd: '2026-12-23',
    optional: true,
    invasiveness: 'invasive',
    label: { he: 'דיקור מי שפיר', en: 'Amniocentesis', nl: 'Vruchtwaterpunctie' },
    explain: {
      he: 'בדיקה אבחנתית אופציונלית לבדיקת כרומוזומים. נותנת ודאות, עם סיכון קטן להפלה של כ-1 ל-500.',
      en: 'Optional diagnostic test for chromosomal analysis. Gives certainty; carries a small miscarriage risk, roughly 1 in 500.',
      nl: 'Optionele diagnostische test voor chromosoomonderzoek. Geeft zekerheid; klein risico op miskraam, ongeveer 1 op 500.',
    },
    method: {
      he: 'מחט דקה דרך דופן הבטן בהנחיית אולטרסאונד, לשאיבת מעט מי שפיר. הדקירה עצמה נמשכת דקות ומורגשת כהתכווצות חזקה. יום מנוחה אחריה. תוצאה מהירה תוך כמה ימים, בדיקת כרומוזומים מלאה תוך שבועיים עד שלושה.',
      en: 'A thin needle through the abdominal wall under ultrasound guidance, drawing off some amniotic fluid. The puncture itself takes a few minutes and feels like a sharp period cramp. Take it easy for a day afterwards. Rapid result within a few days, full chromosomal analysis in two to three weeks.',
      nl: 'Dunne naald door de buikwand onder echogeleiding, er wordt wat vruchtwater opgezogen. De prik zelf duurt een paar minuten en voelt als een felle menstruatiekramp. Daarna een dag rustig aan. Snelle uitslag na een paar dagen, volledig chromosoomonderzoek na twee tot drie weken.',
    },
  },
  {
    id: 'anatomy-late',
    type: 'test',
    trimester: 2,
    weekLabel: '21–24',
    windowStart: '2026-12-24',
    windowEnd: '2027-01-20',
    optional: false,
    invasiveness: 'none',
    label: { he: 'סקירת מערכות מאוחרת', en: 'Late anatomy scan', nl: 'Late orgaanscan' },
    explain: {
      he: 'יסודית יותר מהסקירה המוקדמת — האיברים נראים טוב יותר בשלב הזה.',
      en: 'More thorough than the early scan — the organs are better visible by now.',
      nl: 'Grondiger dan de vroege scan — de organen zijn dan beter zichtbaar.',
    },
    method: {
      he: 'הבדיקה הארוכה ביותר בהיריון, 30 עד 45 דקות. אולטרסאונד חיצוני, מעבר שיטתי על כל האיברים.',
      en: 'The longest scan of the pregnancy, 30 to 45 minutes. External ultrasound, every organ checked in turn.',
      nl: 'De langste echo van de hele zwangerschap, 30 tot 45 minuten. Uitwendige echo, alle organen worden systematisch nagelopen.',
    },
  },
  {
    id: 'fetal-echo',
    type: 'test',
    trimester: 2,
    weekLabel: '19–25',
    windowStart: '2026-12-10',
    windowEnd: '2027-01-27',
    optional: false,
    invasiveness: 'none',
    label: { he: 'אקו לב עוברי', en: 'Fetal echocardiogram', nl: 'Foetale hartecho' },
    explain: {
      he: 'אולטרסאונד ייעודי ללב בלבד.',
      en: 'Specialised ultrasound of the heart alone.',
      nl: 'Gespecialiseerde echo van alleen het hartje.',
    },
    method: {
      he: 'אולטרסאונד חיצוני על ידי מומחה, 30 עד 45 דקות.',
      en: 'External scan by a specialist, 30 to 45 minutes.',
      nl: 'Uitwendige echo door een specialist, 30 tot 45 minuten.',
    },
  },
  {
    id: 'glucose-tolerance',
    type: 'test',
    trimester: 2,
    weekLabel: '24–28',
    windowStart: '2027-01-14',
    windowEnd: '2027-02-17',
    optional: false,
    invasiveness: 'blood-draw',
    label: { he: 'העמסת סוכר', en: 'Glucose tolerance test', nl: 'Glucosetolerantietest' },
    explain: {
      he: 'בדיקת סוכרת היריון, בדרך כלל תחילה הגרסה הקצרה של 50 גרם.',
      en: 'Screens for gestational diabetes; usually the short 50 g version first.',
      nl: 'Test op zwangerschapsdiabetes, meestal eerst de korte variant met 50 g.',
    },
    method: {
      he: 'שתייה מתוקה עם 50 גרם גלוקוז, המתנה של שעה ואז דקירה. כשעה ויותר במרפאה. בתוצאה חריגה מגיעה גרסה ארוכה: בצום, שלוש שעות וכמה דקירות.',
      en: 'A sweet drink with 50 g of glucose, wait an hour, then a blood draw. Expect a good hour at the clinic. An abnormal result leads to the longer version: fasting, three hours, several draws.',
      nl: 'Zoete drank met 50 g glucose, een uur wachten, dan bloedprik. Reken op ruim een uur in de kliniek. Bij een afwijkende uitslag volgt een langere versie: nuchter komen, drie uur, meerdere prikken.',
    },
  },
  {
    id: 'pertussis-vaccine',
    type: 'test',
    trimester: 3,
    weekLabel: '27–36',
    windowStart: '2027-02-04',
    windowEnd: '2027-04-14',
    optional: false,
    invasiveness: 'blood-draw',
    label: {
      he: 'חיסון נגד שעלת',
      en: 'Pertussis (whooping cough) vaccine',
      nl: 'Kinkhoestvaccinatie',
    },
    explain: {
      he: 'הנוגדנים עוברים דרך השליה ומגנים על התינוק בחודשים הראשונים.',
      en: 'Antibodies cross the placenta and protect the baby through the first months.',
      nl: 'Antistoffen gaan via de placenta en beschermen de baby in de eerste maanden.',
    },
    method: {
      he: 'זריקה בשריר הזרוע. לעיתים כאב קל בזרוע ליום, ותו לא.',
      en: 'Injection into the upper arm. Often a tender arm for a day, nothing more.',
      nl: 'Injectie in de bovenarm. Vaak een dag een gevoelige arm, verder niets.',
    },
  },
  {
    id: 'growth-ultrasound',
    type: 'test',
    trimester: 3,
    weekLabel: '30–33',
    windowStart: '2027-02-25',
    windowEnd: '2027-03-24',
    optional: false,
    invasiveness: 'none',
    label: { he: 'אולטרה סאונד', en: 'Growth ultrasound', nl: 'Groei-echo' },
    explain: {
      he: 'הערכת משקל, מנח, מי שפיר ושליה.',
      en: 'Weight estimate, position, amniotic fluid, placenta.',
      nl: 'Gewichtsschatting, ligging, vruchtwater en placenta.',
    },
    method: {
      he: 'אולטרסאונד חיצוני, 15 עד 20 דקות. מדידות ראש, בטן ועצם הירך.',
      en: 'External scan, 15 to 20 minutes. Head, abdomen and femur measurements feed the weight estimate.',
      nl: 'Uitwendige echo, 15 tot 20 minuten. Metingen van hoofd, buik en dijbeen voor een gewichtsschatting.',
    },
  },
  {
    id: 'gbs-culture',
    type: 'test',
    trimester: 3,
    weekLabel: '35+',
    windowStart: '2027-04-01',
    windowEnd: null,
    optional: true,
    invasiveness: 'none',
    label: {
      he: 'תרבית ל-GBS',
      en: 'GBS culture (if indicated)',
      nl: 'GBS-kweek (op indicatie)',
    },
    explain: {
      he: 'משטח לאיתור סטרפטוקוקוס מקבוצה B. תוצאה חיובית מחייבת אנטיביוטיקה בלידה.',
      en: 'Swab for group B streptococcus. A positive result means antibiotics during labour.',
      nl: 'Wattenstaafje op groep-B-streptokokken. Positief betekent antibiotica tijdens de bevalling.',
    },
    method: {
      he: 'מקלון משטח מהנרתיק ומפי הטבעת, כמה שניות. במקרים רבים אפשר לבצע עצמאית.',
      en: 'A swab of the vagina and rectum, a few seconds. In many cases you can take it yourself.',
      nl: 'Wattenstaafje langs de vagina en de anus, een paar seconden. Mag in veel gevallen zelf afgenomen worden.',
    },
  },
  {
    id: 'post-term',
    type: 'test',
    trimester: 3,
    weekLabel: '40+',
    windowStart: '2027-05-06',
    windowEnd: '2027-05-20',
    optional: false,
    invasiveness: 'none',
    label: { he: 'הריון עודף', en: 'Post-term monitoring', nl: 'Controle bij overdragenheid' },
    explain: {
      he: 'ניטור פעמיים בשבוע כל עוד הלידה לא התחילה.',
      en: 'Monitoring twice a week for as long as labour hasn’t started.',
      nl: 'Monitoring twee keer per week zolang de bevalling nog niet begonnen is.',
    },
    method: {
      he: 'שתי חגורות ניטור על הבטן לרישום דופק וצירים (מוניטור), ואולטרסאונד קצר לכמות מי שפיר. כחצי שעה בשכיבה.',
      en: 'Two monitoring belts on the abdomen recording heartbeat and contractions (CTG), plus a short scan for amniotic fluid volume. About half an hour lying down.',
      nl: 'Twee banden om de buik die de hartslag en de weeën registreren (CTG), plus een korte echo voor de hoeveelheid vruchtwater. Ongeveer een half uur liggen.',
    },
  },

  // --- Routine consults ---------------------------------------------------
  // Handwritten in the margin of the source form and hard to read: weeks 16,
  // 24, 32 and 37 are our best reading. Windows below are LMP + 7×week for
  // that week only, which lines up exactly with the printed dates elsewhere
  // on the form (week 16 = 19/11/2026, week 24 = 14/01/2027). Flagged
  // unconfirmed so the UI says so until someone checks against the paper.
  ...([
    ['consult-w16', 16, 2, '2026-11-19', '2026-11-25'],
    ['consult-w24', 24, 2, '2027-01-14', '2027-01-20'],
    ['consult-w32', 32, 3, '2027-03-11', '2027-03-17'],
    ['consult-w37', 37, 3, '2027-04-15', '2027-04-21'],
  ] as const).map(
    ([id, week, trimester, start, end]): PlanItem => ({
      id,
      type: 'consult',
      trimester: trimester as 1 | 2 | 3,
      weekLabel: `${week}`,
      windowStart: start,
      windowEnd: end,
      optional: false,
      unconfirmed: true,
      invasiveness: 'none',
      label: {
        he: `בדיקת רופא שבוע ${week}`,
        en: `Doctor visit, week ${week}`,
        nl: `Consult, week ${week}`,
      },
      explain: {
        he: 'מעקב שגרתי: לחץ דם, משקל, דופק העובר ומעבר על תוצאות.',
        en: 'Routine check: blood pressure, weight, the baby’s heartbeat, and a look at recent results.',
        nl: 'Routinecontrole: bloeddruk, gewicht, hartslag van de baby en de recente uitslagen.',
      },
      method: {
        he: 'פגישה במרפאה, כ-15 עד 20 דקות. ללא דקירה.',
        en: 'Clinic appointment, about 15 to 20 minutes. No needle.',
        nl: 'Afspraak in de kliniek, ongeveer 15 tot 20 minuten. Geen prik.',
      },
    }),
  ),
];

/**
 * Not part of the timeline: no window, never ticked off. Doses were hard to
 * read on the form and get adjusted to blood results, so they render with a
 * "confirm with your doctor" note until someone checks them.
 */
export const SUPPLEMENTS: Supplement[] = [
  {
    id: 'folic-acid',
    label: { he: 'חומצה פולית', en: 'Folic acid', nl: 'Foliumzuur' },
    dose: '400 mcg',
    unconfirmed: true,
  },
  {
    id: 'vitamin-d',
    label: { he: 'ויטמין D', en: 'Vitamin D', nl: 'Vitamine D' },
    dose: '400 IU',
    unconfirmed: true,
  },
  {
    id: 'omega-3',
    label: { he: 'אומגה 3', en: 'Omega 3', nl: 'Omega 3' },
    dose: '200–300 mg DHA',
    unconfirmed: true,
  },
  {
    id: 'iron',
    label: { he: 'ברזל', en: 'Iron', nl: 'IJzer' },
    note: {
      he: 'בדרך כלל משבוע 12',
      en: 'Usually from week 12',
      nl: 'Meestal vanaf week 12',
    },
    unconfirmed: true,
  },
];

export function findItem(id: string): PlanItem | undefined {
  return PLAN.find((item) => item.id === id);
}
