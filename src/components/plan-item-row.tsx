import { Pressable, StyleSheet, View } from 'react-native';

import { LocalizedText } from '@/components/localized-text';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatWindow, isRTL, t } from '@/lib/i18n';
import {
  DerivedState,
  INVASIVENESS_LABELS,
  ItemState,
  PlanItem,
} from '@/lib/pregnancy';

interface Props {
  item: PlanItem;
  state: ItemState | undefined;
  derived: DerivedState;
  onPress: () => void;
}

export function PlanItemRow({ item, state, derived, onPress }: Props) {
  const theme = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);

  // Only `closing` and `overdue` are allowed to draw the eye. Everything else
  // stays quiet — this is a reference sheet, not a nagging app.
  const badge =
    derived === 'overdue'
      ? { label: t('stateOverdue', locale), fg: theme.period, bg: theme.periodSoft }
      : derived === 'closing'
        ? { label: t('stateClosing', locale), fg: theme.attention, bg: theme.attentionSoft }
        : derived === 'done'
          ? { label: t('stateDone', locale), fg: theme.fertile, bg: theme.fertileSoft }
          : null;

  const needle = item.invasiveness !== 'none';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          // Optional items are categorically different, not just fainter.
          borderStyle: item.optional ? 'dashed' : 'solid',
          borderColor: item.optional ? theme.textSecondary : 'transparent',
        },
        item.struckOut && styles.struckOut,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.head, rtl && styles.rowReverse]}>
        <LocalizedText
          text={item.label}
          type="smallBold"
          style={[styles.label, item.struckOut && styles.strike]}
        />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <ThemedText type="small" style={[styles.badgeText, { color: badge.fg }]}>
              {badge.label}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.meta, rtl && styles.rowReverse]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.week}>
          {t('week', locale)} {item.weekLabel}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatWindow(item.windowStart, item.windowEnd, locale)}
        </ThemedText>
      </View>

      <View style={[styles.tags, rtl && styles.rowReverse]}>
        {/* The thing someone scans for when they're nervous — present without
            being the loudest element on the screen. */}
        {needle ? (
          <View style={[styles.tag, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    item.invasiveness === 'invasive' ? theme.period : theme.textSecondary,
                },
              ]}
            />
            <LocalizedText
              text={INVASIVENESS_LABELS[item.invasiveness]}
              type="small"
              themeColor="textSecondary"
            />
          </View>
        ) : null}

        {item.struckOut ? (
          <Tag label={t('notPlanned', locale)} color={theme.textSecondary} bg={theme.background} />
        ) : item.optional ? (
          <Tag label={t('optional', locale)} color={theme.textSecondary} bg={theme.background} />
        ) : null}

        {item.unconfirmed ? (
          <Tag label={t('unconfirmed', locale)} color={theme.attention} bg={theme.attentionSoft} />
        ) : null}

        {state?.status === 'scheduled' && state.scheduledDate ? (
          <Tag
            label={formatDate(state.scheduledDate, locale)}
            color={theme.tint}
            bg={theme.tintSoft}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pressed: { opacity: 0.7 },
  struckOut: { opacity: 0.55 },
  strike: { textDecorationLine: 'line-through' },
  rowReverse: { flexDirection: 'row-reverse' },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: { flex: 1 },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  badgeText: { fontWeight: '700' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  week: { fontWeight: '700' },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
