/**
 * RequestList — the merchant's onboarding requests, newest first.
 *
 * Each row shows the business name, its primary line (site URL for Path A, domain for Path B),
 * a status badge, and the last-updated date. Rows deep-link to the request detail screen.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Divider, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils/format';
import type { OnboardingRequest } from '@/domain/types';

import { requestPrimaryLine, statusMeta } from '../onboardingHelpers';

interface RowProps {
  request: OnboardingRequest;
  onPress: () => void;
}

function RequestRow({ request, onPress }: RowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const meta = statusMeta(request.status);
  const icon = request.type === 'existing' ? 'link-outline' : 'rocket-outline';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={request.businessName}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.sm,
          borderRadius: tokens.radius.md,
        },
        hovered || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={tokens.color.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" numberOfLines={1}>
          {request.businessName}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {requestPrimaryLine(request)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Badge tone={meta.tone} label={t(meta.labelKey)} />
        <Text variant="caption" tone="muted">
          {t('onboarding.requests.updated')}: {formatDate(request.updatedAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
    </Pressable>
  );
}

export interface RequestListProps {
  requests: OnboardingRequest[];
  onOpen: (id: string) => void;
}

export function RequestList({ requests, onOpen }: RequestListProps): React.JSX.Element {
  return (
    <View>
      {requests.map((request, index) => (
        <View key={request.id}>
          {index > 0 ? <Divider /> : null}
          <RequestRow request={request} onPress={() => onOpen(request.id)} />
        </View>
      ))}
    </View>
  );
}
