import { addDays, diffDays } from '@/lib/dates';
import { CycleSettings, LogsByDate } from '@/lib/types';

export interface PeriodEpisode {
  start: string;
  end: string;
  length: number;
}

export type DayMarker = 'period' | 'predicted' | 'fertile' | 'ovulation';

export type Phase = 'menstrual' | 'follicular' | 'fertile' | 'luteal' | 'unknown';

export interface CycleInfo {
  episodes: PeriodEpisode[];
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStart?: string;
  /** 1-based day within the current cycle. */
  cycleDay?: number;
  nextPeriodStart?: string;
  /** Days until the predicted next period; negative means it is late. */
  daysUntilNextPeriod?: number;
  ovulationDate?: string;
  fertileWindowStart?: string;
  fertileWindowEnd?: string;
  phase: Phase;
  /** Calendar markers for logged and predicted days. */
  markers: Record<string, DayMarker>;
}

/** How many future cycles to project on the calendar. */
const PREDICTED_CYCLES = 4;
/** Ovulation is estimated this many days before the next period. */
const LUTEAL_DAYS = 14;

/** Group logged flow days into period episodes (a 1-day gap still counts as one period). */
export function deriveEpisodes(logs: LogsByDate): PeriodEpisode[] {
  const flowDays = Object.keys(logs)
    .filter((key) => logs[key]?.flow)
    .sort();

  const episodes: PeriodEpisode[] = [];
  for (const day of flowDays) {
    const current = episodes[episodes.length - 1];
    if (current && diffDays(current.end, day) <= 2) {
      current.end = day;
      current.length = diffDays(current.start, current.end) + 1;
    } else {
      episodes.push({ start: day, end: day, length: 1 });
    }
  }
  return episodes;
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function getCycleInfo(
  logs: LogsByDate,
  settings: CycleSettings,
  today: string,
): CycleInfo {
  const episodes = deriveEpisodes(logs);

  // Average cycle length from the gaps between recent period starts.
  const starts = episodes.map((e) => e.start);
  const intervals: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const gap = diffDays(starts[i - 1], starts[i]);
    if (gap >= 15 && gap <= 60) intervals.push(gap);
  }
  const avgCycleLength = average(intervals.slice(-6)) ?? settings.cycleLength;

  const periodLengths = episodes.map((e) => e.length).filter((l) => l >= 1 && l <= 12);
  const avgPeriodLength = average(periodLengths.slice(-6)) ?? settings.periodLength;

  const markers: Record<string, DayMarker> = {};
  for (const episode of episodes) {
    for (let d = episode.start; diffDays(d, episode.end) >= 0; d = addDays(d, 1)) {
      if (logs[d]?.flow) markers[d] = 'period';
    }
  }

  const lastEpisode = episodes[episodes.length - 1];
  if (!lastEpisode) {
    return { episodes, avgCycleLength, avgPeriodLength, phase: 'unknown', markers };
  }

  const lastPeriodStart = lastEpisode.start;
  const cycleDay = diffDays(lastPeriodStart, today) + 1;
  const nextPeriodStart = addDays(lastPeriodStart, avgCycleLength);
  const daysUntilNextPeriod = diffDays(today, nextPeriodStart);
  const ovulationDate = addDays(nextPeriodStart, -LUTEAL_DAYS);
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  // Project future cycles onto the calendar. Priority: period > ovulation > fertile > predicted.
  for (let k = 1; k <= PREDICTED_CYCLES; k++) {
    const predictedStart = addDays(lastPeriodStart, avgCycleLength * k);
    const ovulation = addDays(predictedStart, -LUTEAL_DAYS);
    if (!markers[ovulation]) markers[ovulation] = 'ovulation';
    for (let i = -5; i <= 1; i++) {
      const d = addDays(ovulation, i);
      if (!markers[d]) markers[d] = 'fertile';
    }
    for (let i = 0; i < avgPeriodLength; i++) {
      const d = addDays(predictedStart, i);
      if (!markers[d]) markers[d] = 'predicted';
    }
  }

  let phase: Phase;
  if (diffDays(lastEpisode.start, today) >= 0 && diffDays(today, lastEpisode.end) >= 0) {
    phase = 'menstrual';
  } else if (
    diffDays(fertileWindowStart, today) >= 0 &&
    diffDays(today, fertileWindowEnd) >= 0
  ) {
    phase = 'fertile';
  } else if (diffDays(today, fertileWindowStart) > 0) {
    phase = 'follicular';
  } else {
    phase = 'luteal';
  }

  return {
    episodes,
    avgCycleLength,
    avgPeriodLength,
    lastPeriodStart,
    cycleDay,
    nextPeriodStart,
    daysUntilNextPeriod,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    phase,
    markers,
  };
}

export const PHASE_LABELS: Record<Phase, string> = {
  menstrual: 'Period',
  follicular: 'Follicular phase',
  fertile: 'Fertile window',
  luteal: 'Luteal phase',
  unknown: 'Getting to know you',
};

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  menstrual: 'Your period is here. Be gentle with yourself — rest counts as productivity.',
  follicular: 'Estrogen is rising and energy tends to climb. A great window for new plans.',
  fertile: 'You are in your estimated fertile window — conception is most likely now.',
  luteal: 'The wind-down phase. Energy may dip and PMS can appear as your period nears.',
  unknown: 'Log your period to unlock predictions and phase insights.',
};
