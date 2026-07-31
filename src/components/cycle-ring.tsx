import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { DayMarker } from '@/lib/cycle';
import { dateToKey, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  year: number;
  /** 0-based month. */
  month: number;
  markers?: Record<string, DayMarker>;
  size: number;
  /** Date key of the highlighted day, if any. */
  selected?: string;
  onDayPress?: (key: string) => void;
  /** Rendered in the middle of the ring. */
  children?: ReactNode;
}

/**
 * The month's days arranged around a circle, coloured by cycle markers.
 * Day 1 sits at the top and the month runs clockwise.
 */
export function CycleRing({
  year,
  month,
  markers = {},
  size,
  selected,
  onDayPress,
  children,
}: Props) {
  const theme = useTheme();
  const today = todayKey();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const center = size / 2;
  const dotRadius = size * 0.052;
  const ringRadius = center - dotRadius - size * 0.02;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Faint track the day dots sit on. */}
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          stroke={theme.backgroundElement}
          strokeWidth={size * 0.085}
          fill="none"
        />

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = dateToKey(new Date(year, month, day));
          const marker = markers[key];
          const isToday = key === today;
          const isSelected = key === selected;

          const angle = (i / daysInMonth) * 2 * Math.PI - Math.PI / 2;
          const cx = center + ringRadius * Math.cos(angle);
          const cy = center + ringRadius * Math.sin(angle);

          let fill = 'transparent';
          let color: string = theme.textSecondary;
          if (marker === 'period') {
            fill = theme.period;
            color = theme.onAccent;
          } else if (marker === 'predicted') {
            fill = theme.periodSoft;
            color = theme.period;
          } else if (marker === 'ovulation') {
            fill = theme.fertile;
            color = theme.onAccent;
          } else if (marker === 'fertile') {
            fill = theme.fertileSoft;
            color = theme.fertile;
          }

          const stroke = isSelected ? theme.text : isToday ? theme.tint : 'transparent';

          return (
            <G key={day} onPress={onDayPress ? () => onDayPress(key) : undefined}>
              {/* Halo makes the selected day obvious against any fill. */}
              {isSelected && (
                <Circle cx={cx} cy={cy} r={dotRadius * 1.42} fill={theme.backgroundSelected} />
              )}
              <Circle
                cx={cx}
                cy={cy}
                r={dotRadius}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 3 : isToday ? 2.5 : 0}
              />
              <SvgText
                x={cx}
                y={cy + dotRadius * 0.35}
                fontSize={dotRadius * 0.95}
                fontWeight={isToday || isSelected ? '700' : '500'}
                fill={(isToday || isSelected) && !marker ? theme.text : color}
                textAnchor="middle">
                {day}
              </SvgText>
              {/* Transparent, finger-sized hit area on top. */}
              <Circle cx={cx} cy={cy} r={dotRadius * 1.45} fill="transparent" />
            </G>
          );
        })}
      </Svg>

      <View style={styles.center} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '22%',
  },
});
