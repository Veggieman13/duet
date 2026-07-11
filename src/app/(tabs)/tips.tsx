import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCycle } from '@/lib/store';
import { DISCLAIMER, TIP_SECTIONS } from '@/lib/tips';

export default function TipsScreen() {
  const { info } = useCycle();
  const theme = useTheme();

  // Show the current phase first.
  const sections = [...TIP_SECTIONS].sort((a, b) =>
    a.phase === info.phase ? -1 : b.phase === info.phase ? 1 : 0,
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Tips</ThemedText>

          {sections.map((section) => {
            const isCurrent = section.phase === info.phase;
            return (
              <ThemedView
                key={section.phase}
                type="backgroundElement"
                style={[styles.card, isCurrent && { borderWidth: 2, borderColor: theme.tint }]}>
                <View style={styles.cardHeader}>
                  <ThemedText type="smallBold">
                    {section.emoji} {section.title}
                  </ThemedText>
                  {isCurrent && (
                    <View style={[styles.badge, { backgroundColor: theme.tint }]}>
                      <ThemedText type="small" style={{ color: theme.onAccent }}>
                        You are here
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {section.blurb}
                </ThemedText>
                {section.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      •
                    </ThemedText>
                    <ThemedText type="small" style={styles.tipText}>
                      {tip}
                    </ThemedText>
                  </View>
                ))}
              </ThemedView>
            );
          })}

          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            {DISCLAIMER}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tipText: {
    flex: 1,
  },
  disclaimer: {
    opacity: 0.8,
  },
});
