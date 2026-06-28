/**
 * OverviewChart — a calm, dependency-free "at a glance" chart for the mobile home.
 *
 * Two variants, both built ONLY from RN Views (no SVG/DOM, no chart library) so they run
 * identically on Web, Android, and iOS:
 *   - "bar": proportional vertical bars (good for discrete buckets).
 *   - "line": a smooth (Catmull-Rom sampled) line with point dots — used for the cumulative
 *     sales trend. The smooth curve is drawn as many tiny rotated segments.
 *
 * Direction: this is a TIME SERIES, so the x-axis always flows left→right (oldest first, newest
 * last) — the universal chart convention — even in an RTL (Persian) UI. The data is already
 * ordered oldest→newest, so the newest/highlighted point sits on the RIGHT. (Mirroring the axis
 * for RTL made a growing trend read as "descending/reversed", which is the reported bug.)
 */
import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/ui';

import { useMobileColors } from '../mobileTokens';

export interface OverviewPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

export type OverviewChartVariant = 'bar' | 'line';

export interface OverviewChartProps {
  data: OverviewPoint[];
  height?: number;
  variant?: OverviewChartVariant;
  /** When true, only show labels for first, middle, and last points (reduces clutter). */
  sparseLabels?: boolean;
  /** Hide point dots when the series is long or flat. */
  showDots?: boolean;
  testID?: string;
}

interface XY {
  x: number;
  y: number;
}

/** Sample a Catmull-Rom spline through the points so the polyline looks smooth. */
function smoothSamples(points: XY[], perSegment = 12): XY[] {
  if (points.length < 2) {
    return points;
  }
  const out: XY[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    for (let s = 0; s < perSegment; s += 1) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push({ x, y });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function LineSegment({
  a,
  b,
  color,
  width,
}: {
  a: XY;
  b: XY;
  color: string;
  width: number;
}): React.JSX.Element {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  return (
    <View
      style={{
        position: 'absolute',
        left: midX - len / 2,
        top: midY - width / 2,
        width: len,
        height: width,
        borderRadius: width / 2,
        backgroundColor: color,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

function LineChart({
  data,
  height,
  colors,
  showDots,
}: {
  data: OverviewPoint[];
  height: number;
  colors: ReturnType<typeof useMobileColors>;
  showDots: boolean;
}): React.JSX.Element {
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...data.map((d) => (Number.isFinite(d.value) ? d.value : 0)));
  const padX = 8;
  const padTop = 10;
  const padBottom = 8;
  const usableW = Math.max(1, width - padX * 2);
  const usableH = Math.max(1, height - padTop - padBottom);
  const n = data.length;

  // Time flows left→right (oldest first); no RTL mirroring for a time series.
  const xFor = (i: number): number => {
    const base = n <= 1 ? 0 : (i / (n - 1)) * usableW;
    return padX + base;
  };
  const yFor = (v: number): number => {
    const safe = Number.isFinite(v) && v > 0 ? v : 0;
    return padTop + (1 - safe / max) * usableH;
  };

  const points: XY[] = data.map((d, i) => ({ x: xFor(i), y: yFor(d.value) }));
  const samples = width > 0 ? smoothSamples(points) : [];

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {/* gridlines */}
      {[0, 0.5, 1].map((f) => (
        <View
          key={f}
          style={{
            position: 'absolute',
            top: padTop + f * usableH,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.separator,
            opacity: f === 1 ? 1 : 0.55,
          }}
        />
      ))}
      {width > 0 ? (
        <>
          {samples.slice(0, -1).map((s, i) => (
            <LineSegment key={i} a={s} b={samples[i + 1]} color={colors.primary} width={3} />
          ))}
          {showDots
            ? points.map((p, i) => (
                <View
                  key={`dot-${i}`}
                  style={{
                    position: 'absolute',
                    left: p.x - (data[i].highlight ? 5 : 3),
                    top: p.y - (data[i].highlight ? 5 : 3),
                    width: data[i].highlight ? 10 : 6,
                    height: data[i].highlight ? 10 : 6,
                    borderRadius: 5,
                    backgroundColor: colors.primary,
                    borderWidth: data[i].highlight ? 2 : 0,
                    borderColor: colors.card,
                  }}
                />
              ))
            : points
                .filter((_, i) => data[i]?.highlight)
                .map((p, i) => (
                  <View
                    key={`dot-hi-${i}`}
                    style={{
                      position: 'absolute',
                      left: p.x - 5,
                      top: p.y - 5,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                      borderWidth: 2,
                      borderColor: colors.card,
                    }}
                  />
                ))}
        </>
      ) : null}
    </View>
  );
}

function shouldShowLabel(index: number, total: number, sparseLabels: boolean): boolean {
  if (!sparseLabels || total <= 4) return true;
  if (index === 0 || index === total - 1) return true;
  if (total <= 7) return index === Math.floor(total / 2);
  const step = Math.max(1, Math.ceil(total / 4));
  return index % step === 0;
}

export function OverviewChart({
  data,
  height = 132,
  variant = 'bar',
  sparseLabels = false,
  showDots,
  testID,
}: OverviewChartProps): React.JSX.Element {
  const colors = useMobileColors();
  const max = Math.max(1, ...data.map((d) => (Number.isFinite(d.value) ? d.value : 0)));
  const gridFractions = [0, 0.5, 1];
  const dotsVisible = showDots ?? data.length <= 7;

  return (
    <View testID={testID} style={{ gap: 8 }}>
      {variant === 'line' ? (
        <LineChart data={data} height={height} colors={colors} showDots={dotsVisible} />
      ) : (
        <View style={{ height, justifyContent: 'flex-end' }}>
          {/* Soft gridline backdrop. */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
            {gridFractions.map((f) => (
              <View
                key={f}
                style={{
                  position: 'absolute',
                  top: f * height,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: colors.separator,
                  opacity: f === 1 ? 1 : 0.6,
                }}
              />
            ))}
          </View>

          {/* Bars. Time flows left→right (oldest first); no RTL mirroring for a time series. */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height }}>
            {data.map((d, index) => {
              const safe = Number.isFinite(d.value) && d.value > 0 ? d.value : 0;
              const barHeight = Math.max(6, Math.round((safe / max) * (height - 10)));
              return (
                <View
                  key={`${d.label}-${index}`}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
                >
                  <View
                    style={{
                      width: '70%',
                      maxWidth: 30,
                      height: barHeight,
                      borderRadius: 7,
                      backgroundColor: d.highlight ? colors.primary : colors.primarySoft,
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {data.map((d, index) => {
          const visible = shouldShowLabel(index, data.length, sparseLabels);
          return (
            <View key={`${d.label}-label-${index}`} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: d.highlight ? colors.text : colors.textSecondary,
                  fontWeight: d.highlight ? '700' : '500',
                  opacity: visible ? 1 : 0,
                }}
              >
                {visible ? d.label : ' '}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
