/**
 * StatusTimeline — a vertical, RTL-aware timeline of an onboarding request's status events.
 *
 * Renders each status event (status badge + date + optional note) connected by a rail with
 * dots. The most recent event is highlighted as the current step. Built from RN primitives
 * and theme tokens; no external timeline library.
 */
import React from 'react';
import { View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { OnboardingStatusEvent } from '@/domain/types';

import { statusMeta } from '../onboardingHelpers';

export interface StatusTimelineProps {
  events: OnboardingStatusEvent[];
  testID?: string;
}

export function StatusTimeline({ events, testID }: StatusTimelineProps): React.JSX.Element {
  const { tokens, rowDirection, isRTL } = useTheme();
  const t = useT();

  // Newest first so the current step reads at the top.
  const ordered = [...events].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return (
    <View testID={testID} style={{ gap: tokens.spacing.md }}>
      {ordered.map((event, index) => {
        const meta = statusMeta(event.status);
        const isCurrent = index === 0;
        const isLast = index === ordered.length - 1;
        return (
          <View
            key={`${event.status}-${event.date}`}
            style={{ flexDirection: rowDirection, gap: tokens.spacing.md }}
          >
            {/* Rail: dot + connector */}
            <View style={{ alignItems: 'center', width: 16 }}>
              <View
                style={{
                  width: isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderRadius: tokens.radius.pill,
                  backgroundColor: isCurrent ? tokens.color.primary : tokens.color.border,
                  borderWidth: isCurrent ? 0 : tokens.borderWidth.thin,
                  borderColor: tokens.color.border,
                  marginTop: 2,
                }}
              />
              {!isLast ? (
                <View
                  style={{
                    flex: 1,
                    width: tokens.borderWidth.thick,
                    backgroundColor: tokens.color.border,
                    marginTop: 2,
                  }}
                />
              ) : null}
            </View>

            {/* Content */}
            <View style={{ flex: 1, gap: 2, paddingBottom: isLast ? 0 : tokens.spacing.sm }}>
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <Badge tone={meta.tone} label={t(meta.labelKey)} />
                {isCurrent ? (
                  <Badge tone="primary" label={t('onboarding.timeline.current')} />
                ) : null}
              </View>
              <Text variant="caption" tone="muted" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {formatDateTime(event.date)}
              </Text>
              {event.note ? <Text variant="body">{event.note}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
