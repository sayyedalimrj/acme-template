/**
 * Connect Site screen (mock).
 *
 * Lists connected stores, lets the user switch the active store, connect a new mock store
 * (name + URL only), and disconnect one. It deliberately collects NO credentials: a prominent
 * security note explains that WooCommerce keys/secrets and WordPress application passwords are
 * handled by a secure backend/proxy later (see security steering).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  Screen,
  Surface,
  Text,
  type BadgeTone,
} from '@/components/ui';
import { useActiveSite, useSites } from '@/features/site/useSites';
import {
  useConnectSite,
  useDisconnectSite,
  useSetActiveSite,
} from '@/features/site/useSiteMutations';
import { isApiConfigured } from '@/config/api.config';
import { verifyWooConnection } from '@/services/connectionApi';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SiteConnection, SiteStatus } from '@/domain/types';

function statusTone(status: SiteStatus): BadgeTone {
  switch (status) {
    case 'connected':
      return 'success';
    case 'pending':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'neutral';
  }
}

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

function SecurityNote(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <Surface
      variant="surfaceAlt"
      bordered
      padding="md"
      style={{ flexDirection: rowDirection, gap: tokens.spacing.sm }}
    >
      <Ionicons name="shield-checkmark-outline" size={20} color={tokens.color.warning} />
      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
        {t('connectSite.securityNote')}
      </Text>
    </Surface>
  );
}

interface SiteRowProps {
  site: SiteConnection;
  isActive: boolean;
  onSetActive: () => void;
  onDisconnect: () => void;
  busy: boolean;
}

function SiteRow({
  site,
  isActive,
  onSetActive,
  onDisconnect,
  busy,
}: SiteRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View
            style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
          >
            <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
              {site.name}
            </Text>
            <Badge tone={statusTone(site.status)} label={site.status} />
            {isActive ? <Badge tone="primary" label={t('connectSite.active')} /> : null}
          </View>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {site.url}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm }}>
        {!isActive ? (
          <Button
            label={t('connectSite.setActive')}
            variant="secondary"
            size="sm"
            onPress={onSetActive}
            disabled={busy}
          />
        ) : null}
        <Button
          label={t('connectSite.disconnect')}
          variant="ghost"
          size="sm"
          onPress={onDisconnect}
          disabled={busy}
        />
      </View>
    </View>
  );
}

export function ConnectSiteScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  const sitesQuery = useSites();
  const { data: activeSite } = useActiveSite();
  const connect = useConnectSite();
  const setActive = useSetActiveSite();
  const disconnect = useDisconnectSite();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [touched, setTouched] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const nameError = touched && name.trim().length === 0 ? t('connectSite.nameRequired') : undefined;
  const urlError = touched && !isValidUrl(url) ? t('connectSite.urlRequired') : undefined;
  const mutating = connect.isPending || setActive.isPending || disconnect.isPending || verifying;

  const onConnect = () => {
    setTouched(true);
    setVerifyError(null);
    if (name.trim().length === 0 || !isValidUrl(url)) {
      return;
    }
    connect.mutate(
      { name: name.trim(), url: url.trim() },
      {
        onSuccess: async (site) => {
          // When connected to the real backend with REST credentials, verify them now so the
          // store becomes "connected" and an initial sync runs server-side.
          if (isApiConfigured() && consumerKey.trim() && consumerSecret.trim()) {
            try {
              setVerifying(true);
              await verifyWooConnection(site.id, consumerKey.trim(), consumerSecret.trim());
              await sitesQuery.refetch();
            } catch (err) {
              setVerifyError((err as Error).message ?? 'اتصال ناموفق بود.');
            } finally {
              setVerifying(false);
            }
          }
          setName('');
          setUrl('');
          setConsumerKey('');
          setConsumerSecret('');
          setTouched(false);
        },
      },
    );
  };

  const sites = sitesQuery.data ?? [];

  return (
    <Screen
      testID="connect-site-screen"
      title={t('connectSite.title')}
      subtitle={t('connectSite.subtitle')}
    >

      <SecurityNote />

      <Card title={t('connectSite.connectedHeading')}>
        {sitesQuery.isPending ? (
          <LoadingState label={t('common.loading')} fill={false} />
        ) : sitesQuery.isError ? (
          <ErrorState
            title={t('connectSite.error')}
            retryLabel={t('common.retry')}
            onRetry={() => sitesQuery.refetch()}
            fill={false}
          />
        ) : sites.length === 0 ? (
          <EmptyState title={t('connectSite.empty')} icon="link-outline" fill={false} />
        ) : (
          <View style={{ gap: tokens.spacing.md }}>
            {sites.map((site, index) => (
              <View key={site.id} style={{ gap: tokens.spacing.md }}>
                {index > 0 ? <Divider /> : null}
                <SiteRow
                  site={site}
                  isActive={activeSite?.id === site.id}
                  onSetActive={() => setActive.mutate(site.id)}
                  onDisconnect={() => disconnect.mutate(site.id)}
                  busy={mutating}
                />
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card title={t('connectSite.addHeading')}>
        <FormField label={t('connectSite.nameLabel')} required error={nameError}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('connectSite.namePlaceholder')}
            autoCapitalize="words"
            editable={!connect.isPending}
            invalid={Boolean(nameError)}
          />
        </FormField>
        <FormField label={t('connectSite.urlLabel')} required error={urlError}>
          <Input
            value={url}
            onChangeText={setUrl}
            placeholder={t('connectSite.urlPlaceholder')}
            autoCapitalize="none"
            keyboardType="url"
            editable={!connect.isPending}
            invalid={Boolean(urlError)}
            onSubmitEditing={onConnect}
          />
        </FormField>
        {isApiConfigured() ? (
          <View style={{ gap: tokens.spacing.sm }}>
            <Text variant="caption" tone="muted">
              اعتبارنامه REST ووکامرس (اختیاری برای اتصال مستقیم). از مسیر ووکامرس ← تنظیمات ←
              پیشرفته ← REST API یک کلید با دسترسی خواندن/نوشتن بسازید.
            </Text>
            <FormField label="Consumer key (ck_…)">
              <Input
                value={consumerKey}
                onChangeText={setConsumerKey}
                placeholder="ck_xxxxxxxxxxxx"
                autoCapitalize="none"
                editable={!mutating}
              />
            </FormField>
            <FormField label="Consumer secret (cs_…)" error={verifyError ?? undefined}>
              <Input
                value={consumerSecret}
                onChangeText={setConsumerSecret}
                placeholder="cs_xxxxxxxxxxxx"
                autoCapitalize="none"
                secureTextEntry
                editable={!mutating}
              />
            </FormField>
          </View>
        ) : null}
        <Button
          label={
            connect.isPending || verifying
              ? t('connectSite.connecting')
              : t('connectSite.connectCta')
          }
          onPress={onConnect}
          loading={connect.isPending || verifying}
          leading={<Ionicons name="add" size={16} color={tokens.color.onPrimary} />}
        />
      </Card>
    </Screen>
  );
}
