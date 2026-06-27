/**
 * NewStoreLaunchForm (Path B) — request a managed WordPress/WooCommerce store launch.
 *
 * Collects ONLY frontend-safe data: business name, desired domain, business type, selected
 * template + plan (placeholder, no billing), an optional brand-color preference, a brand-asset
 * readiness checklist (no uploads), and a support note. No credentials or provisioning here.
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
  AssetReadiness,
  BrandAssetItem,
  NewLaunchInput,
  StoreTemplate,
  SubscriptionPlan,
  SubscriptionPlanId,
} from '@/domain/types';

import { defaultBrandAssets, isValidDomain, uniqueCategories } from '../onboardingHelpers';
import { BrandAssetsChecklist } from './BrandAssetsChecklist';
import { ChoiceGroup } from './ChoiceGroup';
import { PlanPicker } from './PlanPicker';
import { ReferralCodeField } from './ReferralCodeField';
import { TemplateCatalog } from './TemplateCatalog';

export interface NewStoreLaunchFormProps {
  templates: StoreTemplate[];
  plans: SubscriptionPlan[];
  submitting: boolean;
  onSubmit: (input: NewLaunchInput) => void;
}

function defaultPlanId(plans: SubscriptionPlan[]): SubscriptionPlanId {
  return plans.find((p) => p.recommended)?.id ?? plans[0]?.id ?? 'growth';
}

export function NewStoreLaunchForm({
  templates,
  plans,
  submitting,
  onSubmit,
}: NewStoreLaunchFormProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  const categories = uniqueCategories(templates);

  const [businessName, setBusinessName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [domain, setDomain] = useState('');
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<SubscriptionPlanId>(() => defaultPlanId(plans));
  const [brandColor, setBrandColor] = useState('');
  const [brandAssets, setBrandAssets] = useState<BrandAssetItem[]>(() => defaultBrandAssets());
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const nameError =
    touched && businessName.trim().length === 0
      ? t('onboarding.new.businessNameRequired')
      : undefined;
  const domainError =
    touched && !isValidDomain(domain) ? t('onboarding.new.domainRequired') : undefined;
  const businessTypeError =
    touched && !businessType ? t('onboarding.new.businessTypeRequired') : undefined;
  const templateError = touched && !templateId ? t('onboarding.new.templateRequired') : undefined;
  const referralError = touched && referralCode.trim().length === 0 ? t('onboarding.referral.required') : undefined;

  const updateAsset = (key: BrandAssetItem['key'], readiness: AssetReadiness) => {
    setBrandAssets((prev) => prev.map((a) => (a.key === key ? { ...a, readiness } : a)));
  };

  const handleSubmit = () => {
    setTouched(true);
    if (
      businessName.trim().length === 0 ||
      referralCode.trim().length === 0 ||
      !isValidDomain(domain) ||
      !businessType ||
      !templateId
    ) {
      return;
    }
    onSubmit({
      referralCode: referralCode.trim().toUpperCase(),
      businessName: businessName.trim(),
      domain: domain.trim().replace(/^https?:\/\//i, ''),
      businessType,
      templateId,
      planId,
      brandAssets,
      brandColorPreference: brandColor.trim() ? brandColor.trim() : undefined,
      contactNote: notes.trim() ? notes.trim() : undefined,
    });
  };

  return (
    <View testID="new-store-form" style={{ gap: tokens.spacing.lg }}>
      <Card>
        <View style={{ gap: tokens.spacing.xs }}>
          <Text variant="subheading">{t('onboarding.new.title')}</Text>
          <Text tone="muted">{t('onboarding.new.subtitle')}</Text>
        </View>

        <FormField label={t('onboarding.new.businessName.label')} required error={nameError}>
          <Input
            value={businessName}
            onChangeText={setBusinessName}
            placeholder={t('onboarding.new.businessName.placeholder')}
            editable={!submitting}
            invalid={Boolean(nameError)}
          />
        </FormField>

        <ReferralCodeField value={referralCode} onChange={setReferralCode} disabled={submitting} touched={touched} />
        {referralError ? (
          <Text variant="caption" tone="danger">
            {referralError}
          </Text>
        ) : null}

        <FormField label={t('onboarding.new.domain.label')} required error={domainError}>
          <Input
            value={domain}
            onChangeText={setDomain}
            placeholder={t('onboarding.new.domain.placeholder')}
            autoCapitalize="none"
            keyboardType="url"
            editable={!submitting}
            invalid={Boolean(domainError)}
          />
        </FormField>

        <FormField
          label={t('onboarding.new.businessType.label')}
          required
          error={businessTypeError}
        >
          <ChoiceGroup
            value={businessType}
            disabled={submitting}
            onChange={setBusinessType}
            choices={categories.map((c) => ({ value: c, label: c }))}
          />
        </FormField>

        <FormField label={t('onboarding.new.brandColor.label')}>
          <Input
            value={brandColor}
            onChangeText={setBrandColor}
            placeholder={t('onboarding.new.brandColor.placeholder')}
            editable={!submitting}
          />
        </FormField>
      </Card>

      <Card title={t('onboarding.new.template.label')}>
        <FormField label={t('onboarding.new.template.choose')} error={templateError}>
          <TemplateCatalog
            templates={templates}
            plans={plans}
            selectable
            selectedId={templateId}
            onSelect={setTemplateId}
          />
        </FormField>
      </Card>

      <Card title={t('onboarding.plans.title')}>
        <Text tone="muted" variant="caption">
          {t('onboarding.plans.subtitle')}
        </Text>
        <PlanPicker plans={plans} selectedId={planId} onSelect={setPlanId} />
      </Card>

      <Card title={t('onboarding.new.assets.label')}>
        <Text tone="muted" variant="caption">
          {t('onboarding.new.assets.help')}
        </Text>
        <BrandAssetsChecklist value={brandAssets} onChange={updateAsset} />
      </Card>

      <Card>
        <FormField label={t('onboarding.new.notes.label')}>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t('onboarding.new.notes.placeholder')}
            editable={!submitting}
            multiline
            numberOfLines={3}
            style={{ minHeight: 88, textAlignVertical: 'top' }}
          />
        </FormField>
        <Button
          label={submitting ? t('onboarding.submitting') : t('onboarding.new.submit')}
          onPress={handleSubmit}
          loading={submitting}
          leading={<Ionicons name="rocket-outline" size={16} color={tokens.color.onPrimary} />}
        />
      </Card>
    </View>
  );
}
