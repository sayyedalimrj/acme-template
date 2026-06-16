/**
 * Onboarding security note.
 *
 * A prominent, reusable warning that no credentials are ever collected in the app. Mirrors
 * the connect-site security note styling. The message is passed by i18n key so callers can
 * vary the copy (general note vs. managed-handover note).
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { StringKey } from '@/i18n/strings';

export interface SecurityNoteProps {
  messageKey?: StringKey;
}

export function SecurityNote({
  messageKey = 'onboarding.security.note',
}: SecurityNoteProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <Surface
      variant="surfaceAlt"
      bordered
      padding="md"
      style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, alignItems: 'flex-start' }}
    >
      <Ionicons name="shield-checkmark-outline" size={20} color={tokens.color.warning} />
      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
        {t(messageKey)}
      </Text>
    </Surface>
  );
}
