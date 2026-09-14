import { StyleSheet, type TextStyle } from 'react-native';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { useLocale } from '@/hooks/use-locale';
import { isolateLatin, isRTL, type Locale, type Localized } from '@/lib/i18n';

/**
 * Text in the current pregnancy-module language, with the bidi handling the
 * clinical Hebrew needs.
 *
 * Two things happen here that plain <ThemedText> doesn't do:
 *
 * 1. Latin and numeric runs get wrapped in Unicode isolates. React Native has
 *    no <bdi> element and no `unicode-bidi: isolate`, so U+2068/U+2069 do the
 *    job instead. Without it "PAPP-A ו-β-hCG" and "כ-1 ל-500" reorder on
 *    screen.
 * 2. writingDirection is set explicitly, and alignment with it. React Native's
 *    textAlign has no 'start'/'end' — only auto/left/right/center/justify — so
 *    the logical value the web brief asks for is resolved here instead.
 *
 * Layout itself stays LTR by design (see AGENTS.md): mirroring needs
 * I18nManager and an app reload, and the language switch has to be instant.
 */

type Props = Omit<ThemedTextProps, 'children'> & {
  /** A three-language string from the plan, or an already-picked string. */
  text: Localized | string;
  /** Override the ambient locale, e.g. to show a language's own name. */
  locale?: Locale;
  /** User-typed text: direction is detected per string, not per UI language. */
  userGenerated?: boolean;
};

/** The RN stand-in for dir="auto": first strong character wins. */
function detectDirection(text: string): 'ltr' | 'rtl' {
  const strong = text.match(/[\p{Script=Hebrew}\p{Script=Arabic}]|[A-Za-zÀ-ɏ]/u);
  if (!strong) return 'ltr';
  return /[\p{Script=Hebrew}\p{Script=Arabic}]/u.test(strong[0]) ? 'rtl' : 'ltr';
}

export function LocalizedText({ text, locale, userGenerated, style, ...rest }: Props) {
  const ambient = useLocale();
  const active = locale ?? ambient;
  const raw = typeof text === 'string' ? text : text[active];

  // A note typed in Hebrew must read correctly inside a Dutch UI, so
  // user-generated text is measured on its own content.
  const direction = userGenerated ? detectDirection(raw) : isRTL(active) ? 'rtl' : 'ltr';
  const rtl = direction === 'rtl';

  const directionStyle: TextStyle = {
    writingDirection: direction,
    textAlign: rtl ? 'right' : 'left',
  };

  return (
    <ThemedText style={[directionStyle, style]} {...rest}>
      {rtl ? isolateLatin(raw, 'he') : raw}
    </ThemedText>
  );
}

/** Row direction for a line of text plus its trailing meta, in RTL order. */
export function rowDirection(locale: Locale) {
  return isRTL(locale) ? styles.rowReverse : styles.row;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rowReverse: { flexDirection: 'row-reverse' },
});
