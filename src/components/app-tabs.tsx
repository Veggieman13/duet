import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md={{ default: 'favorite', selected: 'favorite' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'calendar', selected: 'calendar' }}
          md={{ default: 'calendar_month', selected: 'calendar_month' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tips">
        <NativeTabs.Trigger.Label>Tips</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'lightbulb', selected: 'lightbulb.fill' }}
          md={{ default: 'lightbulb', selected: 'lightbulb' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md={{ default: 'settings', selected: 'settings' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
