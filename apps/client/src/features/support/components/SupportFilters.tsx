/**
 * SupportFilters — single-select filter rows for the queue (type, status, priority,
 * assignment) using the shared SegmentedControl. Status (many values) scrolls horizontally
 * instead of wrapping; the smaller sets stretch to fill the row. An "all" sentinel resets each.
 */
import React from 'react';
import { View } from 'react-native';

import { FormField, SegmentedControl } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SupportPriority, SupportRequestStatus, SupportRequestType } from '@/domain/types';

import {
  priorityMeta,
  statusMeta,
  typeLabelKey,
  type AssignmentFilter,
  type SupportFilters as Filters,
} from '../supportHelpers';

const TYPE_VALUES: (SupportRequestType | 'all')[] = ['all', 'existing', 'new'];
const PRIORITY_VALUES: (SupportPriority | 'all')[] = ['all', 'urgent', 'high', 'medium', 'low'];
const ASSIGNMENT_VALUES: AssignmentFilter[] = ['all', 'assigned', 'unassigned'];
const STATUS_VALUES: (SupportRequestStatus | 'all')[] = [
  'all',
  'submitted',
  'under_review',
  'needs_customer_action',
  'awaiting_assets',
  'provisioning',
  'connection_scheduled',
  'ready_for_review',
  'connected',
  'delivered',
  'unsupported',
  'archived',
];

export interface SupportFiltersProps {
  filters: Filters;
  onChange: (next: Filters) => void;
}

export function SupportFilters({ filters, onChange }: SupportFiltersProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  return (
    <View style={{ gap: tokens.spacing.md }} testID="support-filters">
      <FormField label={t('support.filter.type')}>
        <SegmentedControl
          value={filters.type}
          onChange={(type) => onChange({ ...filters, type: type as Filters['type'] })}
          stretch
          options={TYPE_VALUES.map((value) => ({
            value,
            label: value === 'all' ? t('support.filter.all') : t(typeLabelKey(value)),
          }))}
        />
      </FormField>

      <FormField label={t('support.filter.priority')}>
        <SegmentedControl
          value={filters.priority}
          onChange={(priority) => onChange({ ...filters, priority: priority as Filters['priority'] })}
          stretch
          options={PRIORITY_VALUES.map((value) => ({
            value,
            label: value === 'all' ? t('support.filter.all') : t(priorityMeta(value).labelKey),
          }))}
        />
      </FormField>

      <FormField label={t('support.filter.assignment')}>
        <SegmentedControl
          value={filters.assignment}
          onChange={(assignment) =>
            onChange({ ...filters, assignment: assignment as Filters['assignment'] })
          }
          stretch
          options={ASSIGNMENT_VALUES.map((value) => ({
            value,
            label:
              value === 'all'
                ? t('support.filter.all')
                : value === 'assigned'
                  ? t('support.filter.assigned')
                  : t('support.filter.unassigned'),
          }))}
        />
      </FormField>

      <FormField label={t('support.filter.status')}>
        {/* Many statuses → horizontally scrollable segmented control (no wrapped chips). */}
        <SegmentedControl
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status: status as Filters['status'] })}
          options={STATUS_VALUES.map((value) => ({
            value,
            label: value === 'all' ? t('support.filter.all') : t(statusMeta(value).labelKey),
          }))}
        />
      </FormField>
    </View>
  );
}
