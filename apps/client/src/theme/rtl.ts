/**
 * RTL-aware directional helpers.
 *
 * Pure functions (no React, no platform APIs) so they are trivial to unit-test and safe on
 * every platform. They translate logical direction intent into concrete style values.
 *
 * Prefer React Native's built-in logical properties (`marginStart`, `paddingEnd`, `start`,
 * `end`, `textAlign: 'left'|'right'` with `writingDirection`) where possible; use these
 * helpers when you need an explicit, direction-aware value (e.g. row direction, chevrons,
 * or a value that must flip).
 */
import type { Direction } from './tokens';

export function isRtl(direction: Direction): boolean {
  return direction === 'rtl';
}

/** Row layout direction that mirrors correctly under RTL. */
export function resolveRowDirection(direction: Direction): 'row' | 'row-reverse' {
  return direction === 'rtl' ? 'row-reverse' : 'row';
}

/** Returns the LTR value for LTR and the RTL value for RTL. */
export function directionalValue<T>(direction: Direction, ltrValue: T, rtlValue: T): T {
  return direction === 'rtl' ? rtlValue : ltrValue;
}

/** Text alignment that follows the reading direction's start edge. */
export function textAlignStart(direction: Direction): 'left' | 'right' {
  return directionalValue(direction, 'left', 'right');
}

/** Text alignment that follows the reading direction's end edge. */
export function textAlignEnd(direction: Direction): 'left' | 'right' {
  return directionalValue(direction, 'right', 'left');
}
