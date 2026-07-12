/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#43242E',
    background: '#FFF8F6',
    backgroundElement: '#FCEBEC',
    backgroundSelected: '#F6D9DE',
    textSecondary: '#96707D',
    tint: '#E9558E',
    tintSoft: '#FFE5EF',
    period: '#E5484D',
    periodSoft: '#FFE4E6',
    fertile: '#26A08F',
    fertileSoft: '#DFF3EE',
    onAccent: '#ffffff',
  },
  dark: {
    text: '#F7E9ED',
    background: '#211519',
    backgroundElement: '#33232A',
    backgroundSelected: '#443039',
    textSecondary: '#C99EAC',
    tint: '#F76D9C',
    tintSoft: '#48242F',
    period: '#EC5D5E',
    periodSoft: '#472226',
    fertile: '#35C4AC',
    fertileSoft: '#1B3A34',
    onAccent: '#ffffff',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
