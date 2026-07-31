import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  label: string;
  /** Emoji shown inside the circle. Omit when using `fill` instead. */
  emoji?: string;
  /** Solid colour for the circle (used by flow levels instead of an emoji). */
  fill?: string;
  selected?: boolean;
  onPress?: () => void;
}

/** A round, tappable icon with a caption — the building block of the log screen. */
export function IconOption({ label, emoji, fill, selected = false, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View
        style={[
          styles.circle,
          {
            backgroundColor: fill ?? theme.backgroundElement,
            borderColor: selected ? theme.tint : 'transparent',
          },
        ]}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      </View>
      <ThemedText
        type="small"
        themeColor={selected ? 'text' : 'textSecondary'}
        numberOfLines={2}
        style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Sized so four fit per row on a small phone.
    width: 64,
    alignItems: 'center',
    gap: Spacing.one,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.6,
  },
});
