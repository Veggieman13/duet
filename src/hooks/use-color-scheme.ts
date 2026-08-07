import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useCycleOptional } from '@/lib/store';

/**
 * The scheme the app should render in: the user's own preference when they
 * have set one, otherwise whatever the phone is using.
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const preference = useCycleOptional()?.settings.theme ?? 'system';

  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
