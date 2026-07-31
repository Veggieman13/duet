import { Redirect, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CycleRing } from '@/components/cycle-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DayMarker, PHASE_DESCRIPTIONS, PHASE_LABELS } from '@/lib/cycle';
import { dateToKey, formatKey, formatShort, monthTitle, todayKey } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { DISCLAIMER, TIP_SECTIONS } from '@/lib/tips';
import { MOODS, SYMPTOMS } from '@/lib/types';

/** How far ahead the ring can be swiped — predictions run out beyond this. */
const MAX_MONTHS_AHEAD = 6;

/** First run of period (logged or predicted) days within the given month. */
function monthPeriod(year: number, month: number, markers: Record<string, DayMarker>) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let start: number | undefined;
  let end: number | undefined;
  let predicted = false;

  for (let day = 1; day <= daysInMonth; day++) {
    const marker = markers[dateToKey(new Date(year, month, day))];
    const isPeriod = marker === 'period' || marker === 'predicted';
    if (isPeriod && start == null) {
      start = day;
      end = day;
      predicted = marker === 'predicted';
    } else if (isPeriod && end === day - 1) {
      end = day;
    } else if (start != null) {
      break;
    }
  }

  return start == null ? null : { start, end: end!, predicted };
}

export default function TodayScreen() {
  const { settings, info, logs, syncStatus, refreshFromPartner } = useCycle();
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  /** Months away from the current one; 0 is today's month. */
  const [monthOffset, setMonthOffset] = useState(0);

  const shiftMonth = (delta: number) =>
    setMonthOffset((prev) => Math.min(MAX_MONTHS_AHEAD, prev + delta));

  // Horizontal swipes over the ring move between months.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx <= -40) shiftMonth(1);
        else if (g.dx >= 40) shiftMonth(-1);
      },
    }),
  ).current;

  const view = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [monthOffset]);

  if (!settings.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  const today = todayKey();
  const todayLog = logs[today];
  const isPartner = settings.role === 'partner';
  const now = new Date();
  // Leave room for the month arrows on either side of the ring.
  const ringSize = Math.min(320, width - Spacing.three * 2 - 56);

  const isCurrentMonth = monthOffset === 0;
  const viewPeriod = monthPeriod(view.year, view.month, info.markers);

  const phaseColor =
    info.phase === 'menstrual'
      ? theme.period
      : info.phase === 'fertile'
        ? theme.fertile
        : theme.tint;

  // Browsing another month: colour the centre by what that month holds.
  const centerColor = isCurrentMonth
    ? phaseColor
    : viewPeriod
      ? theme.period
      : theme.textSecondary;

  const countdown =
    info.daysUntilNextPeriod == null
      ? null
      : info.daysUntilNextPeriod > 0
        ? { big: `${info.daysUntilNextPeriod}`, small: info.daysUntilNextPeriod === 1 ? 'day to period' : 'days to period' }
        : info.daysUntilNextPeriod === 0
          ? { big: 'Today', small: 'period expected' }
          : { big: `${-info.daysUntilNextPeriod}`, small: 'days late' };

  const phaseTips = TIP_SECTIONS.find((s) => s.phase === info.phase)?.tips.slice(0, 2) ?? [];

  const summaryParts = [
    todayLog?.flow && `${todayLog.flow} flow`,
    todayLog?.mood && MOODS.find((m) => m.value === todayLog.mood)?.label.toLowerCase(),
    todayLog?.symptoms.length ? `${todayLog.symptoms.length} symptom${todayLog.symptoms.length === 1 ? '' : 's'}` : null,
    todayLog?.note && 'note',
  ].filter(Boolean);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <ThemedText type="subtitle" numberOfLines={1}>
                {monthTitle(view.year, view.month)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {isCurrentMonth ? formatKey(today) : 'Swipe the ring to browse months'}
              </ThemedText>
            </View>
            {isCurrentMonth && info.cycleDay != null && (
              <View style={[styles.cycleDayPill, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold" style={{ color: phaseColor }}>
                  Day {info.cycleDay}
                </ThemedText>
              </View>
            )}
            {!isCurrentMonth && (
              <Pressable
                onPress={() => setMonthOffset(0)}
                style={[styles.cycleDayPill, { backgroundColor: theme.tint }]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  Today
                </ThemedText>
              </Pressable>
            )}
          </View>

          {isPartner && (
            <ThemedView type="backgroundElement" style={styles.partnerBanner}>
              <View style={styles.partnerBannerText}>
                <ThemedText type="smallBold">💞 Your partner’s cycle</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {syncStatus === 'syncing'
                    ? 'Updating…'
                    : syncStatus === 'error'
                      ? 'Could not update — check your connection'
                      : settings.lastSyncAt
                        ? `Updated ${new Date(settings.lastSyncAt).toLocaleString()}`
                        : 'Waiting for first sync'}
                </ThemedText>
              </View>
              <Pressable onPress={refreshFromPartner} hitSlop={8}>
                <ThemedText type="smallBold" themeColor="tint">
                  Refresh
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <View style={styles.ringWrap} {...pan.panHandlers}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              hitSlop={12}
              style={styles.monthArrow}
              accessibilityLabel="Previous month">
              <ThemedText type="subtitle" themeColor="textSecondary">
                ‹
              </ThemedText>
            </Pressable>

            <CycleRing
              year={view.year}
              month={view.month}
              markers={info.markers}
              size={ringSize}>
              <View style={[styles.ringCenter, { backgroundColor: centerColor }]}>
                {isCurrentMonth && countdown ? (
                  <>
                    <ThemedText style={[styles.centerBig, { color: theme.onAccent }]}>
                      {countdown.big}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.onAccent }}>
                      {countdown.small}
                    </ThemedText>
                    <View style={styles.centerDivider} />
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      {PHASE_LABELS[info.phase]}
                    </ThemedText>
                  </>
                ) : isCurrentMonth ? (
                  <>
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      Welcome
                    </ThemedText>
                    <ThemedText type="small" style={[styles.centerHint, { color: theme.onAccent }]}>
                      Log your period to see predictions
                    </ThemedText>
                  </>
                ) : viewPeriod ? (
                  <>
                    <ThemedText style={[styles.centerMedium, { color: theme.onAccent }]}>
                      {viewPeriod.start}–{viewPeriod.end}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.centerHint, { color: theme.onAccent }]}>
                      {viewPeriod.predicted ? 'period expected' : 'period logged'}
                    </ThemedText>
                    <View style={styles.centerDivider} />
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      {monthTitle(view.year, view.month).split(' ')[0]}
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type="small" style={[styles.centerHint, { color: theme.onAccent }]}>
                    No period this month
                  </ThemedText>
                )}
              </View>
            </CycleRing>

            <Pressable
              onPress={() => shiftMonth(1)}
              hitSlop={12}
              disabled={monthOffset >= MAX_MONTHS_AHEAD}
              style={[styles.monthArrow, monthOffset >= MAX_MONTHS_AHEAD && styles.dimmed]}
              accessibilityLabel="Next month">
              <ThemedText type="subtitle" themeColor="textSecondary">
                ›
              </ThemedText>
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.phaseCard}>
            <ThemedText type="smallBold">{PHASE_LABELS[info.phase]}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {PHASE_DESCRIPTIONS[info.phase]}
            </ThemedText>
          </ThemedView>

          <View style={styles.statRow}>
            <ThemedView type="backgroundElement" style={styles.statCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Next period
              </ThemedText>
              <ThemedText type="smallBold">
                {info.nextPeriodStart ? formatShort(info.nextPeriodStart) : '—'}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.statCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Fertile window
              </ThemedText>
              <ThemedText type="smallBold">
                {info.fertileWindowStart
                  ? `${formatShort(info.fertileWindowStart)} – ${formatShort(info.fertileWindowEnd!)}`
                  : '—'}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.statCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Cycle length
              </ThemedText>
              <ThemedText type="smallBold">{info.avgCycleLength} days</ThemedText>
            </ThemedView>
          </View>

          {!isPartner && (
            <Pressable
              onPress={() => router.push(`/log/${today}`)}
              style={({ pressed }) => [
                styles.logButton,
                { backgroundColor: theme.tint },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                {todayLog ? 'Edit today’s log' : '+  Log today'}
              </ThemedText>
            </Pressable>
          )}

          {todayLog && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Logged today</ThemedText>
              <View style={styles.chipRow}>
                {todayLog.flow && (
                  <View style={[styles.miniChip, { backgroundColor: theme.periodSoft }]}>
                    <ThemedText type="small" style={{ color: theme.period }}>
                      {todayLog.flow} flow
                    </ThemedText>
                  </View>
                )}
                {todayLog.mood && (
                  <View style={[styles.miniChip, { backgroundColor: theme.tintSoft }]}>
                    <ThemedText type="small">
                      {MOODS.find((m) => m.value === todayLog.mood)?.emoji}{' '}
                      {MOODS.find((m) => m.value === todayLog.mood)?.label}
                    </ThemedText>
                  </View>
                )}
                {todayLog.symptoms.map((symptom) => (
                  <View
                    key={symptom}
                    style={[styles.miniChip, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="small">
                      {SYMPTOMS.find((s) => s.value === symptom)?.emoji} {symptom}
                    </ThemedText>
                  </View>
                ))}
              </View>
              {todayLog.note && (
                <ThemedText type="small" themeColor="textSecondary">
                  “{todayLog.note}”
                </ThemedText>
              )}
              {summaryParts.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  Nothing logged yet today.
                </ThemedText>
              )}
            </ThemedView>
          )}

          {phaseTips.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">💡 Good to know right now</ThemedText>
              {phaseTips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    •
                  </ThemedText>
                  <ThemedText type="small" style={styles.tipText}>
                    {tip}
                  </ThemedText>
                </View>
              ))}
              <Pressable onPress={() => router.push('/tips')} hitSlop={8}>
                <ThemedText type="smallBold" themeColor="tint">
                  More tips for this phase →
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            {DISCLAIMER}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTitles: {
    flexShrink: 1,
  },
  cycleDayPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  ringWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrow: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.3,
  },
  ringCenter: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  centerBig: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
  },
  centerMedium: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  centerDivider: {
    height: 1,
    width: 44,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginVertical: Spacing.two,
  },
  centerHint: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  phaseCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  logButton: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  miniChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tipText: {
    flex: 1,
  },
  partnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  partnerBannerText: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  disclaimer: {
    opacity: 0.8,
  },
});
