import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarMonth } from '@/components/calendar-month';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { monthTitle } from '@/lib/dates';
import { useCycle } from '@/lib/store';

export default function CalendarScreen() {
  const { info, logs } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const loggedDays = useMemo(
    () =>
      new Set(
        Object.keys(logs).filter((key) => {
          const log = logs[key];
          return log.symptoms.length > 0 || log.note;
        }),
      ),
    [logs],
  );

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const legend = [
    { color: theme.period, label: 'Period' },
    { color: theme.periodSoft, label: 'Predicted' },
    { color: theme.fertileSoft, label: 'Fertile' },
    { color: theme.fertile, label: 'Ovulation' },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Calendar</ThemedText>

          <View style={styles.monthNav}>
            <Pressable onPress={() => shiftMonth(-1)} style={styles.navButton}>
              <ThemedText type="subtitle">‹</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{monthTitle(view.year, view.month)}</ThemedText>
            <Pressable onPress={() => shiftMonth(1)} style={styles.navButton}>
              <ThemedText type="subtitle">›</ThemedText>
            </Pressable>
          </View>

          <CalendarMonth
            year={view.year}
            month={view.month}
            markers={info.markers}
            loggedDays={loggedDays}
            onDayPress={(key) => router.push(`/log/${key}`)}
          />

          <View style={styles.legend}>
            {legend.map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            Tap a day to log or edit it. Predictions sharpen as you log more periods.
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
