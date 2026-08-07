import { Redirect, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
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
import { DayMarker, getDayDetail, PHASE_DESCRIPTIONS, PHASE_LABELS } from '@/lib/cycle';
import { dateToKey, formatKey, formatShort, monthTitle, todayKey } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { DISCLAIMER, TIP_SECTIONS } from '@/lib/tips';
import { MOODS, SYMPTOMS } from '@/lib/types';

/** How far ahead the ring can be swiped — predictions run out beyond this. */
const MAX_MONTHS_AHEAD = 6;
/** Horizontal travel that commits to a month change. */
const SWIPE_THRESHOLD = 45;
/** react-native-web ignores the native driver. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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

const MARKER_LABELS: Record<DayMarker, string> = {
  period: 'Period',
  predicted: 'Period expected',
  fertile: 'Fertile window',
  ovulation: 'Ovulation',
};

export default function TodayScreen() {
  const { settings, info, logs, syncStatus, refreshFromPartner } = useCycle();
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  /** Months away from the current one; 0 is today's month. */
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();

  const translateX = useRef(new Animated.Value(0)).current;
  /** How far the ring travels when changing month. */
  const slideDistance = Math.min(width * 0.6, 280);

  const settle = () =>
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: USE_NATIVE_DRIVER,
      bounciness: 4,
    }).start();

  /** Slide the ring out, swap the month, slide the new one in. */
  const slide = (direction: number) => {
    const target = Math.min(MAX_MONTHS_AHEAD, monthOffset + direction);
    if (target === monthOffset) {
      settle();
      return;
    }
    Animated.timing(translateX, {
      toValue: -direction * slideDistance,
      duration: 140,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      setMonthOffset(target);
      setSelected(undefined);
      translateX.setValue(direction * slideDistance);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: USE_NATIVE_DRIVER,
        bounciness: 2,
        speed: 14,
      }).start();
    });
  };

  // PanResponder is created once, so it calls through a ref to stay current.
  const slideRef = useRef(slide);
  slideRef.current = slide;

  const pan = useRef(
    PanResponder.create({
      // Only claim the gesture once it's clearly a horizontal drag, so day
      // taps and vertical scrolling still work.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => translateX.setValue(g.dx * 0.5),
      onPanResponderRelease: (_, g) => {
        if (g.dx <= -SWIPE_THRESHOLD) slideRef.current(1);
        else if (g.dx >= SWIPE_THRESHOLD) slideRef.current(-1);
        else settle();
      },
      onPanResponderTerminate: settle,
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
  // Leave room for the month arrows on either side of the ring.
  const ringSize = Math.min(320, width - Spacing.three * 2 - 56);

  const isCurrentMonth = monthOffset === 0;
  const viewPeriod = monthPeriod(view.year, view.month, info.markers);
  const detail = selected ? getDayDetail(info, selected) : null;
  const selectedLog = selected ? logs[selected] : undefined;
  const canLogSelected = !!selected && selected <= today && !isPartner;

  const phaseColor =
    info.phase === 'menstrual'
      ? theme.period
      : info.phase === 'fertile'
        ? theme.fertile
        : theme.tint;

  const markerColor = (marker?: DayMarker) =>
    marker === 'period'
      ? theme.period
      : marker === 'predicted'
        ? theme.period
        : marker === 'fertile' || marker === 'ovulation'
          ? theme.fertile
          : theme.tint;

  const centerColor = detail
    ? markerColor(detail.marker)
    : isCurrentMonth
      ? phaseColor
      : viewPeriod
        ? theme.period
        : theme.textSecondary;

  const countdown =
    info.daysUntilNextPeriod == null
      ? null
      : info.daysUntilNextPeriod > 0
        ? {
            big: `${info.daysUntilNextPeriod}`,
            small: info.daysUntilNextPeriod === 1 ? 'day to period' : 'days to period',
          }
        : info.daysUntilNextPeriod === 0
          ? { big: 'Today', small: 'period expected' }
          : { big: `${-info.daysUntilNextPeriod}`, small: 'days late' };

  const phaseTips = TIP_SECTIONS.find((s) => s.phase === info.phase)?.tips.slice(0, 2) ?? [];

  const statusFor = (d: NonNullable<typeof detail>) =>
    d.marker ? MARKER_LABELS[d.marker] : d.cycleDay ? `Cycle day ${d.cycleDay}` : '';

  const chipsFor = (log?: (typeof logs)[string]) => {
    if (!log) return null;
    return (
      <View style={styles.chipRow}>
        {log.flow && (
          <View style={[styles.miniChip, { backgroundColor: theme.periodSoft }]}>
            <ThemedText type="small" style={{ color: theme.period }}>
              {log.flow} flow
            </ThemedText>
          </View>
        )}
        {log.mood && (
          <View style={[styles.miniChip, { backgroundColor: theme.tintSoft }]}>
            <ThemedText type="small">
              {MOODS.find((m) => m.value === log.mood)?.emoji}{' '}
              {MOODS.find((m) => m.value === log.mood)?.label}
            </ThemedText>
          </View>
        )}
        {log.symptoms.map((symptom) => (
          <View key={symptom} style={[styles.miniChip, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small">
              {SYMPTOMS.find((s) => s.value === symptom)?.emoji} {symptom}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

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
                {selected
                  ? 'Tap another day, or Today to go back'
                  : isCurrentMonth
                    ? formatKey(today)
                    : 'Swipe the ring to browse months'}
              </ThemedText>
            </View>
            {isCurrentMonth && !selected && info.cycleDay != null && (
              <View style={[styles.cycleDayPill, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold" style={{ color: phaseColor }}>
                  Day {info.cycleDay}
                </ThemedText>
              </View>
            )}
            {(!isCurrentMonth || selected) && (
              <Pressable
                onPress={() => {
                  setMonthOffset(0);
                  setSelected(undefined);
                }}
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

          <View style={styles.ringRow} {...pan.panHandlers}>
            <Pressable
              onPress={() => slide(-1)}
              hitSlop={12}
              style={styles.monthArrow}
              accessibilityLabel="Previous month">
              <ThemedText type="subtitle" themeColor="textSecondary">
                ‹
              </ThemedText>
            </Pressable>

            <Animated.View
              style={{
                transform: [{ translateX }],
                opacity: translateX.interpolate({
                  inputRange: [-slideDistance, 0, slideDistance],
                  outputRange: [0.2, 1, 0.2],
                  extrapolate: 'clamp',
                }),
              }}>
              <CycleRing
                year={view.year}
                month={view.month}
                markers={info.markers}
                size={ringSize}
                selected={selected}
                onDayPress={(key) => setSelected(key === selected ? undefined : key)}>
                <View style={[styles.ringCenter, { backgroundColor: centerColor }]}>
                  {detail ? (
                    <>
                      <ThemedText type="small" style={{ color: theme.onAccent }}>
                        {formatShort(detail.date)}
                      </ThemedText>
                      {detail.hasEstimate ? (
                        <>
                          <ThemedText style={[styles.centerBig, { color: theme.onAccent }]}>
                            {detail.chance === 0 ? '<1%' : `${detail.chance}%`}
                          </ThemedText>
                          <ThemedText type="small" style={[styles.centerHint, { color: theme.onAccent }]}>
                            chance of pregnancy
                          </ThemedText>
                        </>
                      ) : (
                        <ThemedText type="small" style={[styles.centerHint, { color: theme.onAccent }]}>
                          Log a period for estimates
                        </ThemedText>
                      )}
                      {!!statusFor(detail) && (
                        <>
                          <View style={[styles.centerDivider, { backgroundColor: theme.onAccent }]} />
                          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                            {statusFor(detail)}
                          </ThemedText>
                        </>
                      )}
                    </>
                  ) : isCurrentMonth && countdown ? (
                    <>
                      <ThemedText style={[styles.centerBig, { color: theme.onAccent }]}>
                        {countdown.big}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.onAccent }}>
                        {countdown.small}
                      </ThemedText>
                      <View style={[styles.centerDivider, { backgroundColor: theme.onAccent }]} />
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
                      <View style={[styles.centerDivider, { backgroundColor: theme.onAccent }]} />
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
            </Animated.View>

            <Pressable
              onPress={() => slide(1)}
              hitSlop={12}
              disabled={monthOffset >= MAX_MONTHS_AHEAD}
              style={[styles.monthArrow, monthOffset >= MAX_MONTHS_AHEAD && styles.dimmed]}
              accessibilityLabel="Next month">
              <ThemedText type="subtitle" themeColor="textSecondary">
                ›
              </ThemedText>
            </Pressable>
          </View>

          {detail ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{formatKey(detail.date)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[
                  statusFor(detail),
                  // Skip the offset line when the status already says "Ovulation".
                  detail.hasEstimate && detail.ovulation && detail.offsetFromOvulation !== 0
                    ? `${Math.abs(detail.offsetFromOvulation!)} day${
                        Math.abs(detail.offsetFromOvulation!) === 1 ? '' : 's'
                      } ${detail.offsetFromOvulation! < 0 ? 'before' : 'after'} estimated ovulation`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>

              {detail.hasEstimate && (
                <View style={styles.chanceRow}>
                  <View style={[styles.chanceBadge, { backgroundColor: markerColor(detail.marker) }]}>
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      {detail.chance === 0 ? '<1%' : `${detail.chance}%`}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.chanceText}>
                    <ThemedText type="smallBold">{detail.chanceLabel}</ThemedText> · estimated
                    chance of conceiving on this day, based on your cycle history. Never use it
                    as contraception.
                  </ThemedText>
                </View>
              )}

              {chipsFor(selectedLog)}
              {selectedLog?.note && (
                <ThemedText type="small" themeColor="textSecondary">
                  “{selectedLog.note}”
                </ThemedText>
              )}

              {canLogSelected && (
                <Pressable
                  onPress={() => router.push(`/log/${detail.date}`)}
                  style={({ pressed }) => [
                    styles.logButton,
                    { backgroundColor: theme.tint },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                    {selectedLog ? 'Edit this day' : '+  Log this day'}
                  </ThemedText>
                </Pressable>
              )}
              {!!selected && selected > today && (
                <ThemedText type="small" themeColor="textSecondary">
                  Future days can’t be logged yet.
                </ThemedText>
              )}
            </ThemedView>
          ) : (
            <>
              <ThemedView type="backgroundElement" style={styles.card}>
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
                  {chipsFor(todayLog)}
                  {todayLog.note && (
                    <ThemedText type="small" themeColor="textSecondary">
                      “{todayLog.note}”
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
            </>
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
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrow: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 40,
    lineHeight: 46,
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
    opacity: 0.45,
    marginVertical: Spacing.two,
  },
  centerHint: {
    textAlign: 'center',
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
  chanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chanceBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  chanceText: {
    flex: 1,
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
  dimmed: {
    opacity: 0.3,
  },
  disclaimer: {
    opacity: 0.8,
  },
});
