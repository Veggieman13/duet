import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CycleRing } from '@/components/cycle-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PHASE_DESCRIPTIONS, PHASE_LABELS } from '@/lib/cycle';
import { formatKey, formatShort, monthTitle, todayKey } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { DISCLAIMER, TIP_SECTIONS } from '@/lib/tips';
import { MOODS, SYMPTOMS } from '@/lib/types';

export default function TodayScreen() {
  const { settings, info, logs, syncStatus, refreshFromPartner } = useCycle();
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  if (!settings.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  const today = todayKey();
  const todayLog = logs[today];
  const isPartner = settings.role === 'partner';
  const now = new Date();
  const ringSize = Math.min(330, width - Spacing.three * 2);

  const phaseColor =
    info.phase === 'menstrual'
      ? theme.period
      : info.phase === 'fertile'
        ? theme.fertile
        : theme.tint;

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
            <View>
              <ThemedText type="subtitle">{monthTitle(now.getFullYear(), now.getMonth())}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatKey(today)}
              </ThemedText>
            </View>
            {info.cycleDay != null && (
              <View style={[styles.cycleDayPill, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold" style={{ color: phaseColor }}>
                  Day {info.cycleDay}
                </ThemedText>
              </View>
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

          <View style={styles.ringWrap}>
            <CycleRing
              year={now.getFullYear()}
              month={now.getMonth()}
              markers={info.markers}
              size={ringSize}>
              <View style={[styles.ringCenter, { backgroundColor: phaseColor }]}>
                {countdown ? (
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
                ) : (
                  <>
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      Welcome
                    </ThemedText>
                    <ThemedText type="small" style={[styles.centerHint, { color: theme.onAccent }]}>
                      Log your period to see predictions
                    </ThemedText>
                  </>
                )}
              </View>
            </CycleRing>
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
  },
  cycleDayPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  ringWrap: {
    alignItems: 'center',
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
