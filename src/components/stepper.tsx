import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, unit = 'days', min, max, onChange }: Props) {
  const theme = useTheme();

  const button = (delta: number, symbol: string) => {
    const disabled = delta < 0 ? value <= min : value >= max;
    return (
      <Pressable
        disabled={disabled}
        onPress={() => onChange(value + delta)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundSelected },
          (pressed || disabled) && styles.dimmed,
        ]}>
        <ThemedText type="subtitle" style={styles.buttonText}>
          {symbol}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.controls}>
        {button(-1, '−')}
        <ThemedText type="smallBold" style={styles.value}>
          {value} {unit}
        </ThemedText>
        {button(1, '+')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    flexShrink: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 22,
    lineHeight: 26,
  },
  value: {
    minWidth: 72,
    textAlign: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
});
