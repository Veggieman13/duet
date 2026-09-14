import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSwitch } from '@/components/language-switch';
import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, todayKey } from '@/lib/dates';
import { formatDate, t } from '@/lib/i18n';
import { formatGestation, getGestation } from '@/lib/pregnancy';
import { usePregnancy } from '@/lib/pregnancy-store';
import { useCycle } from '@/lib/store';
import { THEME_OPTIONS } from '@/lib/types';

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
  const { config, updateConfig } = usePregnancy();
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
            Have your partner install Duet and choose “My partner tracks with Duet” on the
            welcome screen — then they simply scan this code:
          </ThemedText>
          <View style={styles.qrWrap}>
            <View style={styles.qrCard}>
              <QRCode value={`duet://pair?code=${settings.inviteCode}`} size={180} />
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.codeHint}>
            No camera handy? The code can also be typed:
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
            <ThemedText type="smallBold">Appearance</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choose how Duet looks, whatever your phone is set to.
            </ThemedText>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map(({ value, label, emoji }) => (
                <Pressable
                  key={value}
                  onPress={() => updateSettings({ theme: value })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.theme === value }}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor:
                        settings.theme === value ? theme.tint : theme.backgroundSelected,
                    },
                    pressed && styles.dimmed,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={settings.theme === value ? { color: theme.onAccent } : undefined}>
                    {emoji} {label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">🤍 Pregnancy</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Follows your clinic&apos;s plan instead of your cycle. Your cycle history stays
              where it is and comes back when you switch this off.
            </ThemedText>
            <View style={styles.themeRow}>
              <Pressable
                onPress={() => updateConfig({ active: !config.active })}
                accessibilityRole="switch"
                accessibilityState={{ checked: config.active }}
                style={({ pressed }) => [
                  styles.themeOption,
                  { backgroundColor: config.active ? theme.tint : theme.backgroundSelected },
                  pressed && styles.dimmed,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={config.active ? { color: theme.onAccent } : undefined}>
                  {config.active ? 'On' : 'Off'}
                </ThemedText>
              </Pressable>
            </View>

            {config.active && (
              <>
                <DateNudger
                  label="Last period started"
                  value={config.lmp}
                  onChange={(lmp) => updateConfig({ lmp })}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  That puts you at week {formatGestation(getGestation(config.lmp, todayKey()))}.
                  Every date window in the plan shifts with this, so change it if a dating scan
                  moves it.
                </ThemedText>
                <DateNudger
                  label="Due date"
                  value={config.edd}
                  onChange={(edd) => updateConfig({ edd })}
                />

                <ThemedText type="smallBold" style={styles.spacedTop}>
                  {t('language', settings.locale)}
                </ThemedText>
                <LanguageSwitch />

                <ThemedText type="smallBold" style={styles.spacedTop}>
                  {t('displayName', settings.locale)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('displayNameHint', settings.locale)}
                </ThemedText>
                <TextInput
                  value={settings.displayName ?? ''}
                  onChangeText={(displayName) => updateSettings({ displayName })}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.nameInput,
                    { backgroundColor: theme.backgroundSelected, color: theme.text },
                  ]}
                />
              </>
            )}
          </ThemedView>

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

/** Nudge a date a day at a time — enough for "the scan moved it by four days". */
function DateNudger({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const theme = useTheme();
  const { settings } = useCycle();
  return (
    <View style={styles.nudger}>
      <ThemedText type="small" style={styles.nudgerLabel}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => onChange(addDays(value, -1))}
        accessibilityRole="button"
        accessibilityLabel={`${label}, one day earlier`}
        style={[styles.nudgeButton, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">−</ThemedText>
      </Pressable>
      <ThemedText type="smallBold">{formatDate(value, settings.locale)}</ThemedText>
      <Pressable
        onPress={() => onChange(addDays(value, 1))}
        accessibilityRole="button"
        accessibilityLabel={`${label}, one day later`}
        style={[styles.nudgeButton, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  spacedTop: { marginTop: Spacing.two },
  nudger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  nudgerLabel: { flexGrow: 1 },
  nudgeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
  },
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
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  inviteCode: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  qrWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  qrCard: {
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  codeHint: {
    textAlign: 'center',
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
