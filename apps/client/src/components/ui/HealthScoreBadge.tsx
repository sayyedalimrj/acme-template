/**
 * HealthScoreBadge primitive.
 *
 * Maps a 0–100 health score to a severity band (healthy / degraded / critical) and renders
 * a StatusBadge with the band tone plus the numeric score. Useful for site/plugin/sync
 * health and (future) platform-admin tenant health rows. Labels are supplied by the caller
 * (already translated) so the component stays i18n-agnostic.
 */
import React from 'react';
import { type ViewStyle } from 'react-native';

import { type BadgeTone } from './Badge';
import { StatusBadge } from './StatusBadge';

export type HealthBand = 'healthy' | 'degraded' | 'critical';

export interface HealthBandLabels {
  healthy: string;
  degraded: string;
  critical: string;
}

export interface HealthScoreBadgeProps {
  /** Health score, 0–100. Values are clamped into range. */
  score: number;
  /** Translated labels per band. */
  labels: HealthBandLabels;
  /** Append the numeric score to the label (default true). */
  showScore?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/** Pure mapping from a 0–100 score to a severity band. Exported for reuse/testing. */
export function healthBand(score: number): HealthBand {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 80) return 'healthy';
  if (clamped >= 50) return 'degraded';
  return 'critical';
}

const BAND_TONE: Record<HealthBand, BadgeTone> = {
  healthy: 'success',
  degraded: 'warning',
  critical: 'danger',
};

export function HealthScoreBadge({
  score,
  labels,
  showScore = true,
  style,
  testID,
}: HealthScoreBadgeProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = healthBand(clamped);
  const label = showScore ? `${labels[band]} · ${clamped}` : labels[band];
  return <StatusBadge label={label} tone={BAND_TONE[band]} style={style} testID={testID} />;
}
