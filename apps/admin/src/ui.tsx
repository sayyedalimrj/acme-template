/**
 * Minimal admin UI kit — a small, self-contained set of RN primitives for the internal admin
 * app. Intentionally duplicated (not imported from `apps/client`) and kept lean; the future
 * `packages/ui` extraction will replace this. Cross-platform (RN + RN Web), RTL/LTR aware.
 */
import React, { type ReactNode, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Tokens } from './system';

export type Tone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onPrimary';
export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type Variant = 'caption' | 'label' | 'body' | 'subheading' | 'title' | 'display';

const VARIANT: Record<Variant, { size: keyof Tokens['font']; weight: ViewStyle['borderWidth'] }> = {
  caption: { size: 'caption', weight: undefined },
  label: { size: 'label', weight: undefined },
  body: { size: 'body', weight: undefined },
  subheading: { size: 'subheading', weight: undefined },
  title: { size: 'title', weight: undefined },
  display: { size: 'display', weight: undefined },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
}

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const { tokens } = useTheme();
  const toneColor: Record<Tone, string> = {
    default: tokens.color.text,
    muted: tokens.color.textMuted,
    primary: tokens.color.primary,
    success: tokens.color.success,
    warning: tokens.color.warning,
    danger: tokens.color.danger,
    onPrimary: tokens.color.onPrimary,
  };
  const weight: Record<Variant, RNTextProps['style']> = {
    caption: { fontWeight: '500' },
    label: { fontWeight: '600' },
    body: { fontWeight: '400' },
    subheading: { fontWeight: '600' },
    title: { fontWeight: '700' },
    display: { fontWeight: '700' },
  };
  return (
    <RNText
      style={[
        { fontSize: tokens.font[VARIANT[variant].size], color: toneColor[tone] },
        weight[variant],
        style,
      ]}
      {...rest}
    />
  );
}

export function Screen({
  children,
  testID,
}: {
  children: ReactNode;
  testID?: string;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      contentContainerStyle={{
        padding: tokens.spacing.lg,
        paddingBottom: tokens.spacing.lg + insets.bottom,
        gap: tokens.spacing.lg,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Surface({
  children,
  bordered = false,
  padding = 'lg',
  style,
}: {
  children: ReactNode;
  bordered?: boolean;
  padding?: keyof Tokens['spacing'];
  style?: ViewStyle;
}): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing[padding],
          borderWidth: bordered ? tokens.borderWidth.hairline : 0,
          borderColor: tokens.color.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Card({
  title,
  headerAction,
  children,
  padding = 'lg',
  style,
}: {
  title?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  padding?: keyof Tokens['spacing'];
  style?: ViewStyle;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          borderWidth: tokens.borderWidth.hairline,
          borderColor: tokens.color.border,
          padding: tokens.spacing[padding],
          gap: tokens.spacing.md,
        },
        style,
      ]}
    >
      {title || headerAction ? (
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: tokens.spacing.sm,
            paddingBottom: tokens.spacing.sm,
            borderBottomWidth: tokens.borderWidth.hairline,
            borderBottomColor: tokens.color.border,
          }}
        >
          {title ? <Text variant="subheading">{title}</Text> : <View />}
          {headerAction}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Divider(): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={{ height: tokens.borderWidth.hairline, backgroundColor: tokens.color.border }} />
  );
}

export function SectionLabel({ label }: { label: string }): React.JSX.Element {
  return (
    <Text
      variant="caption"
      tone="muted"
      style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}
    >
      {label}
    </Text>
  );
}

