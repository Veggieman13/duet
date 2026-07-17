import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarMonth } from '@/components/calendar-month';
import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { monthTitle } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { DEFAULT_SETTINGS } from '@/lib/types';

export default function OnboardingScreen() {
  const { completeOnboarding } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [lastPeriodStart, setLastPeriodStart] = useState<string | undefined>();
  const [cycleLength, setCycleLength] = useState(DEFAULT_SETTINGS.cycleLength);
  const [periodLength, setPeriodLength] = useState(DEFAULT_SETTINGS.periodLength);

  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth();

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const finish = (withDate: boolean) => {
    completeOnboarding({
      lastPeriodStart: withDate ? lastPeriodStart : undefined,
      cycleLength,
      periodLength,
    });
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <ThemedText type="subtitle">Welcome 🌸</ThemedText>
            <ThemedText themeColor="textSecondary">
              A few quick questions and you are set. Everything stays private, on this phone only.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">When did your last period start?</ThemedText>
            <View style={styles.monthNav}>
              <Pressable onPress={() => shiftMonth(-1)} style={styles.navButton}>
                <ThemedText type="subtitle">‹</ThemedText>
              </Pressable>
              <ThemedText type="smallBold">{monthTitle(view.year, view.month)}</ThemedText>
              <Pressable
                onPress={() => shiftMonth(1)}
                disabled={isCurrentMonth}
                style={[styles.navButton, isCurrentMonth && styles.dimmed]}>
                <ThemedText type="subtitle">›</ThemedText>
              </Pressable>
            </View>
            <CalendarMonth
              year={view.year}
              month={view.month}
              selected={lastPeriodStart}
              onDayPress={setLastPeriodStart}
            />
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Stepper
              label="Typical cycle length"
              value={cycleLength}
              min={21}
              max={45}
              onChange={setCycleLength}
            />
            <Stepper
              label="Typical period length"
              value={periodLength}
              min={2}
              max={10}
              onChange={setPeriodLength}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Not sure? Leave the defaults — the app learns your real rhythm as you log.
            </ThemedText>
          </ThemedView>

          <Pressable
            onPress={() => finish(true)}
            disabled={!lastPeriodStart}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.tint },
              (pressed || !lastPeriodStart) && styles.dimmed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              Get started
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => finish(false)} style={styles.skipButton}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              I don’t remember — skip for now
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.push('/pair')} style={styles.skipButton}>
            <ThemedText type="smallBold" themeColor="tint">
              💞 My partner tracks with Duet — I have an invite code
            </ThemedText>
          </Pressable>
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
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  headerSection: {
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  section: {
    gap: Spacing.two,
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  primaryButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  dimmed: {
    opacity: 0.5,
  },
});
