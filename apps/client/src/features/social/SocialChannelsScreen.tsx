/**
 * Social channels — connect publishing channels and manage auto-publish settings.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, EmptyState, Input, Text } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import {
  AnimatedSection,
  FeatureCard,
  MobilePage,
  MobileSubHeader,
} from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { http } from '@/services/httpClient';
import type { SocialConnection, SocialPlatform } from '@/domain/types';

const PLATFORMS: { platform: SocialPlatform; labelKey: string; icon: string }[] = [
  { platform: 'instagram', labelKey: 'social.platform.instagram', icon: 'logo-instagram' },
  { platform: 'telegram', labelKey: 'social.platform.telegram', icon: 'paper-plane-outline' },
  { platform: 'bale', labelKey: 'social.platform.bale', icon: 'chatbubble-outline' },
  { platform: 'eitaa', labelKey: 'social.platform.eitaa', icon: 'chatbubbles-outline' },
  { platform: 'rubika', labelKey: 'social.platform.rubika', icon: 'people-outline' },
  { platform: 'whatsapp_business', labelKey: 'social.platform.whatsapp', icon: 'logo-whatsapp' },
  { platform: 'webhook', labelKey: 'social.platform.webhook', icon: 'code-slash-outline' },
];

async function fetchConnections(siteId: string): Promise<SocialConnection[]> {
  const res = await http.get<{ items: Record<string, unknown>[] }>(
    `/merchant/sites/${siteId}/social/connections`,
  );
  return res.items.map(mapConnection);
}

function mapConnection(row: Record<string, unknown>): SocialConnection {
  return {
    id: String(row.id),
    siteId: String(row.siteId),
    platform: row.platform as SocialPlatform,
    displayName: String(row.displayName),
    handleUrl: row.handleUrl ? String(row.handleUrl) : undefined,
    status: row.status as SocialConnection['status'],
    authType: row.authType as SocialConnection['authType'],
    capabilities: (row.capabilities as SocialConnection['capabilities']) ?? {
      createPost: true,
      editPost: false,
      deletePost: false,
      uploadImage: true,
      publishStory: false,
      publishCarousel: false,
      publishProductCard: true,
    },
    autoPublishEnabled: Boolean(row.autoPublishEnabled),
    lastSyncAt: row.lastSyncAt ? String(row.lastSyncAt) : undefined,
    lastError: row.lastError ? String(row.lastError) : undefined,
  };
}

export function SocialChannelsScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const activeSite = useActiveSite();
  const siteId = activeSite.data?.id;
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('telegram');
  const [displayName, setDisplayName] = useState('');
  const [handleUrl, setHandleUrl] = useState('');
  const [token, setToken] = useState('');

  const listQuery = useQuery({
    queryKey: ['site', siteId, 'social-connections'],
    queryFn: () => fetchConnections(siteId as string),
    enabled: isApiConfigured() && Boolean(siteId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await http.post(`/merchant/sites/${siteId}/social/connections`, {
        platform: selectedPlatform,
        displayName: displayName.trim(),
        handleUrl: handleUrl.trim() || undefined,
        authType: token.trim() ? 'api_token' : 'manual',
        token: token.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setDisplayName('');
      setHandleUrl('');
      setToken('');
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'social-connections'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (connectionId: string) =>
      http.post<{ ok: boolean; message: string }>(
        `/merchant/sites/${siteId}/social/connections/${connectionId}/test`,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'social-connections'] });
    },
  });

  const onBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.navigate('/more' as never);
  };

  if (!isApiConfigured()) {
    return (
      <MobilePage
        testID="social-channels-screen"
        header={
          <MobileSubHeader title={t('social.title')} onBack={onBack} backLabel={t('mobile.back')} />
        }
      >
        <View style={{ padding: mobileMetrics.screenPadding }}>
          <EmptyState
            title={t('social.notAvailable.title')}
            body={t('social.notAvailable.body')}
            icon="share-social-outline"
            fill={false}
          />
        </View>
      </MobilePage>
    );
  }

  return (
    <MobilePage
      testID="social-channels-screen"
      header={
        <MobileSubHeader title={t('social.title')} onBack={onBack} backLabel={t('mobile.back')} />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 20 }}>
        <AnimatedSection index={0}>
          <Text tone="muted">{t('social.intro')}</Text>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <Card title={t('social.connectedHeading')}>
            {listQuery.isPending ? (
              <Text tone="muted">{t('common.loading')}</Text>
            ) : (listQuery.data ?? []).length === 0 ? (
              <Text tone="muted">{t('social.empty')}</Text>
            ) : (
              <View style={{ gap: 12 }}>
                {(listQuery.data ?? []).map((conn) => (
                  <View key={conn.id} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text variant="subheading">{conn.displayName}</Text>
                      <Badge tone={conn.status === 'connected' ? 'success' : 'warning'} label={conn.status} />
                    </View>
                    <Text variant="caption" tone="muted">
                      {t(`social.platform.${conn.platform}` as never)} · {conn.handleUrl ?? '—'}
                    </Text>
                    {conn.lastError ? (
                      <Text variant="caption" tone="danger">
                        {conn.lastError}
                      </Text>
                    ) : null}
                    <Button
                      label={t('social.testConnection')}
                      variant="secondary"
                      size="sm"
                      loading={testMutation.isPending}
                      onPress={() => testMutation.mutate(conn.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <Card title={t('social.addHeading')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {PLATFORMS.map((p) => (
                <View key={p.platform} style={{ width: '30%', flexGrow: 1 }}>
                  <FeatureCard
                    icon={p.icon as never}
                    label={t(p.labelKey as never)}
                    onPress={() => setSelectedPlatform(p.platform)}
                    badge={selectedPlatform === p.platform ? 1 : undefined}
                  />
                </View>
              ))}
            </View>
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('social.displayNamePlaceholder')}
            />
            <Input
              value={handleUrl}
              onChangeText={setHandleUrl}
              placeholder={t('social.handleUrlPlaceholder')}
              autoCapitalize="none"
            />
            <Input
              value={token}
              onChangeText={setToken}
              placeholder={t('social.tokenPlaceholder')}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text variant="caption" tone="muted">
              {t('social.tokenHint')}
            </Text>
            <Button
              label={t('social.connectCta')}
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!siteId || displayName.trim().length === 0}
            />
          </Card>
        </AnimatedSection>

        <AnimatedSection index={3}>
          <Card title={t('social.publishSettingsHeading')}>
            <Text tone="muted">{t('social.publishSettingsBody')}</Text>
          </Card>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
