import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCycle } from '@/lib/store';

export default function SettingsScreen() {
  const { settings, info, updateSettings, resetAll } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  const confirmReset = () => {
    const doReset = () => {
      resetAll();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      // Alert has no buttons on web.
      if (window.confirm('Delete all data? This cannot be undone.')) doReset();
      return;
    }
    Alert.alert(
      'Delete all data?',
      'All logged periods, symptoms and notes will be permanently removed from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: doReset },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Settings</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Cycle defaults</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Used until enough periods are logged, then averages take over automatically.
            </ThemedText>
            <Stepper
              label="Cycle length"
              value={settings.cycleLength}
              min={21}
              max={45}
              onChange={(cycleLength) => updateSettings({ cycleLength })}
            />
            <Stepper
              label="Period length"
              value={settings.periodLength}
              min={2}
              max={10}
              onChange={(periodLength) => updateSettings({ periodLength })}
            />
            {info.episodes.length >= 2 && (
              <ThemedText type="small" themeColor="textSecondary">
                Based on your logs: cycle ~{info.avgCycleLength} days, period ~
                {info.avgPeriodLength} days.
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">🔒 Your privacy</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Everything you log stays on this phone. Nothing is uploaded, shared, or sent to any
              server — there are no accounts and no tracking.
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">💞 Partner sharing</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Coming in a future update: invite your partner so they can follow your cycle from
              their own phone.
            </ThemedText>
          </ThemedView>

          <Pressable
            onPress={confirmReset}
            style={({ pressed }) => [
              styles.dangerButton,
              { borderColor: theme.period },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.period }}>
              Delete all data
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
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dangerButton: {
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
