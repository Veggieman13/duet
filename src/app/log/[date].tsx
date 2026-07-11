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

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatKey } from '@/lib/dates';
import { useCycle } from '@/lib/store';
import { FLOW_LEVELS, FlowLevel, SYMPTOMS } from '@/lib/types';

export default function LogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { logs, setDayLog } = useCycle();
  const theme = useTheme();
  const router = useRouter();

  const existing = date ? logs[date] : undefined;
  const [flow, setFlow] = useState<FlowLevel | undefined>(existing?.flow);
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

  const save = () => {
    setDayLog(date, { flow, symptoms, note: note.trim() || undefined });
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="subtitle">{formatKey(date)}</ThemedText>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <ThemedText type="smallBold">Period flow</ThemedText>
              <View style={styles.chipRow}>
                <Chip label="None" selected={!flow} onPress={() => setFlow(undefined)} />
                {FLOW_LEVELS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    label={label}
                    selected={flow === value}
                    onPress={() => setFlow(value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="smallBold">Symptoms</ThemedText>
              <View style={styles.chipRow}>
                {SYMPTOMS.map((symptom) => (
                  <Chip
                    key={symptom}
                    label={symptom}
                    selected={symptoms.includes(symptom)}
                    onPress={() => toggleSymptom(symptom)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="smallBold">Note</ThemedText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Anything worth remembering about today…"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[
                  styles.noteInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
              />
            </View>

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
                  router.back();
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
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  noteInput: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    minHeight: 88,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: Spacing.three,
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
