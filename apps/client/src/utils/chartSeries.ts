/**
 * Chart series helpers — downsample daily API rows for readable home overview charts.
 */
import type { OverviewPoint } from '@/features/mobile/components';

export interface ChartRow {
  label: string;
  value: number;
}

function bucketSum(rows: ChartRow[], bucketSize: number): ChartRow[] {
  if (rows.length === 0) return [];
  const out: ChartRow[] = [];
  for (let i = 0; i < rows.length; i += bucketSize) {
    const slice = rows.slice(i, i + bucketSize);
    const value = slice.reduce((sum, row) => sum + row.value, 0);
    const label = slice.length === 1 ? slice[0]!.label : slice[slice.length - 1]!.label;
    out.push({ label, value });
  }
  return out;
}

/** Reduce crowded daily points for week / month / year views. */
export function downsampleChartRows(
  rows: ChartRow[],
  rangeKey: '7d' | '30d' | '365d',
): ChartRow[] {
  if (rows.length <= 1) return rows;

  if (rangeKey === '365d') {
    return bucketSum(rows, Math.max(1, Math.ceil(rows.length / 12)));
  }
  if (rangeKey === '30d') {
    return bucketSum(rows, Math.max(1, Math.ceil(rows.length / 4)));
  }
  return rows;
}

export function toOverviewPoints(rows: ChartRow[]): OverviewPoint[] {
  return rows.map((row, index) => ({
    label: row.label,
    value: row.value,
    highlight: index === rows.length - 1,
  }));
}

/** No points or every bucket is zero. */
export function isEmptySeries(rows: ChartRow[]): boolean {
  if (rows.length === 0) return true;
  return rows.every((r) => !Number.isFinite(r.value) || r.value <= 0);
}

/** Same value on every day — still may have a meaningful range total. */
export function isUniformSeries(rows: ChartRow[]): boolean {
  if (rows.length <= 1) return false;
  const max = Math.max(...rows.map((r) => r.value));
  if (max <= 0) return false;
  const min = Math.min(...rows.map((r) => r.value));
  return min === max;
}
