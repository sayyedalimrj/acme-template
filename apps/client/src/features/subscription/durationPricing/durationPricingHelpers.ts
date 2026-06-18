/**
 * Pure helpers for the duration-based pricing table. React-free so they are trivial to unit
 * test. They turn one base monthly price + per-duration discount percentages into the
 * display numbers (total for the period, effective monthly, savings). No formatting and no
 * hooks here — the component formats with the active locale.
 *
 * SECURITY: math over display-only numbers; nothing here is a real charge or touches payment.
 */
import type {
  CellValue,
  DurationKey,
  DurationPlan,
  DurationPricingConfig,
  FeatureRow,
} from './durationPricingConfig';

/** Display numbers for one duration column (all in Toman, already rounded). */
export interface ComputedDurationPrice {
  key: DurationKey;
  months: number;
  discountPercent: number;
  /** Undiscounted total for the whole period (basePriceMonthly × months). */
  originalTotal: number;
  /** Discounted total actually paid for the whole period. */
  total: number;
  /** Effective price per month after the discount (total ÷ months). */
  monthlyEffective: number;
  /** Money saved over the period versus paying month-by-month. */
  savings: number;
  /** Whether a discount applies (controls the strikethrough / badge). */
  hasDiscount: boolean;
}

/** Round to the nearest `step` (e.g. nearest 1000 Toman). `step <= 1` rounds to integer. */
export function roundTo(value: number, step: number): number {
  if (!Number.isFinite(value)) return 0;
  if (step <= 1) return Math.round(value);
  return Math.round(value / step) * step;
}

/** Clamp a discount into the sane 0–100 range. */
export function normalizeDiscount(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

/** Compute the display prices for a single duration column. */
export function computeDurationPrice(
  baseMonthly: number,
  step: number,
  duration: DurationPlan,
): ComputedDurationPrice {
  const discountPercent = normalizeDiscount(duration.discountPercent);
  const originalTotal = roundTo(baseMonthly * duration.months, step);
  const total = roundTo(baseMonthly * duration.months * (1 - discountPercent / 100), step);
  const monthlyEffective = roundTo(total / duration.months, step);
  return {
    key: duration.key,
    months: duration.months,
    discountPercent,
    originalTotal,
    total,
    monthlyEffective,
    savings: Math.max(0, originalTotal - total),
    hasDiscount: discountPercent > 0,
  };
}

/** Compute prices for every duration in the config, keeping the configured order. */
export function computeAllPrices(config: DurationPricingConfig): ComputedDurationPrice[] {
  return config.durations.map((d) =>
    computeDurationPrice(config.basePriceMonthly, config.priceRoundingStep, d),
  );
}

/** How a single cell should render. */
export type CellKind = 'included' | 'excluded' | 'text';

/** Classify a raw cell value into a render kind (+ text when it is a label). */
export function classifyCell(value: CellValue): { kind: CellKind; text?: string } {
  if (value === true) return { kind: 'included' };
  if (value === false) return { kind: 'excluded' };
  return { kind: 'text', text: value };
}

/** Ordered list of group names as they first appear in the feature rows. */
export function featureGroupOrder(features: FeatureRow[]): string[] {
  const seen: string[] = [];
  for (const f of features) {
    const group = f.group ?? '';
    if (!seen.includes(group)) seen.push(group);
  }
  return seen;
}

/** Features grouped by `group`, preserving first-seen order. */
export function groupFeatures(
  features: FeatureRow[],
): { group: string; features: FeatureRow[] }[] {
  return featureGroupOrder(features).map((group) => ({
    group,
    features: features.filter((f) => (f.group ?? '') === group),
  }));
}
