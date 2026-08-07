import { useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useCycleOptional } from '@/lib/store';

/**
 * Same as the native version, but static rendering means the system scheme is
 * only trustworthy after hydration.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => setHasHydrated(true), []);

  const system = useSystemColorScheme();
  const preference = useCycleOptional()?.settings.theme ?? 'system';

  if (preference === 'light' || preference === 'dark') return preference;
  if (!hasHydrated) return 'light';
  return system === 'dark' ? 'dark' : 'light';
}
