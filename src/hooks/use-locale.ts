import { Locale } from '@/lib/i18n';
import { useCycleOptional } from '@/lib/store';

/**
 * The language the pregnancy module renders in. Per-device, never synced —
 * the two of you read the same data side by side in different languages.
 */
export function useLocale(): Locale {
  return useCycleOptional()?.settings.locale ?? 'en';
}
