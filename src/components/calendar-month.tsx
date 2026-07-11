import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { DayMarker } from '@/lib/cycle';
import { dateToKey, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  year: number;
  /** 0-based month. */
  month: number;
  markers?: Record<string, DayMarker>;
  /** Days that have symptoms or notes logged (shown with a small dot). */
  loggedDays?: Set<string>;
  selected?: string;
  onDayPress?: (key: string) => void;
  /** When true (default), days after today cannot be pressed. */
  disableFuture?: boolean;
}

export function CalendarMonth({
  year,
  month,
  markers = {},
  loggedDays,
  selected,
  onDayPress,
  disableFuture = true,
}: Props) {
  const theme = useTheme();
  const today = todayKey();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateToKey(new Date(year, month, i + 1))),
  ];

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAYS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <ThemedText type="small" themeColor="textSecondary">
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
        <View key={week} style={styles.row}>
          {Array.from({ length: 7 }, (_, weekday) => {
            const key = cells[week * 7 + weekday] ?? null;
            if (!key) return <View key={weekday} style={styles.cell} />;

            const marker = markers[key];
            const isToday = key === today;
            const isSelected = key === selected;
            const isFuture = key > today;
            const disabled = !onDayPress || (disableFuture && isFuture);

            let background: string | undefined;
            let color: string = theme.text;
            if (marker === 'period') {
              background = theme.period;
              color = theme.onAccent;
            } else if (marker === 'predicted') {
              background = theme.periodSoft;
              color = theme.period;
            } else if (marker === 'ovulation') {
              background = theme.fertile;
              color = theme.onAccent;
            } else if (marker === 'fertile') {
              background = theme.fertileSoft;
              color = theme.fertile;
            }

            return (
              <Pressable
                key={weekday}
                style={styles.cell}
                disabled={disabled}
                onPress={() => onDayPress?.(key)}>
                <View
                  style={[
                    styles.day,
                    background != null && { backgroundColor: background },
                    isToday && { borderWidth: 2, borderColor: theme.tint },
                    isSelected && { borderWidth: 2, borderColor: theme.text },
                  ]}>
                  <ThemedText type="small" style={{ color, opacity: isFuture ? 0.75 : 1 }}>
                    {Number(key.slice(8))}
                  </ThemedText>
                  {loggedDays?.has(key) && (
                    <View style={[styles.dot, { backgroundColor: color }]} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
