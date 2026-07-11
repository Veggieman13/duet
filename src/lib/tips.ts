import { Phase } from '@/lib/cycle';

export interface TipSection {
  phase: Phase;
  emoji: string;
  title: string;
  blurb: string;
  tips: string[];
}

export const TIP_SECTIONS: TipSection[] = [
  {
    phase: 'menstrual',
    emoji: '🌙',
    title: 'During your period',
    blurb: 'Days 1–5 (roughly). Hormones are at their lowest — your body is asking for rest.',
    tips: [
      'Heat helps: a warm bath, heating pad, or hot water bottle can ease cramps.',
      'Iron-rich foods (lentils, spinach, red meat) help replace what you lose.',
      'Gentle movement like walking or stretching often eases cramps more than full rest.',
      'It is normal to want more sleep — try to get an extra 30–60 minutes.',
      'Persistent severe pain is not something to just push through — mention it to a doctor.',
    ],
  },
  {
    phase: 'follicular',
    emoji: '🌱',
    title: 'Follicular phase',
    blurb: 'After your period ends. Estrogen rises, and with it mood, focus and energy.',
    tips: [
      'Many people feel their sharpest now — a good window for big tasks and decisions.',
      'Energy for exercise tends to peak; strength training pays off especially well.',
      'Protein and colorful vegetables support the extra activity your body is up for.',
      'A good time to schedule things you have been putting off — momentum comes easier.',
    ],
  },
  {
    phase: 'fertile',
    emoji: '✨',
    title: 'Fertile window',
    blurb: 'Roughly 6 days ending just after ovulation. Conception is most likely now.',
    tips: [
      'If you are trying to conceive, these are the days that matter most.',
      'If you are avoiding pregnancy, remember app predictions are estimates — not contraception.',
      'Some feel a one-sided twinge around ovulation (mittelschmerz) — usually harmless.',
      'Discharge often becomes clearer and stretchier around now; that is a normal sign.',
    ],
  },
  {
    phase: 'luteal',
    emoji: '🍂',
    title: 'Luteal phase',
    blurb: 'After ovulation until your next period. Progesterone rises, energy may dip.',
    tips: [
      'PMS symptoms (irritability, bloating, low mood) are common in the last week — be kind to yourself.',
      'Complex carbs and magnesium-rich foods (nuts, dark chocolate) can steady mood and cravings.',
      'Swap intense workouts for moderate ones if your energy dips — consistency beats intensity.',
      'Prioritize sleep: it gets lighter for many people in this phase.',
      'Craving more alone time is normal — it is hormonal, not a character flaw.',
    ],
  },
];

export const DISCLAIMER =
  'This app offers general wellness information, not medical advice. Predictions are estimates based on your logged data and should not be used as contraception. For medical concerns, talk to a healthcare professional.';
