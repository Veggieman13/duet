import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconOption } from '@/components/icon-option';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatKey } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { FLOW_LEVELS, FlowLevel, MOODS, SYMPTOMS } from '@/lib/types';

export default function LogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { logs, setDayLog } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  const existing = date ? logs[date] : undefined;
  const [flow, setFlow] = useState<FlowLevel | undefined>(existing?.flow);
  const [mood, setMood] = useState<string | undefined>(existing?.mood);
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [note, setNote] = useState(existing?.note ?? '');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    router.back();
    return null;
  }

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  };

  /** Opened via deep link there may be nothing to go back to. */
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const save = () => {
    setDayLog(date, { flow, mood, symptoms, note: note.trim() || undefined });
    close();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                {formatKey(date)}
              </ThemedText>
              <Pressable onPress={close} hitSlop={12}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </Pressable>
            </View>

            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold">Period flow</ThemedText>
              <View style={styles.grid}>
                <IconOption
                  label="None"
                  emoji="⚪"
                  selected={!flow}
                  onPress={() => setFlow(undefined)}
                />
                {FLOW_LEVELS.map(({ value, label, alpha }) => (
                  <IconOption
                    key={value}
                    label={label}
                    fill={`${theme.period}${alpha}`}
                    selected={flow === value}
                    onPress={() => setFlow(value)}
                  />
                ))}
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold">Mood</ThemedText>
              <View style={styles.grid}>
                {MOODS.map(({ value, label, emoji }) => (
                  <IconOption
                    key={value}
                    label={label}
                    emoji={emoji}
                    selected={mood === value}
                    onPress={() => setMood(mood === value ? undefined : value)}
                  />
                ))}
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold">Symptoms</ThemedText>
              <View style={styles.grid}>
                {SYMPTOMS.map(({ value, emoji }) => (
                  <IconOption
                    key={value}
                    label={value}
                    emoji={emoji}
                    selected={symptoms.includes(value)}
                    onPress={() => toggleSymptom(value)}
                  />
                ))}
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold">Note</ThemedText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Anything worth remembering about today…"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[styles.noteInput, { backgroundColor: theme.background, color: theme.text }]}
              />
            </ThemedView>

            <Pressable
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.tint },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Save
              </ThemedText>
            </Pressable>

            {existing && (
              <Pressable
                onPress={() => {
                  setDayLog(date, null);
                  close();
                }}
                style={styles.clearButton}>
                <ThemedText type="smallBold" style={{ color: theme.period }}>
                  Clear this day
                </ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
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
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 26,
    lineHeight: 34,
    flexShrink: 1,
  },
  section: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'flex-start',
  },
  noteInput: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    minHeight: 88,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
});
