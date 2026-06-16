/**
 * ExistingSiteForm (Path A) — connect a live store or request managed handover.
 *
 * Collects ONLY frontend-safe data: business name, public site URL, platform confirmation,
 * request type, and a support note. It never asks for admin logins, WooCommerce keys, or
 * WordPress application passwords. When "managed handover" is chosen, an extra note reminds
 * the merchant that secure connection is arranged out-of-band — never via this app.
 *
 * Validation mirrors the existing connect-site pattern (local state; no extra form deps).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, FormField, Input, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type {
  ExistingOnboardingInput,
  ExistingRequestType,
  PlatformConfirmation,
} from '@/domain/types';

import {
  EXISTING_REQUEST_TYPE_OPTIONS,
  PLATFORM_OPTIONS,
  isValidStoreUrl,
  platformLabelKey,
  requestTypeLabelKey,
} from '../onboardingHelpers';
import { ChoiceGroup } from './ChoiceGroup';
import { SecurityNote } from './SecurityNote';

export interface ExistingSiteFormProps {
  submitting: boolean;
  onSubmit: (input: ExistingOnboardingInput) => void;
}

export function ExistingSiteForm({
  submitting,
  onSubmit,
}: ExistingSiteFormProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  const [businessName, setBusinessName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [platform, setPlatform] = useState<PlatformConfirmation>('woocommerce');
  const [requestType, setRequestType] = useState<ExistingRequestType>('connect_only');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const nameError =
    touched && businessName.trim().length === 0
      ? t('onboarding.existing.businessNameRequired')
      : undefined;
  const urlError =
    touched && !isValidStoreUrl(siteUrl) ? t('onboarding.existing.urlRequired') : undefined;

  const handleSubmit = () => {
    setTouched(true);
    if (businessName.trim().length === 0 || !isValidStoreUrl(siteUrl)) {
      return;
    }
    onSubmit({
      businessName: businessName.trim(),
      siteUrl: siteUrl.trim(),
      platform,
      requestType,
      contactNote: notes.trim() ? notes.trim() : undefined,
    });
  };

  return (
    <Card testID="existing-site-form">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="subheading">{t('onboarding.existing.title')}</Text>
        <Text tone="muted">{t('onboarding.existing.subtitle')}</Text>
      </View>

      <FormField label={t('onboarding.existing.businessName.label')} required error={nameError}>
        <Input
          value={businessName}
          onChangeText={setBusinessName}
          placeholder={t('onboarding.existing.businessName.placeholder')}
          editable={!submitting}
          invalid={Boolean(nameError)}
        />
      </FormField>

      <FormField label={t('onboarding.existing.url.label')} required error={urlError}>
        <Input
          value={siteUrl}
          onChangeText={setSiteUrl}
          placeholder={t('onboarding.existing.url.placeholder')}
          autoCapitalize="none"
          keyboardType="url"
          editable={!submitting}
          invalid={Boolean(urlError)}
        />
      </FormField>

      <FormField label={t('onboarding.existing.platform.label')}>
        <ChoiceGroup
          value={platform}
          disabled={submitting}
          onChange={setPlatform}
          choices={PLATFORM_OPTIONS.map((value) => ({ value, label: t(platformLabelKey(value)) }))}
        />
      </FormField>

      <FormField label={t('onboarding.existing.requestType.label')}>
        <ChoiceGroup
          value={requestType}
          disabled={submitting}
          onChange={setRequestType}
          choices={EXISTING_REQUEST_TYPE_OPTIONS.map((value) => ({
            value,
            label: t(requestTypeLabelKey(value)),
          }))}
        />
      </FormField>

      {requestType === 'managed_handover' ? (
        <SecurityNote messageKey="onboarding.existing.handoverNote" />
      ) : null}

      <FormField label={t('onboarding.existing.notes.label')}>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder={t('onboarding.existing.notes.placeholder')}
          editable={!submitting}
          multiline
          numberOfLines={3}
          style={{ minHeight: 88, textAlignVertical: 'top' }}
        />
      </FormField>

      <Button
        label={submitting ? t('onboarding.submitting') : t('onboarding.existing.submit')}
        onPress={handleSubmit}
        loading={submitting}
        leading={<Ionicons name="paper-plane-outline" size={16} color={tokens.color.onPrimary} />}
      />
    </Card>
  );
}
