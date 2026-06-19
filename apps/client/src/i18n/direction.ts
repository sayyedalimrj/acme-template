/**
 * Locale → layout direction mapping.
 *
 * Direction is derived from the active language (Persian is RTL, everything else is LTR) so the
 * UI never needs a manual direction control. Pure, dependency-free, and safe on all platforms.
 */
import type { Direction } from '@/theme/tokens';

import type { Locale } from './strings';

/** Locales that render right-to-left. */
const RTL_LOCALES: ReadonlySet<string> = new Set(['fa', 'ar', 'he', 'ur']);

/** Resolve the layout direction for a locale (Persian → RTL, others → LTR). */
export function directionForLocale(locale: Locale | string): Direction {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}
