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
  EmptySiteCard,
  FeatureCard,
  MobilePage,
  MobileSubHeader,
  PressableScale,
} from '@/features/mobile/components';
import { mobileMetrics, mobileType, useMobileColors } from '@/features/mobile/mobileTokens';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { http } from '@/services/httpClient';
import type { SocialConnection, SocialPlatform } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

interface PlatformDef {
  platform: SocialPlatform;
  labelKey: StringKey;
  icon: string;
}

const PRIMARY_PLATFORMS: PlatformDef[] = [
  { platform: 'telegram', labelKey: 'social.platform.telegram', icon: 'paper-plane-outline' },
  { platform: 'instagram', labelKey: 'social.platform.instagram', icon: 'logo-instagram' },
  { platform: 'whatsapp_business', labelKey: 'social.platform.whatsapp', icon: 'logo-whatsapp' },
  { platform: 'bale', labelKey: 'social.platform.bale', icon: 'chatbubble-outline' },
];

const MORE_PLATFORMS: PlatformDef[] = [
  { platform: 'eitaa', labelKey: 'social.platform.eitaa', icon: 'chatbubbles-outline' },
  { platform: 'rubika', labelKey: 'social.platform.rubika', icon: 'people-outline' },
];

const CUSTOM_PLATFORM: PlatformDef = {
  platform: 'webhook',
  labelKey: 'social.platform.customConnection',
  icon: 'link-outline',
};

const PLATFORM_LABEL: Partial<Record<SocialPlatform, StringKey>> = {
  whatsapp_business: 'social.platform.whatsapp',
  webhook: 'social.platform.customConnection',
};

function platformLabelKey(platform: SocialPlatform): StringKey {
  return PLATFORM_LABEL[platform] ?? (`social.platform.${platform}` as StringKey);
}

function statusLabelKey(status: SocialConnection['status']): StringKey {
  if (status === 'connected') return 'social.status.connected';
  if (status === 'error') return 'social.status.error';
  return 'social.status.pending';
}

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
  const colors = useMobileColors();
  const router = useRouter();
  const { rowDirection } = useTheme();
  const activeSite = useActiveSite();
  const siteId = activeSite.data?.id;
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('telegram');
  const [showMore, setShowMore] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handleUrl, setHandleUrl] = useState('');
  const [token, setToken] = useState('');
  const [formError, setFormError] = useState<string | undefined>();
  const [testNote, setTestNote] = useState<string | undefined>();

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
      setFormError(undefined);
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'social-connections'] });
    },
    onError: () => setFormError(t('social.error.create')),
  });

  const deleteMutation = useMutation({
    mutationFn: (connectionId: string) =>
      http.del(`/merchant/sites/${siteId}/social/connections/${connectionId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'social-connections'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (connectionId: string) =>
      http.post<{ ok: boolean; message: string }>(
        `/merchant/sites/${siteId}/social/connections/${connectionId}/test`,
      ),
    onSuccess: (res) => {
      setTestNote(res.message || t('social.testOk'));
    },
    onError: () => setTestNote(t('social.testFailed')),
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

  if (!activeSite.isPending && !siteId) {
    return (
      <MobilePage
        testID="social-channels-screen"
        header={
          <MobileSubHeader title={t('social.title')} onBack={onBack} backLabel={t('mobile.back')} />
        }
      >
        <View style={{ padding: mobileMetrics.screenPadding }}>
          <EmptySiteCard
            onPrimary={() => router.navigate('/create-site' as never)}
            onSecondary={() => router.navigate('/connect-site' as never)}
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
              <View style={{ gap: 16 }}>
                {(listQuery.data ?? []).map((conn) => (
                  <View
                    key={conn.id}
                    style={{
                      gap: 8,
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.separator,
                    }}
                  >
                    <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
                      <Text variant="subheading" style={{ flex: 1 }}>
                        {conn.displayName}
                      </Text>
                      <Badge
                        tone={
                          conn.status === 'connected'
                            ? 'success'
                            : conn.status === 'error'
                              ? 'danger'
                              : 'warning'
                        }
                        label={t(statusLabelKey(conn.status))}
                      />
                    </View>
                    <Text variant="caption" tone="muted">
                      {t(platformLabelKey(conn.platform))}
                      {conn.handleUrl ? ` · ${conn.handleUrl}` : ''}
                    </Text>
                    {conn.lastError ? (
                      <Text variant="caption" tone="danger">
                        {conn.lastError}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: rowDirection, gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        label={t('social.testConnection')}
                        variant="secondary"
                        size="sm"
                        loading={testMutation.isPending}
                        onPress={() => {
                          setTestNote(undefined);
                          testMutation.mutate(conn.id);
                        }}
                      />
                      <Button
                        label={t('social.disconnect')}
                        variant="secondary"
                        size="sm"
                        loading={deleteMutation.isPending}
                        onPress={() => deleteMutation.mutate(conn.id)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
            {testNote ? (
              <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>
                {testNote}
              </Text>
            ) : null}
          </Card>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <Card title={t('social.addHeading')}>
            <View style={{ gap: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: 10 }}>
                {PRIMARY_PLATFORMS.map((p) => (
                  <View key={p.platform} style={{ width: '48%', flexGrow: 1 }}>
                    <FeatureCard
                      icon={p.icon as never}
                      label={t(p.labelKey)}
                      selected={selectedPlatform === p.platform}
                      onPress={() => setSelectedPlatform(p.platform)}
                    />
                  </View>
                ))}
              </View>
              {showMore ? (
                <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: 10 }}>
                  {MORE_PLATFORMS.map((p) => (
                    <View key={p.platform} style={{ width: '48%', flexGrow: 1 }}>
                      <FeatureCard
                        icon={p.icon as never}
                        label={t(p.labelKey)}
                        selected={selectedPlatform === p.platform}
                        onPress={() => setSelectedPlatform(p.platform)}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <PressableScale onPress={() => setShowMore(true)} accessibilityLabel={t('social.moreChannels')}>
                  <Text style={{ fontSize: mobileType.captionSize, color: colors.primary, fontWeight: '700' }}>
                    {t('social.moreChannels')}
                  </Text>
                </PressableScale>
              )}
              {showAdvanced ? (
                <FeatureCard
                  icon={CUSTOM_PLATFORM.icon as never}
                  label={t(CUSTOM_PLATFORM.labelKey)}
                  selected={selectedPlatform === CUSTOM_PLATFORM.platform}
                  onPress={() => setSelectedPlatform(CUSTOM_PLATFORM.platform)}
                />
              ) : (
                <PressableScale
                  onPress={() => setShowAdvanced(true)}
                  accessibilityLabel={t('social.advancedConnection')}
                >
                  <Text style={{ fontSize: mobileType.captionSize, color: colors.textSecondary, fontWeight: '600' }}>
                    {t('social.advancedConnection')}
                  </Text>
                </PressableScale>
              )}
            </View>
            <View style={{ gap: 12 }}>
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
              {selectedPlatform === 'webhook' || showAdvanced ? (
                <Input
                  value={token}
                  onChangeText={setToken}
                  placeholder={t('social.tokenPlaceholder')}
                  secureTextEntry
                  autoCapitalize="none"
                />
              ) : null}
              <Text variant="caption" tone="muted">
                {t('social.tokenHint')}
              </Text>
              {formError ? (
                <Text variant="caption" tone="danger">
                  {formError}
                </Text>
              ) : null}
              <Button
                label={t('social.connectCta')}
                onPress={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!siteId || displayName.trim().length === 0}
              />
            </View>
          </Card>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
