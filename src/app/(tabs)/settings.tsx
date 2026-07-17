import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCycle } from '@/lib/store';

function confirm(title: string, message: string, action: () => void, destructiveLabel: string) {
  if (Platform.OS === 'web') {
    // Alert has no buttons on web.
    if (window.confirm(`${title}\n\n${message}`)) action();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: destructiveLabel, style: 'destructive', onPress: action },
  ]);
}

export default function SettingsScreen() {
  const {
    settings,
    info,
    updateSettings,
    resetAll,
    startSharing,
    checkPartnerJoined,
    endSharing,
  } = useCycle();
  const theme = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const isPartner = settings.role === 'partner';

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setShareError(null);
    try {
      await fn();
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = () => {
    confirm(
      'Delete all data?',
      'All logged periods, symptoms and notes will be permanently removed from this device.',
      () => {
        resetAll();
        router.replace('/');
      },
      'Delete everything',
    );
  };

  const confirmEndSharing = () => {
    confirm(
      'Stop sharing?',
      isPartner
        ? 'You will no longer see your partner’s cycle, and this device will be unlinked.'
        : 'Your partner will no longer see your cycle, and your shared data is removed from the server.',
      () => run(endSharing),
      'Stop sharing',
    );
  };

  const sharingCard = () => {
    if (isPartner) {
      return (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            This phone is connected to your partner’s Duet. You see their cycle; they do the
            logging.
          </ThemedText>
          <Pressable onPress={confirmEndSharing} style={styles.linkButton}>
            <ThemedText type="smallBold" style={{ color: theme.period }}>
              Stop sharing
            </ThemedText>
          </Pressable>
        </>
      );
    }
    if (settings.partnerLinked) {
      return (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            ✓ Connected — your partner sees your cycle on their phone.
            {settings.lastSyncAt
              ? ` Last synced ${new Date(settings.lastSyncAt).toLocaleString()}.`
              : ''}
          </ThemedText>
          <Pressable onPress={confirmEndSharing} style={styles.linkButton}>
            <ThemedText type="smallBold" style={{ color: theme.period }}>
              Stop sharing
            </ThemedText>
          </Pressable>
        </>
      );
    }
    if (settings.inviteCode) {
      return (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Have your partner install Duet, choose “My partner tracks with Duet” on the welcome
            screen, and enter this code:
          </ThemedText>
          <ThemedText style={styles.inviteCode}>{settings.inviteCode}</ThemedText>
          <Pressable
            onPress={() =>
              run(async () => {
                const joined = await checkPartnerJoined();
                setCheckResult(
                  joined
                    ? null
                    : 'No partner yet — the code is still waiting to be used.',
                );
              })
            }
            disabled={busy}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: theme.backgroundSelected },
              (pressed || busy) && styles.dimmed,
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <ThemedText type="smallBold">Check if partner joined</ThemedText>
            )}
          </Pressable>
          {checkResult && (
            <ThemedText type="small" themeColor="textSecondary">
              {checkResult}
            </ThemedText>
          )}
          <Pressable onPress={confirmEndSharing} style={styles.linkButton}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Cancel invite
            </ThemedText>
          </Pressable>
        </>
      );
    }
    return (
      <>
        <ThemedText type="small" themeColor="textSecondary">
          Let your partner follow your cycle from their own phone. Only your partner can see it
          — sharing sends your cycle data (encrypted) through Duet’s sync server, and you can
          stop at any time.
        </ThemedText>
        <Pressable
          onPress={() => run(async () => void (await startSharing()))}
          disabled={busy}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: theme.tint },
            (pressed || busy) && styles.dimmed,
          ]}>
          {busy ? (
            <ActivityIndicator color={theme.onAccent} />
          ) : (
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              Create invite code
            </ThemedText>
          )}
        </Pressable>
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Settings</ThemedText>

          {!isPartner && (
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
          )}

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">💞 Partner sharing</ThemedText>
            {sharingCard()}
            {shareError && (
              <ThemedText type="small" style={{ color: theme.period }}>
                {shareError}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">🔒 Your privacy</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your data stays on this phone unless you turn on partner sharing. With sharing on,
              your cycle data is stored encrypted on Duet’s sync server so your partner’s phone
              can read it — and nothing else. No ads, no analytics, no third parties, ever.
            </ThemedText>
          </ThemedView>

          {!isPartner && (
            <Pressable
              onPress={confirmReset}
              style={({ pressed }) => [
                styles.dangerButton,
                { borderColor: theme.period },
                pressed && styles.dimmed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.period }}>
                Delete all data
              </ThemedText>
            </Pressable>
          )}
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
  inviteCode: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  secondaryButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  dangerButton: {
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  dimmed: {
    opacity: 0.6,
  },
});
