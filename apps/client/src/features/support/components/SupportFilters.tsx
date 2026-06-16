/**
 * SupportFilters — single-select filter rows for the queue (type, status, priority,
 * assignment). Reuses the onboarding ChoiceGroup pill control with an "all" sentinel.
 */
import React from 'react';
import { View } from 'react-native';

import { FormField } from '@/components/ui';
import { ChoiceGroup } from '@/features/onboarding/components/ChoiceGroup';
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
        <ChoiceGroup
          value={filters.type}
          onChange={(type) => onChange({ ...filters, type })}
          choices={TYPE_VALUES.map((value) => ({
            value,
            label: value === 'all' ? t('support.filter.all') : t(typeLabelKey(value)),
          }))}
        />
      </FormField>

      <FormField label={t('support.filter.priority')}>
        <ChoiceGroup
          value={filters.priority}
          onChange={(priority) => onChange({ ...filters, priority })}
          choices={PRIORITY_VALUES.map((value) => ({
            value,
            label: value === 'all' ? t('support.filter.all') : t(priorityMeta(value).labelKey),
          }))}
        />
      </FormField>

      <FormField label={t('support.filter.assignment')}>
        <ChoiceGroup
          value={filters.assignment}
          onChange={(assignment) => onChange({ ...filters, assignment })}
          choices={ASSIGNMENT_VALUES.map((value) => ({
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
        <ChoiceGroup
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          choices={STATUS_VALUES.map((value) => ({
            value,
            label: value === 'all' ? t('support.filter.all') : t(statusMeta(value).labelKey),
          }))}
        />
      </FormField>
    </View>
  );
}
