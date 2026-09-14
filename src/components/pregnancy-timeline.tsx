import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSwitch } from '@/components/language-switch';
import { LocalizedText } from '@/components/localized-text';
import { PlanItemRow } from '@/components/plan-item-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/lib/dates';
import { formatDate, isRTL, t, trimesterLabel } from '@/lib/i18n';
import {
  comparePlanItems,
  daysUntilDue,
  deriveState,
  formatGestation,
  getGestation,
  PlanItem,
  trimesterNoteKey,
} from '@/lib/pregnancy';
import { PLAN, SUPPLEMENTS } from '@/lib/pregnancy-plan';
import { usePregnancy } from '@/lib/pregnancy-store';

const TRIMESTERS: (1 | 2 | 3)[] = [1, 2, 3];

export function PregnancyTimeline() {
  const theme = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const { config, items } = usePregnancy();
  const today = todayKey();
  const rtl = isRTL(locale);

  const gestation = useMemo(() => getGestation(config.lmp, today), [config.lmp, today]);
  const toGo = daysUntilDue(config.edd, today);

  const byTrimester = useMemo(() => {
    const groups = new Map<1 | 2 | 3, PlanItem[]>();
    for (const trimester of TRIMESTERS) groups.set(trimester, []);
    for (const item of PLAN) groups.get(item.trimester)!.push(item);
    for (const list of groups.values()) list.sort(comparePlanItems);
    return groups;
  }, []);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            {/* The one number that should be readable at arm's length. */}
            <View style={[styles.header, rtl && styles.reverse]}>
              <View>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('week', locale)}
                </ThemedText>
                <ThemedText type="title">{formatGestation(gestation)}</ThemedText>
              </View>
              <View style={rtl ? styles.alignStart : styles.alignEnd}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('due', locale)}
                </ThemedText>
                <ThemedText type="smallBold">{formatDate(config.edd, locale)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {toGo >= 0
                    ? `${t('dueIn', locale)} ${toGo} ${t('days', locale)}`
                    : `${t('overdueBy', locale)} ${-toGo} ${t('days', locale)}`}
                </ThemedText>
              </View>
            </View>

            <LocalizedText
              text={t('planIntro', locale)}
              type="small"
              themeColor="textSecondary"
            />

            <LanguageSwitch />

            {TRIMESTERS.map((trimester) => (
              <View key={trimester} style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                  {trimesterLabel(trimester, locale).toUpperCase()}
                </ThemedText>
                {byTrimester.get(trimester)!.map((item) => (
                  <PlanItemRow
                    key={item.id}
                    item={item}
                    state={items[item.id]}
                    derived={deriveState(item, items[item.id], today)}
                    onPress={() =>
                      router.push({ pathname: '/plan/[item]', params: { item: item.id } })
                    }
                  />
                ))}
                <TrimesterNotes trimester={trimester} />
              </View>
            ))}

            {/* No window, never ticked off — deliberately outside the timeline. */}
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                {t('supplements', locale).toUpperCase()}
              </ThemedText>
              <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                {SUPPLEMENTS.map((supplement) => (
                  <View
                    key={supplement.id}
                    style={[styles.supplementRow, rtl && styles.reverse]}>
                    <LocalizedText text={supplement.label} type="small" style={styles.flex} />
                    <ThemedText type="small" themeColor="textSecondary">
                      {supplement.dose ?? (supplement.note ? supplement.note[locale] : '')}
                    </ThemedText>
                  </View>
                ))}
                <LocalizedText
                  text={t('unconfirmedDose', locale)}
                  type="small"
                  style={{ color: theme.attention }}
                />
              </View>
            </View>

            <LocalizedText
              text={t('disclaimer', locale)}
              type="small"
              themeColor="textSecondary"
              style={styles.disclaimer}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/**
 * One shared note per trimester, alongside the per-item ones. Last-write-wins,
 * no threading — it's two people, not a comment section.
 */
function TrimesterNotes({ trimester }: { trimester: 1 | 2 | 3 }) {
  const theme = useTheme();
  const locale = useLocale();
  const { notes, userId, setNote } = usePregnancy();
  const key = trimesterNoteKey(trimester);
  const note = notes[key];

  return (
    <View style={styles.section}>
      <TextInput
        value={note?.text ?? ''}
        onChangeText={(text) => setNote(key, text)}
        placeholder={t('trimesterNotes', locale)}
        placeholderTextColor={theme.textSecondary}
        multiline
        // A note typed in Hebrew has to read correctly inside a Dutch UI, so
        // the input follows the phone's keyboard, not the app language.
        style={[
          styles.noteInput,
          { backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
      />
      {note?.updatedAt ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('savedBy', locale)}{' '}
          {note.authorName ??
            (note.authorId === userId ? t('you', locale) : t('partner', locale))}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: BottomTabInset + Spacing.four },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: Spacing.three,
  },
  reverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  section: { gap: Spacing.two },
  sectionTitle: { letterSpacing: 1 },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  noteInput: {
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  disclaimer: {
    marginTop: Spacing.two,
    fontStyle: 'italic',
  },
});
