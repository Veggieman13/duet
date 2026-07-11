import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PHASE_DESCRIPTIONS, PHASE_LABELS } from '@/lib/cycle';
import { formatKey, formatShort, todayKey } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { DISCLAIMER } from '@/lib/tips';
import { TIP_SECTIONS } from '@/lib/tips';

export default function TodayScreen() {
  const { settings, info, logs } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  if (!settings.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  const today = todayKey();
  const todayLog = logs[today];

  const heroBackground =
    info.phase === 'menstrual'
      ? theme.periodSoft
      : info.phase === 'fertile'
        ? theme.fertileSoft
        : theme.backgroundElement;

  const nextPeriodText =
    info.daysUntilNextPeriod == null
      ? '—'
      : info.daysUntilNextPeriod > 1
        ? `in ${info.daysUntilNextPeriod} days`
        : info.daysUntilNextPeriod === 1
          ? 'tomorrow'
          : info.daysUntilNextPeriod === 0
            ? 'expected today'
            : `${-info.daysUntilNextPeriod} day${info.daysUntilNextPeriod === -1 ? '' : 's'} late`;

  const phaseTip = TIP_SECTIONS.find((s) => s.phase === info.phase)?.tips[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            <ThemedText type="subtitle">Today</ThemedText>
            <ThemedText themeColor="textSecondary">{formatKey(today)}</ThemedText>
          </View>

          <View style={[styles.hero, { backgroundColor: heroBackground }]}>
            {info.cycleDay != null && (
              <ThemedText type="small" themeColor="textSecondary">
                Cycle day {info.cycleDay}
              </ThemedText>
            )}
            <ThemedText type="subtitle">{PHASE_LABELS[info.phase]}</ThemedText>
            <ThemedText themeColor="textSecondary">{PHASE_DESCRIPTIONS[info.phase]}</ThemedText>
          </View>

          <View style={styles.statRow}>
            <ThemedView type="backgroundElement" style={styles.statCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Next period
              </ThemedText>
              <ThemedText type="smallBold">{nextPeriodText}</ThemedText>
              {info.nextPeriodStart && (
                <ThemedText type="small" themeColor="textSecondary">
                  {formatShort(info.nextPeriodStart)}
                </ThemedText>
              )}
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
              {info.ovulationDate && (
                <ThemedText type="small" themeColor="textSecondary">
                  Ovulation ~{formatShort(info.ovulationDate)}
                </ThemedText>
              )}
            </ThemedView>
          </View>

          <Pressable
            onPress={() => router.push(`/log/${today}`)}
            style={({ pressed }) => [
              styles.logButton,
              { backgroundColor: theme.tint },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {todayLog ? 'Edit today’s log' : 'Log today'}
            </ThemedText>
          </Pressable>

          {todayLog && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Logged today</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[
                  todayLog.flow && `Flow: ${todayLog.flow}`,
                  todayLog.symptoms.length > 0 && todayLog.symptoms.join(', '),
                  todayLog.note && `Note: ${todayLog.note}`,
                ]
                  .filter(Boolean)
                  .join('\n')}
              </ThemedText>
            </ThemedView>
          )}

          {phaseTip && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">💡 Tip for this phase</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {phaseTip}
              </ThemedText>
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
  hero: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  logButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  disclaimer: {
    marginTop: Spacing.two,
    opacity: 0.8,
  },
});