function tonePalette(tokens: Tokens): Record<BadgeTone, { bg: string; fg: string }> {
  return {
    neutral: { bg: tokens.color.surfaceAlt, fg: tokens.color.textMuted },
    primary: { bg: tokens.color.primarySoft, fg: tokens.color.primary },
    success: { bg: tokens.color.successSoft, fg: tokens.color.success },
    warning: { bg: tokens.color.warningSoft, fg: tokens.color.warning },
    danger: { bg: tokens.color.dangerSoft, fg: tokens.color.danger },
    info: { bg: tokens.color.infoSoft, fg: tokens.color.info },
  };
}

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: BadgeTone;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const p = tonePalette(tokens)[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: p.bg,
        paddingVertical: 2,
        paddingHorizontal: tokens.spacing.sm,
        borderRadius: tokens.radius.pill,
      }}
    >
      <Text variant="caption" style={{ color: p.fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
  dot = true,
}: {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const p = tonePalette(tokens)[tone];
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: tokens.spacing.xs + 1,
        backgroundColor: p.bg,
        paddingVertical: 3,
        paddingHorizontal: tokens.spacing.sm,
        borderRadius: tokens.radius.pill,
      }}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: p.fg }} /> : null}
      <Text variant="caption" style={{ color: p.fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

export type HealthBand = 'healthy' | 'degraded' | 'critical';
export function healthBand(score: number): HealthBand {
  const c = Math.max(0, Math.min(100, Math.round(score)));
  if (c >= 80) return 'healthy';
  if (c >= 50) return 'degraded';
  return 'critical';
}

export function HealthScoreBadge({
  score,
  labels,
}: {
  score: number;
  labels: Record<HealthBand, string>;
}): React.JSX.Element {
  const c = Math.max(0, Math.min(100, Math.round(score)));
  const band = healthBand(c);
  const tone: BadgeTone = band === 'healthy' ? 'success' : band === 'degraded' ? 'warning' : 'danger';
  return <StatusBadge tone={tone} label={`${labels[band]} · ${c}`} />;
}

export type MetricTint = 'primary' | 'success' | 'warning' | 'info' | 'danger';
export function MetricCard({
  label,
  value,
  tint = 'primary',
}: {
  label: string;
  value: string;
  tint?: MetricTint;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const accent = tokens.color[tint];
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 150,
        minWidth: 140,
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        borderWidth: tokens.borderWidth.hairline,
        borderColor: tokens.color.border,
        padding: tokens.spacing.md,
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: tokens.spacing.sm,
      }}
    >
      <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 999, backgroundColor: accent }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text variant="title" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function DataListRow({
  title,
  subtitle,
  trailing,
  onPress,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hover, setHover] = useState(false);
  const inner = (
    <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.md }}>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
  const base: ViewStyle = {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
  };
  if (!onPress) return <View style={base}>{inner}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={({ pressed }) => [
        base,
        hover || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      {inner}
    </Pressable>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, padding: tokens.spacing.xl }}>
      <Text variant="subheading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={{ textAlign: 'center', maxWidth: 360 }}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

export function LoadingState({ label }: { label: string }): React.JSX.Element {
  return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <Text tone="muted">{label}</Text>
    </View>
  );
}

export function ErrorState({
  title,
  retryLabel,
  onRetry,
}: {
  title: string;
  retryLabel: string;
  onRetry: () => void;
}): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={{ padding: 32, alignItems: 'center', gap: tokens.spacing.md }}>
      <Text tone="danger" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Button label={retryLabel} variant="secondary" size="sm" onPress={onRetry} />
    </View>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const bg: Record<ButtonVariant, string> = {
    primary: tokens.color.primary,
    secondary: tokens.color.surfaceAlt,
    ghost: 'transparent',
  };
  const fg: Record<ButtonVariant, Tone> = {
    primary: 'onPrimary',
    secondary: 'default',
    ghost: 'primary',
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        StyleSheet.flatten([
          {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: size === 'sm' ? tokens.spacing.xs + 2 : tokens.spacing.sm + 2,
            paddingHorizontal: size === 'sm' ? tokens.spacing.md : tokens.spacing.lg,
            borderRadius: tokens.radius.md,
            backgroundColor: bg[variant],
            borderWidth: variant === 'secondary' ? tokens.borderWidth.hairline : 0,
            borderColor: tokens.color.border,
            opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
          },
          style,
        ])
      }
    >
      <Text variant="label" tone={fg[variant]} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MockActionButton({
  label,
  note,
}: {
  label: string;
  note?: string;
}): React.JSX.Element {
  return (
    <View style={{ gap: 2, alignSelf: 'flex-start' }}>
      <Button label={label} variant="secondary" size="sm" disabled />
      {note ? (
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  stretch = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  stretch?: boolean;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const track: ViewStyle = {
    flexDirection: rowDirection,
    backgroundColor: tokens.color.surfaceAlt,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.borderWidth.hairline,
    borderColor: tokens.color.border,
    padding: 3,
    gap: 3,
  };
  const segments = options.map((o) => {
    const active = o.value === value;
    return (
      <Pressable
        key={o.value}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(o.value)}
        style={{
          flex: stretch ? 1 : undefined,
          paddingVertical: tokens.spacing.xs + 2,
          paddingHorizontal: tokens.spacing.md,
          borderRadius: tokens.radius.md - 3,
          alignItems: 'center',
          backgroundColor: active ? tokens.color.surface : 'transparent',
          borderWidth: active ? tokens.borderWidth.hairline : 0,
          borderColor: tokens.color.border,
        }}
      >
        <Text variant="caption" tone={active ? 'primary' : 'muted'} numberOfLines={1} style={{ fontWeight: active ? '700' : '500' }}>
          {o.label}
        </Text>
      </Pressable>
    );
  });
  if (stretch) return <View style={track}>{segments}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={track}>
      {segments}
    </ScrollView>
  );
}
