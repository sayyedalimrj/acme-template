/**
 * Onboarding request detail.
 *
 * Read-only view of a single onboarding request: a summary of the submitted (frontend-safe)
 * data, the selected template/plan or existing site URL, a status timeline, the next support
 * action, and a security note reaffirming that no credentials are collected in the app.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils/format';

import { SecurityNote } from './components/SecurityNote';
import { StatusTimeline } from './components/StatusTimeline';
import {
  brandAssetLabelKey,
  isExisting,
  nextActionKey,
  platformLabelKey,
  requestTypeLabelKey,
  statusMeta,
} from './onboardingHelpers';
import { useOnboardingRequest, useStoreTemplates, useSubscriptionPlans } from './useOnboarding';

function DetailRow({ label, value }: { label: string; value: ReactNode }): React.JSX.Element {
  const { tokens, rowDirection, isRTL } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        paddingVertical: tokens.spacing.xs,
      }}
    >
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="label" style={{ flexShrink: 1, textAlign: isRTL ? 'left' : 'right' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export interface OnboardingRequestDetailScreenProps {
  requestId: string;
}

export function OnboardingRequestDetailScreen({
  requestId,
}: OnboardingRequestDetailScreenProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();

  const { data: request, isPending, isError, refetch } = useOnboardingRequest(requestId);
  const templatesQuery = useStoreTemplates();
  const plansQuery = useSubscriptionPlans();

  if (isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError || !request) {
    return (
      <Screen testID="onboarding-detail-screen" title={t('onboarding.detail.notFound.title')}>
        <ErrorState
          title={t('onboarding.detail.notFound.title')}
          body={t('onboarding.detail.notFound.body')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  const none = t('product.value.none');
  const meta = statusMeta(request.status);
  const typeLabel = isExisting(request)
    ? t('onboarding.detail.type.existing')
    : t('onboarding.detail.type.new');
  const templateName = !isExisting(request)
    ? templatesQuery.data?.find((tpl) => tpl.id === request.templateId)?.name
    : undefined;
  const planName = !isExisting(request)
    ? plansQuery.data?.find((p) => p.id === request.planId)?.name
    : undefined;

  return (
    <Screen testID="onboarding-detail-screen" title={request.businessName}>
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
        <Badge tone="neutral" label={typeLabel} />
        <Badge tone={meta.tone} label={t(meta.labelKey)} />
      </View>

      {/* Summary */}
      <Card title={t('onboarding.detail.summary')}>
        <DetailRow label={t('onboarding.detail.type')} value={typeLabel} />
        <DetailRow label={t('onboarding.detail.businessName')} value={request.businessName} />
        {isExisting(request) ? (
          <>
            <DetailRow label={t('onboarding.detail.siteUrl')} value={request.siteUrl} />
            <DetailRow
              label={t('onboarding.detail.platform')}
              value={t(platformLabelKey(request.platform))}
            />
            <DetailRow
              label={t('onboarding.detail.requestType')}
              value={t(requestTypeLabelKey(request.requestType))}
            />
          </>
        ) : (
          <>
            <DetailRow label={t('onboarding.detail.domain')} value={request.domain} />
            <DetailRow label={t('onboarding.detail.businessType')} value={request.businessType} />
            <DetailRow
              label={t('onboarding.detail.template')}
              value={templateName ?? request.templateId}
            />
            <DetailRow label={t('onboarding.detail.plan')} value={planName ?? request.planId} />
            <DetailRow
              label={t('onboarding.detail.brandColor')}
              value={request.brandColorPreference ?? none}
            />
          </>
        )}
        <DetailRow label={t('onboarding.detail.notes')} value={request.contactNote ?? none} />
      </Card>

      {/* Brand assets (new-store only) */}
      {!isExisting(request) ? (
        <Card title={t('onboarding.detail.assets')}>
          {request.brandAssets.map((asset, index) => (
            <View key={asset.key}>
              {index > 0 ? <Divider /> : null}
              <DetailRow
                label={t(brandAssetLabelKey(asset.key))}
                value={
                  <Badge
                    tone={asset.readiness === 'have' ? 'success' : 'warning'}
                    label={
                      asset.readiness === 'have'
                        ? t('onboarding.asset.have')
                        : t('onboarding.asset.need')
                    }
                  />
                }
              />
            </View>
          ))}
        </Card>
      ) : null}

      {/* Next action */}
      <Card title={t('onboarding.detail.nextAction')}>
        <View
          style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, alignItems: 'flex-start' }}
        >
          <Ionicons name="arrow-forward-circle-outline" size={20} color={tokens.color.primary} />
          <Text style={{ flex: 1 }}>{t(nextActionKey(request))}</Text>
        </View>
      </Card>

      {/* Timeline */}
      <Card title={t('onboarding.detail.timeline')}>
        {request.statusHistory.length === 0 ? (
          <EmptyState title={none} icon="time-outline" fill={false} />
        ) : (
          <StatusTimeline events={request.statusHistory} testID="onboarding-timeline" />
        )}
        <Text variant="caption" tone="muted">
          {t('onboarding.requests.updated')}: {formatDate(request.updatedAt)}
        </Text>
      </Card>

      <SecurityNote />
    </Screen>
  );
}
