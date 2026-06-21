/**
 * OverviewChart direction/order regression test.
 *
 * The home "at a glance" chart is a TIME SERIES: it must read left→right (oldest first, newest
 * last) — the universal chart convention — even in the Persian/RTL UI. A previous build mirrored
 * the axis for RTL, which made a growing trend look "descending/reversed" (the reported bug).
 *
 * We assert:
 *  1. labels render in the SAME order they are passed (oldest→newest), and
 *  2. no container is laid out `row-reverse` (the series is never mirrored), and
 *  3. the newest point (last) is the highlighted/emphasized one.
 */
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { OverviewChart, type OverviewPoint } from '../OverviewChart';

function renderWithTheme(ui: ReactElement) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }
  return render(ui, { wrapper: Wrapper });
}

const data: OverviewPoint[] = [
  { label: 'oldest', value: 10 },
  { label: 'mid', value: 20 },
  { label: 'newest', value: 30, highlight: true },
];

/** Recursively collect every `flexDirection` style value in the rendered tree. */
function collectFlexDirections(node: unknown, out: string[]): void {
  if (!node || typeof node !== 'object') return;
  const n = node as { props?: { style?: unknown }; children?: unknown[] };
  const style = n.props?.style;
  const styles = Array.isArray(style) ? style : [style];
  for (const s of styles) {
    if (s && typeof s === 'object' && 'flexDirection' in (s as object)) {
      out.push(String((s as { flexDirection?: unknown }).flexDirection));
    }
  }
  if (Array.isArray(n.children)) {
    for (const c of n.children) collectFlexDirections(c, out);
  }
}

describe('OverviewChart direction', () => {
  it('renders labels oldest→newest (not reversed) for the bar variant', () => {
    renderWithTheme(<OverviewChart data={data} variant="bar" testID="chart" />);
    const labels = screen.getAllByText(/oldest|mid|newest/);
    expect(labels.map((nNode) => nNode.props.children)).toEqual(['oldest', 'mid', 'newest']);
  });

  it('never lays the time series out row-reverse (bar variant)', () => {
    const { toJSON } = renderWithTheme(<OverviewChart data={data} variant="bar" testID="chart" />);
    const dirs: string[] = [];
    collectFlexDirections(toJSON(), dirs);
    expect(dirs).not.toContain('row-reverse');
  });

  it('never lays the time series out row-reverse (line variant)', () => {
    const { toJSON } = renderWithTheme(<OverviewChart data={data} variant="line" testID="chart" />);
    const dirs: string[] = [];
    collectFlexDirections(toJSON(), dirs);
    expect(dirs).not.toContain('row-reverse');
  });

  it('emphasizes the newest (last) point', () => {
    renderWithTheme(<OverviewChart data={data} variant="bar" testID="chart" />);
    const newest = screen.getByText('newest');
    const style = Array.isArray(newest.props.style) ? newest.props.style : [newest.props.style];
    const weights = style.map((s: { fontWeight?: string }) => s?.fontWeight).filter(Boolean);
    expect(weights).toContain('700');
  });
});
