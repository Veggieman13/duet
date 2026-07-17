import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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

/** Accepts either a raw 6-char code or a duet://pair?code=XXXXXX link. */
function extractCode(data: string): string | null {
  const fromLink = /code=([A-Za-z2-9]{6})/.exec(data);
  if (fromLink) return fromLink[1].toUpperCase();
  const raw = data.trim().toUpperCase();
  return /^[A-Z2-9]{6}$/.test(raw) ? raw : null;
}

export default function PairScreen() {
  const { joinAsPartner } = useCycle();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Arriving via a scanned duet:// link pre-fills the code.
  useEffect(() => {
    if (typeof params.code === 'string') {
      const extracted = extractCode(params.code);
      if (extracted) setCode(extracted);
    }
  }, [params.code]);

  const connect = async (theCode: string) => {
    setBusy(true);
    setError(null);
    try {
      await joinAsPartner(theCode);
      router.dismissAll();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const startScan = async () => {
    setError(null);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError('Camera access was declined — you can type the code instead.');
        return;
      }
    }
    setScanning(true);
  };

  const onScanned = (data: string) => {
    const extracted = extractCode(data);
    if (extracted && !busy) {
      setScanning(false);
      setCode(extracted);
      connect(extracted);
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
            Ask your partner to open Duet and go to Settings → Partner sharing. Then point your
            camera at their QR code.
          </ThemedText>

          {scanning ? (
            <View style={styles.scannerWrap}>
              <CameraView
                style={styles.scanner}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => onScanned(data)}
              />
              <Pressable onPress={() => setScanning(false)} style={styles.linkButton}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Stop scanning
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            Platform.OS !== 'web' && (
              <Pressable
                onPress={startScan}
                disabled={busy}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.tint },
                  (pressed || busy) && styles.dimmed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  📷 Scan QR code
                </ThemedText>
              </Pressable>
            )
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.orText}>
            — or type the 6-character code —
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
            onPress={() => connect(code)}
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
  scannerWrap: {
    gap: Spacing.one,
  },
  scanner: {
    height: 280,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  orText: {
    textAlign: 'center',
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
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  dimmed: {
    opacity: 0.5,
  },
});
