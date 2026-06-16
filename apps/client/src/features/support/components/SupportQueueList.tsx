/**
 * SupportQueueList — queue rows showing store name, type, primary line (site URL/domain),
 * status + priority badges, assignee, next action, and checklist progress. Rows deep-link to
 * the request detail/review screen.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Divider, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SupportQueueItem } from '@/domain/types';

import { checklistProgress, primaryLine, priorityMeta, statusMeta } from '../supportHelpers';

interface RowProps {
  item: SupportQueueItem;
  onPress: () => void;
}

function QueueRow({ item, onPress }: RowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const status = statusMeta(item.status);
  const priority = priorityMeta(item.priority);
  const progress = checklistProgress(item);
  const icon = item.type === 'existing' ? 'link-outline' : 'rocket-outline';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.storeName}
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

      <View style={{ flex: 1, gap: 4, minWidth: 160 }}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Text variant="label" numberOfLines={1}>
            {item.storeName}
          </Text>
          <Badge tone={status.tone} label={t(status.labelKey)} />
          <Badge tone={priority.tone} label={t(priority.labelKey)} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {primaryLine(item)}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {t('support.row.nextAction')}: {item.nextAction.summary}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text variant="caption" tone="muted">
          {item.assignee ? item.assignee.name : t('support.row.unassigned')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('support.row.checklist')}: {progress.done}/{progress.total}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
    </Pressable>
  );
}

export interface SupportQueueListProps {
  items: SupportQueueItem[];
  onOpen: (id: string) => void;
}

export function SupportQueueList({ items, onOpen }: SupportQueueListProps): React.JSX.Element {
  return (
    <View testID="support-queue-list">
      {items.map((item, index) => (
        <View key={item.id}>
          {index > 0 ? <Divider /> : null}
          <QueueRow item={item} onPress={() => onOpen(item.id)} />
        </View>
      ))}
    </View>
  );
}
