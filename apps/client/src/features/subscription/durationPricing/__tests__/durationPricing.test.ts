import { describe, expect, it } from '@jest/globals';

import {
  DURATION_KEYS,
  durationPricingConfig,
} from '@/features/subscription/durationPricing/durationPricingConfig';
import {
  classifyCell,
  computeAllPrices,
  computeDurationPrice,
  groupFeatures,
  normalizeDiscount,
  roundTo,
} from '@/features/subscription/durationPricing/durationPricingHelpers';

describe('durationPricing helpers', () => {
  it('rounds to the nearest step', () => {
    expect(roundTo(1863001, 1000)).toBe(1863000);
    expect(roundTo(1499, 1000)).toBe(1000);
    expect(roundTo(1500, 1000)).toBe(2000);
    expect(roundTo(1863001, 1)).toBe(1863001);
  });

  it('clamps discount into 0–100', () => {
    expect(normalizeDiscount(-5)).toBe(0);
    expect(normalizeDiscount(150)).toBe(100);
    expect(normalizeDiscount(35)).toBe(35);
    expect(normalizeDiscount(Number.NaN)).toBe(0);
  });

  it('computes total, effective monthly and savings for a duration', () => {
    const base = 690_000;
    const oneMonth = computeDurationPrice(base, 1000, {
      key: 'm1',
      months: 1,
      label: 'یک‌ماهه',
      discountPercent: 0,
    });
    expect(oneMonth.total).toBe(690_000);
    expect(oneMonth.originalTotal).toBe(690_000);
    expect(oneMonth.hasDiscount).toBe(false);
    expect(oneMonth.savings).toBe(0);

    const year = computeDurationPrice(base, 1000, {
      key: 'm12',
      months: 12,
      label: 'دوازده‌ماهه',
      discountPercent: 35,
    });
    expect(year.originalTotal).toBe(8_280_000);
    expect(year.total).toBe(5_382_000);
    // total ÷ 12 = 448,500 → rounded to the nearest 1000 step.
    expect(year.monthlyEffective).toBe(449_000);
    expect(year.savings).toBe(2_898_000);
    expect(year.hasDiscount).toBe(true);
    // Longer commitment is cheaper per month than the single month.
    expect(year.monthlyEffective).toBeLessThan(oneMonth.monthlyEffective);
  });

  it('classifies cell values as check, cross, or text', () => {
    expect(classifyCell(true)).toEqual({ kind: 'included' });
    expect(classifyCell(false)).toEqual({ kind: 'excluded' });
    expect(classifyCell('۳ کاربر')).toEqual({ kind: 'text', text: '۳ کاربر' });
  });

  it('groups features by their group, preserving first-seen order', () => {
    const groups = groupFeatures(durationPricingConfig.features);
    expect(groups[0].group).toBe('امکانات اصلی');
    expect(groups.map((g) => g.group)).toContain('پشتیبانی');
    const totalRows = groups.reduce((sum, g) => sum + g.features.length, 0);
    expect(totalRows).toBe(durationPricingConfig.features.length);
  });
});

describe('durationPricing config integrity', () => {
  it('keeps the configured duration order when computing prices', () => {
    const prices = computeAllPrices(durationPricingConfig);
    expect(prices.map((p) => p.key)).toEqual(durationPricingConfig.durations.map((d) => d.key));
  });

  it('every feature row defines a value for every duration key', () => {
    for (const feature of durationPricingConfig.features) {
      for (const key of DURATION_KEYS) {
        expect(feature.values).toHaveProperty(key);
      }
    }
  });

  it('longer durations never cost more per month than shorter ones', () => {
    const prices = computeAllPrices(durationPricingConfig);
    for (let i = 1; i < prices.length; i += 1) {
      expect(prices[i].monthlyEffective).toBeLessThanOrEqual(prices[i - 1].monthlyEffective);
    }
  });
});
