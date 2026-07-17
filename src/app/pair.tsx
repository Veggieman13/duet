import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCycle } from '@/lib/store';

export default function PairScreen() {
  const { joinAsPartner } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinAsPartner(code);
      router.dismissAll();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Join your partner 💞</ThemedText>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Back
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText themeColor="textSecondary">
            Your partner creates an invite code in their Duet app under Settings → Partner
            sharing. Enter it here and you’ll see their cycle on this phone.
          </ThemedText>

          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={[
              styles.codeInput,
              { backgroundColor: theme.backgroundElement, color: theme.text },
            ]}
          />

          {error && (
            <ThemedText type="small" style={{ color: theme.period }}>
              {error}
            </ThemedText>
          )}

          <Pressable
            onPress={connect}
            disabled={busy || code.length < 6}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.tint },
              (pressed || busy || code.length < 6) && styles.dimmed,
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Connect
              </ThemedText>
            )}
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary">
            As a partner you can see, but never change, your partner’s data. Either of you can
            stop sharing at any time.
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
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  codeInput: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  dimmed: {
    opacity: 0.5,
  },
});
