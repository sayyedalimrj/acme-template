/**
 * Onboarding home (index) — the "two front doors" entry point.
 *
 * Orchestrates: a path chooser (connect existing vs. launch new), the corresponding mock
 * request form, a browsable template catalog, and the merchant's existing requests with
 * status. Everything is mock-only and frontend-safe — no credentials, no provisioning, no
 * backend (see security-model.md). Active-site context is not required: onboarding is how a
 * merchant gets their first (or next) store connected.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Surface,
  Text,
} from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { ExistingOnboardingInput, NewLaunchInput, OnboardingType } from '@/domain/types';

import { ExistingSiteForm } from './components/ExistingSiteForm';
import { NewStoreLaunchForm } from './components/NewStoreLaunchForm';
import { PathChooser } from './components/PathChooser';
import { RequestList } from './components/RequestList';
import { SecurityNote } from './components/SecurityNote';
import { TemplateCatalog } from './components/TemplateCatalog';
import { useOnboardingRequests, useStoreTemplates, useSubscriptionPlans } from './useOnboarding';
import {
  useCreateExistingSiteRequest,
  useCreateStoreLaunchRequest,
} from './useOnboardingMutations';

function ChangePathLink({ onPress }: { onPress: () => void }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}
    >
      <Ionicons name="chevron-back" size={18} color={tokens.color.primary} />
      <Text variant="label" tone="primary">
        {t('onboarding.changePath')}
      </Text>
    </Pressable>
  );
}

export function OnboardingScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const templatesQuery = useStoreTemplates();
  const plansQuery = useSubscriptionPlans();
  const requestsQuery = useOnboardingRequests();
  const existingMutation = useCreateExistingSiteRequest();
  const launchMutation = useCreateStoreLaunchRequest();

  const [path, setPath] = useState<OnboardingType | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const submitting = existingMutation.isPending || launchMutation.isPending;
  const submitError = existingMutation.isError || launchMutation.isError;

  const handleExisting = (input: ExistingOnboardingInput) => {
    existingMutation.mutate(input, { onSuccess: (req) => setSubmittedId(req.id) });
  };
  const handleLaunch = (input: NewLaunchInput) => {
    launchMutation.mutate(input, { onSuccess: (req) => setSubmittedId(req.id) });
  };

  const reset = () => {
    setSubmittedId(null);
    setPath(null);
    existingMutation.reset();
    launchMutation.reset();
  };

  const requests = requestsQuery.data ?? [];

  // --- Success state -------------------------------------------------------
  const successView = submittedId ? (
    <Card testID="onboarding-success">
      <View
        style={{ alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color.successSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={30} color={tokens.color.success} />
        </View>
        <Text variant="heading" style={{ textAlign: 'center' }}>
          {t('onboarding.submit.successTitle')}
        </Text>
        <Text tone="muted" style={{ textAlign: 'center', maxWidth: 420 }}>
          {t('onboarding.submit.successBody')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: tokens.spacing.sm,
            marginTop: tokens.spacing.sm,
          }}
        >
          <Button
            label={t('onboarding.submit.viewRequest')}
            onPress={() => go(`/onboarding/requests/${submittedId}`)}
          />
          <Button label={t('onboarding.submit.another')} variant="secondary" onPress={reset} />
        </View>
      </View>
    </Card>
  ) : null;

  // --- Form / chooser area -------------------------------------------------
  const newStoreReady = !templatesQuery.isPending && !plansQuery.isPending;

  let mainArea: React.ReactNode;
  if (submittedId) {
    mainArea = successView;
  } else if (path === null) {
    mainArea = (
      <View style={{ gap: tokens.spacing.lg }}>
        <PathChooser onSelect={setPath} />
        <Card title={t('onboarding.templates.title')}>
          <Text tone="muted" variant="caption">
            {t('onboarding.templates.subtitle')}
          </Text>
          {templatesQuery.isPending ? (
            <LoadingState label={t('common.loading')} fill={false} />
          ) : templatesQuery.isError ? (
            <ErrorState
              title={t('onboarding.templates.error')}
              retryLabel={t('common.retry')}
              onRetry={() => templatesQuery.refetch()}
              fill={false}
            />
          ) : (
            <TemplateCatalog templates={templatesQuery.data ?? []} plans={plansQuery.data ?? []} />
          )}
        </Card>
      </View>
    );
  } else {
    mainArea = (
      <View style={{ gap: tokens.spacing.md }}>
        <ChangePathLink onPress={reset} />
        {submitError ? (
          <Surface variant="surfaceAlt" bordered padding="md">
            <Text tone="danger" variant="label">
              {t('onboarding.submit.error')}
            </Text>
          </Surface>
        ) : null}
        {path === 'existing' ? (
          <ExistingSiteForm submitting={submitting} onSubmit={handleExisting} />
        ) : newStoreReady ? (
          <NewStoreLaunchForm
            templates={templatesQuery.data ?? []}
            plans={plansQuery.data ?? []}
            submitting={submitting}
            onSubmit={handleLaunch}
          />
        ) : (
          <LoadingState label={t('common.loading')} fill={false} />
        )}
      </View>
    );
  }

  // --- Requests section ----------------------------------------------------
  const requestsSection = (
    <Card title={t('onboarding.recentRequests')}>
      {requestsQuery.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : requestsQuery.isError ? (
        <ErrorState
          title={t('onboarding.requests.error')}
          retryLabel={t('common.retry')}
          onRetry={() => requestsQuery.refetch()}
          fill={false}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title={t('onboarding.requests.empty')}
          icon="document-text-outline"
          fill={false}
        />
      ) : (
        <RequestList requests={requests} onOpen={(id) => go(`/onboarding/requests/${id}`)} />
      )}
    </Card>
  );

  return (
    <Screen testID="onboarding-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('onboarding.title')}</Text>
        <Text tone="muted">{t('onboarding.subtitle')}</Text>
      </View>

      <SecurityNote />

      {mainArea}

      {requestsSection}
    </Screen>
  );
}
