import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalizedText } from '@/components/localized-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { addDays, diffDays, todayKey } from '@/lib/dates';
import { formatDate, formatWindow, isRTL, t } from '@/lib/i18n';
import {
  deriveState,
  INVASIVENESS_LABELS,
  ItemState,
  ItemStatus,
} from '@/lib/pregnancy';
import { findItem } from '@/lib/pregnancy-plan';
import { usePregnancy } from '@/lib/pregnancy-store';
import { useCycle } from '@/lib/store';

/** How long an undo stays available. No confirmation dialogs anywhere. */
const UNDO_MS = 10_000;
/** Cap on the date strip for open-ended or very long windows. */
const MAX_DATE_OPTIONS = 120;

export default function PlanItemScreen() {
  const { item: itemId } = useLocalSearchParams<{ item: string }>();
  const router = useRouter();
  const theme = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const { settings } = useCycle();
  const { items, notes, userId, setItemState, setNote } = usePregnancy();

  const item = findItem(itemId);
  const state = item ? items[item.id] : undefined;
  const today = todayKey();

  const [showMethod, setShowMethod] = useState(false);
  const [undo, setUndo] = useState<ItemState | null | undefined>(undefined);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateOptions = useMemo(() => {
    if (!item) return [];
    const start = item.windowStart ?? today;
    const end = item.windowEnd ?? addDays(start, MAX_DATE_OPTIONS);
    const span = Math.min(diffDays(start, end), MAX_DATE_OPTIONS);
    return Array.from({ length: Math.max(span + 1, 1) }, (_, i) => addDays(start, i));
  }, [item, today]);

  if (!item) {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.centred}>
          <ThemedText>{t('noPlan', locale)}</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const derived = deriveState(item, state, today);
  const note = notes[item.id];

  /** Every status change is undoable for ten seconds — never confirmed first. */
  function apply(next: Omit<ItemState, 'updatedAt'> | null) {
    setUndo(state ?? null);
    setItemState(item!.id, next);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(undefined), UNDO_MS);
  }

  function revert() {
    if (undo === undefined) return;
    setItemState(item!.id, undo ? { ...undo } : null);
    setUndo(undefined);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  function setStatus(status: ItemStatus) {
    if (status === 'none') return apply(null);
    if (status === 'done') return apply({ ...state, status: 'done' });
    apply({ ...state, status: 'scheduled', scheduledDate: state?.scheduledDate ?? today });
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <Pressable onPress={() => router.back()} style={styles.close}>
              <ThemedText type="link" themeColor="tint">
                ✕
              </ThemedText>
            </Pressable>

            <LocalizedText text={item.label} type="subtitle" />

            <View style={[styles.metaRow, rtl && styles.reverse]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('week', locale)} {item.weekLabel}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatWindow(item.windowStart, item.windowEnd, locale)}
              </ThemedText>
            </View>

            <View style={[styles.tagRow, rtl && styles.reverse]}>
              <View style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
                <LocalizedText
                  text={INVASIVENESS_LABELS[item.invasiveness]}
                  type="small"
                  style={{
                    color: item.invasiveness === 'invasive' ? theme.period : theme.textSecondary,
                  }}
                />
              </View>
              {item.optional ? (
                <View style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('optional', locale)}
                  </ThemedText>
                </View>
              ) : null}
              {item.unconfirmed ? (
                <View style={[styles.tag, { backgroundColor: theme.attentionSoft }]}>
                  <ThemedText type="small" style={{ color: theme.attention }}>
                    {t('unconfirmed', locale)}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <Section title={t('whatFor', locale)}>
              <LocalizedText text={item.explain} />
            </Section>

            {/* Reference material for the day before an appointment, not
                something to wade through every time the list loads. */}
            <Pressable
              onPress={() => setShowMethod((v) => !v)}
              style={[styles.disclosure, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">
                {showMethod ? '−' : '+'}  {t('whatHappens', locale)}
              </ThemedText>
            </Pressable>
            {showMethod ? <LocalizedText text={item.method} /> : null}

            {!item.struckOut ? (
              <>
                <Section title={t('status', locale)}>
                  <View style={[styles.statusRow, rtl && styles.reverse]}>
                    <StatusButton
                      label={t('statusNone', locale)}
                      active={!state || state.status === 'none'}
                      onPress={() => setStatus('none')}
                    />
                    <StatusButton
                      label={t('statusScheduled', locale)}
                      active={state?.status === 'scheduled'}
                      onPress={() => setStatus('scheduled')}
                    />
                    <StatusButton
                      label={t('statusDone', locale)}
                      active={state?.status === 'done'}
                      onPress={() => setStatus('done')}
                    />
                  </View>
                </Section>

                {state?.status === 'scheduled' ? (
                  <>
                    <Section title={t('schedule', locale)}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.dateStrip}>
                          {dateOptions.map((date) => (
                            <Pressable
                              key={date}
                              onPress={() =>
                                apply({ ...state, status: 'scheduled', scheduledDate: date })
                              }
                              style={[
                                styles.dateChip,
                                {
                                  backgroundColor:
                                    state.scheduledDate === date
                                      ? theme.tint
                                      : theme.backgroundElement,
                                },
                              ]}>
                              <ThemedText
                                type="small"
                                style={{
                                  color:
                                    state.scheduledDate === date ? theme.onAccent : theme.text,
                                }}>
                                {formatDate(date, locale)}
                              </ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </Section>

                    <Section title={t('place', locale)}>
                      <TextInput
                        value={state.place ?? ''}
                        onChangeText={(place) => setItemState(item.id, { ...state, place })}
                        placeholder={t('placeHint', locale)}
                        placeholderTextColor={theme.textSecondary}
                        style={[
                          styles.input,
                          { backgroundColor: theme.backgroundElement, color: theme.text },
                        ]}
                      />
                    </Section>
                  </>
                ) : null}
              </>
            ) : null}

            <Section title={t('notes', locale)}>
              <TextInput
                value={note?.text ?? ''}
                onChangeText={(text) => setNote(item.id, text)}
                placeholder={t('addNote', locale)}
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[
                  styles.input,
                  styles.noteInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
              />
              {note?.updatedAt ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('savedBy', locale)}{' '}
                  {note.authorName ??
                    (note.authorId === userId ? t('you', locale) : t('partner', locale))}
                  {' · '}
                  {formatDate(note.updatedAt.slice(0, 10), locale)}
                </ThemedText>
              ) : null}
            </Section>

            <ThemedText type="small" themeColor="textSecondary" style={styles.derived}>
              {t(
                derived === 'overdue'
                  ? 'stateOverdue'
                  : derived === 'closing'
                    ? 'stateClosing'
                    : derived === 'done'
                      ? 'stateDone'
                      : derived === 'upcoming'
                        ? 'stateUpcoming'
                        : 'stateOpen',
                locale,
              )}
            </ThemedText>
          </View>
        </ScrollView>

        {undo !== undefined ? (
          <View style={[styles.toast, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small">{t('undone', locale)}</ThemedText>
            <Pressable onPress={revert}>
              <ThemedText type="smallBold" themeColor="tint">
                {t('undo', locale)}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

function StatusButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.statusButton,
        { backgroundColor: active ? theme.tint : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" style={{ color: active ? theme.onAccent : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: Spacing.six },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  close: { alignSelf: 'flex-end', padding: Spacing.two },
  metaRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  tagRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  reverse: { flexDirection: 'row-reverse' },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  section: { gap: Spacing.two },
  sectionTitle: { letterSpacing: 1 },
  disclosure: {
    padding: Spacing.three,
    borderRadius: 12,
  },
  statusRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  statusButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  pressed: { opacity: 0.7 },
  dateStrip: { flexDirection: 'row', gap: Spacing.two },
  dateChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  input: {
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
  },
  noteInput: { minHeight: 96, textAlignVertical: 'top' },
  derived: { fontStyle: 'italic' },
  toast: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 12,
  },
});
