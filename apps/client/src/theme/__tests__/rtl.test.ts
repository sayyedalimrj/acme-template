import { describe, expect, it } from '@jest/globals';
import {
  directionalValue,
  isRtl,
  resolveRowDirection,
  textAlignEnd,
  textAlignStart,
} from '@/theme/rtl';

describe('rtl directional helpers', () => {
  it('isRtl reflects the direction', () => {
    expect(isRtl('rtl')).toBe(true);
    expect(isRtl('ltr')).toBe(false);
  });

  it('resolveRowDirection flips for RTL', () => {
    expect(resolveRowDirection('ltr')).toBe('row');
    expect(resolveRowDirection('rtl')).toBe('row-reverse');
  });

  it('directionalValue returns the correct value per direction', () => {
    expect(directionalValue('ltr', 'A', 'B')).toBe('A');
    expect(directionalValue('rtl', 'A', 'B')).toBe('B');
    // Works with non-string values too.
    expect(directionalValue('rtl', 0, 8)).toBe(8);
  });

  it('textAlignStart / textAlignEnd map to the correct edges', () => {
    expect(textAlignStart('ltr')).toBe('left');
    expect(textAlignStart('rtl')).toBe('right');
    expect(textAlignEnd('ltr')).toBe('right');
    expect(textAlignEnd('rtl')).toBe('left');
  });
});
