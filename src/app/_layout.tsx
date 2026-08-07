import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CycleProvider } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

/** Inside the provider, so it can follow the user's theme preference. */
function ThemedStack() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="pair" options={{ presentation: 'modal' }} />
        <Stack.Screen name="log/[date]" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CycleProvider>
      <ThemedStack />
    </CycleProvider>
  );
}
