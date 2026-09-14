import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LOCALE_NAMES, LOCALES } from '@/lib/i18n';
import { useCycle } from '@/lib/store';

/**
 * Persistent control rather than something buried in settings: the two of you
 * sit next to each other reading the same synced data in different languages,
 * so this gets used often.
 *
 * Switching is instant and keeps scroll position — which is why layout does
 * not mirror for Hebrew. Mirroring needs I18nManager.forceRTL and an app
 * reload; see the note in lib/i18n.ts.
 */
export function LanguageSwitch() {
  const theme = useTheme();
  const { settings, updateSettings } = useCycle();

  return (
    <View style={[styles.group, { backgroundColor: theme.backgroundElement }]}>
      {LOCALES.map((locale) => {
        const active = settings.locale === locale;
        return (
          <Pressable
            key={locale}
            onPress={() => updateSettings({ locale })}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.option,
              active && { backgroundColor: theme.tint },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type="small"
              style={active ? { color: theme.onAccent } : { color: theme.textSecondary }}>
              {LOCALE_NAMES[locale]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: Spacing.half,
    gap: Spacing.half,
    alignSelf: 'flex-start',
  },
  option: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  pressed: { opacity: 0.7 },
});
