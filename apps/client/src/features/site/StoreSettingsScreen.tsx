/**
 * StoreSettingsScreen — safely edit a single connected store and inspect its real connection.
 *
 * This is a production-only surface (it talks to OUR backend); in the mock/demo build it shows a
 * short "not available" note instead of a broken form. It lets a merchant:
 *   - see the REAL connection status, connection type (REST vs plugin), last sync time + last error
 *   - edit the store display name and URL (backend re-validates the URL and, if the host changes,
 *     flips the site back to "pending" so the connection must be re-verified)
 *   - re-enter REST credentials and re-test the connection (advanced). Stored secrets are NEVER
 *     shown — only a masked "stored securely" placeholder — and must be re-typed to change.
 *   - see plugin status and how to re-pair when the store is connected via the WordPress plugin.
 *
 * No secret is ever displayed. RTL-safe; reuses the shared design system (no redesign).
 */
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
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
import { isApiConfigured } from '@/config/api.config';
import {
  deleteSite,
  getSiteStatus,
  getSyncStatus,
  triggerSiteSync,
  updateSiteSettings,
  verifyWooConnection,
  wooConnectErrorMessage,
  type SiteStatusResult,
} from '@/services/connectionApi';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';

function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'connected':
    case 'verified':
    case 'active':
    case 'success':
      return 'success';
    case 'pending':
    case 'running':
      return 'warning';
    case 'error':
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

export interface StoreSettingsScreenProps {
  siteId: string;
}

export function StoreSettingsScreen({ siteId }: StoreSettingsScreenProps): React.JSX.Element {
  const t = useT();

  if (!isApiConfigured()) {
    return (
      <Screen testID="store-settings-screen" title={t('storeSettings.title')}>
        <EmptyState
          title={t('storeSettings.notAvailable.title')}
          body={t('storeSettings.notAvailable.body')}
          icon="settings-outline"
          fill={false}
        />
      </Screen>
    );
  }

  return <StoreSettingsLoader siteId={siteId} />;
}

function StoreSettingsLoader({ siteId }: { siteId: string }): React.JSX.Element {
  const t = useT();
  const statusQuery = useQuery({
    queryKey: ['site', siteId, 'status'],
    queryFn: () => getSiteStatus(siteId),
  });

  if (statusQuery.isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <Screen testID="store-settings-screen" title={t('storeSettings.title')}>
        <ErrorState
          title={t('storeSettings.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => statusQuery.refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  return (
    <StoreSettingsForm
      siteId={siteId}
      data={statusQuery.data}
      refreshing={statusQuery.isFetching}
      onRefresh={() => statusQuery.refetch()}
    />
  );
}

interface StoreSettingsFormProps {
  siteId: string;
  data: SiteStatusResult;
  refreshing: boolean;
  onRefresh: () => void;
}

function StoreSettingsForm({
  siteId,
  data,
  refreshing,
  onRefresh,
}: StoreSettingsFormProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { site, plugin, lastSync } = data;

  const [name, setName] = useState(() => site.name);
  const [url, setUrl] = useState(() => site.url);
  const [urlError, setUrlError] = useState<string | undefined>();
  const [savedNote, setSavedNote] = useState<string | undefined>();

  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [credError, setCredError] = useState<string | undefined>();
  const [credOk, setCredOk] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [syncNote, setSyncNote] = useState<string | undefined>();

  const isRest = site.connection_mode === 'woo_rest';
  const hasPlugin = site.connection_mode === 'plugin' || Boolean(plugin);

  const save = useMutation({
    mutationFn: () => updateSiteSettings(siteId, { name: name.trim(), url: url.trim() }),
    onSuccess: async (res) => {
      const hostChanged = res.site.status === 'pending';
      setSavedNote(hostChanged ? t('storeSettings.details.hostChanged') : t('storeSettings.details.saved'));
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'status'] });
      await queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });

  const retest = useMutation({
    mutationFn: () => verifyWooConnection(siteId, consumerKey.trim(), consumerSecret.trim()),
    onSuccess: async () => {
      setCredOk(true);
      setCredError(undefined);
      setConsumerKey('');
      setConsumerSecret('');
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'status'] });
    },
    onError: (e: unknown) => {
      setCredOk(false);
      setCredError(wooConnectErrorMessage(e));
    },
  });

  const sync = useMutation({
    mutationFn: () => triggerSiteSync(siteId),
    onSuccess: async () => {
      setSyncNote(t('storeSettings.sync.started'));
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'syncStatus'] });
      await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'status'] });
    },
    onError: (e: unknown) => setSyncNote(wooConnectErrorMessage(e)),
  });

  // Live sync progress: poll every 2.5s while a run is queued/running; stop when it settles.
  const syncStatusQuery = useQuery({
    queryKey: ['site', siteId, 'syncStatus'],
    queryFn: () => getSyncStatus(siteId),
    refetchInterval: (query) => {
      const s = query.state.data?.run?.status;
      return s === 'running' || s === 'queued' ? 2500 : false;
    },
  });
  const syncRun = syncStatusQuery.data?.run ?? null;
  const syncing = syncRun?.status === 'running' || syncRun?.status === 'queued';
  const prevSyncStatus = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const s = syncRun?.status;
    // When a run transitions into a terminal success, refresh the connection status + dashboard
    // overview so the chart/counters reflect the freshly synced data.
    if (prevSyncStatus.current && prevSyncStatus.current !== s && s === 'success') {
      void queryClient.invalidateQueries({ queryKey: ['site', siteId, 'status'] });
      void queryClient.invalidateQueries({ queryKey: ['site', siteId, 'dashboard'] });
    }
    prevSyncStatus.current = s;
  }, [syncRun?.status, queryClient, siteId]);

  const remove = useMutation({
    mutationFn: () => deleteSite(siteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sites'] });
      await queryClient.invalidateQueries({ queryKey: ['site'] });
      // Connection removed — leave the settings screen so no stale "connected" state is shown.
      router.replace('/connect-site' as never);
    },
  });

  const onSave = (): void => {
    setSavedNote(undefined);
    if (!isValidUrl(url)) {
      setUrlError(t('storeSettings.details.urlInvalid'));
      return;
    }
    setUrlError(undefined);
    save.mutate();
  };

  const onRetest = (): void => {
    setCredOk(false);
    if (!consumerKey.trim() || !consumerSecret.trim()) {
      setCredError(t('storeSettings.creds.required'));
      return;
    }
    setCredError(undefined);
    retest.mutate();
  };

  const lastSyncAt = lastSync?.finished_at ?? lastSync?.started_at ?? site.last_synced_at;
  const lastError = lastSync?.status === 'failed' ? lastSync.error : site.last_error;

  return (
    <Screen testID="store-settings-screen" title={t('storeSettings.title')} subtitle={t('storeSettings.subtitle')}>
      {/* Connection status (real, backend-confirmed). */}
      <Card title={t('storeSettings.status.heading')}>
        <View style={{ gap: tokens.spacing.sm }}>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
            <Text variant="label" tone="muted">
              {t('storeSettings.status.connection')}
            </Text>
            <Badge tone={statusTone(site.status)} label={site.status} />
          </View>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
            <Text variant="label" tone="muted">
              {t('storeSettings.status.mode')}
            </Text>
            <Text variant="label">
              {isRest ? t('storeSettings.status.modeRest') : t('storeSettings.status.modePlugin')}
            </Text>
          </View>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
            <Text variant="label" tone="muted">
              {t('storeSettings.status.lastSync')}
            </Text>
            <Text variant="label">{lastSyncAt ? fmt.dateTime(lastSyncAt) : t('storeSettings.status.never')}</Text>
          </View>
          {lastError ? (
            <View style={{ gap: 4 }}>
              <Text variant="label" tone="muted">
                {t('storeSettings.status.lastError')}
              </Text>
              <Text testID="store-settings-last-error" variant="caption" tone="danger">
                {lastError}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
            <Button
              testID="store-settings-refresh"
              label={t('storeSettings.refresh')}
              variant="secondary"
              size="sm"
              onPress={onRefresh}
              loading={refreshing}
              leading={<Ionicons name="refresh" size={16} color={tokens.color.text} />}
            />
            {isRest ? (
              <Button
                testID="store-settings-sync"
                label={syncing ? t('storeSettings.sync.running') : t('storeSettings.sync.button')}
                variant="secondary"
                size="sm"
                onPress={() => {
                  setSyncNote(undefined);
                  sync.mutate();
                }}
                loading={sync.isPending || syncing}
                disabled={sync.isPending || syncing}
                leading={<Ionicons name="sync-outline" size={16} color={tokens.color.text} />}
              />
            ) : null}
          </View>
          {syncRun && syncing ? (
            <View style={{ gap: 2, marginTop: tokens.spacing.xs }}>
              <Text testID="store-settings-sync-progress" variant="caption" tone="muted">
                {`${syncRun.message ?? t('storeSettings.sync.running')} — ${syncRun.progress_percent}%`}
              </Text>
              {syncRun.orders_total > 0 ? (
                <Text variant="caption" tone="muted">
                  {`${t('storeSettings.sync.orders')}: ${syncRun.orders_done} ${t('common.of')} ${syncRun.orders_total}`}
                </Text>
              ) : null}
              {syncRun.products_total > 0 ? (
                <Text variant="caption" tone="muted">
                  {`${t('storeSettings.sync.products')}: ${syncRun.products_done} ${t('common.of')} ${syncRun.products_total}`}
                </Text>
              ) : null}
            </View>
          ) : null}
          {syncRun?.status === 'failed' && syncRun.last_error ? (
            <Text testID="store-settings-sync-error" variant="caption" tone="danger" style={{ marginTop: tokens.spacing.xs }}>
              {syncRun.last_error}
            </Text>
          ) : null}
          {syncNote ? (
            <Text testID="store-settings-sync-note" variant="caption" tone="muted">
              {syncNote}
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Editable store details (name + URL). No secrets here. */}
      <Card title={t('storeSettings.details.heading')}>
        <FormField label={t('storeSettings.details.name')}>
          <Input
            testID="store-settings-name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!save.isPending}
          />
        </FormField>
        <FormField label={t('storeSettings.details.url')} error={urlError}>
          <Input
            testID="store-settings-url"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            editable={!save.isPending}
            invalid={Boolean(urlError)}
          />
        </FormField>
        {savedNote ? (
          <Text testID="store-settings-saved" variant="caption" tone="muted">
            {savedNote}
          </Text>
        ) : null}
        <View style={{ marginTop: tokens.spacing.xs }}>
          <Button
            testID="store-settings-save"
            label={save.isPending ? t('storeSettings.details.saving') : t('storeSettings.details.save')}
            onPress={onSave}
            loading={save.isPending}
          />
        </View>
      </Card>

      {/* Advanced: REST credentials. Stored secret is masked; re-entry required to change. */}
      {isRest ? (
        <Card title={t('storeSettings.creds.heading')}>
          <Text variant="caption" tone="muted">
            {t('storeSettings.creds.note')}
          </Text>
          <Surface
            variant="surfaceAlt"
            bordered
            padding="sm"
            style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
          >
            <Ionicons name="lock-closed-outline" size={16} color={tokens.color.textMuted} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {t('storeSettings.creds.stored')}
            </Text>
            <Text variant="label" tone="muted">
              {'••••••'}
            </Text>
          </Surface>
          <FormField label={t('storeSettings.creds.key')}>
            <Input
              testID="store-settings-ck"
              value={consumerKey}
              onChangeText={setConsumerKey}
              placeholder="ck_xxxxxxxxxxxx"
              autoCapitalize="none"
              editable={!retest.isPending}
            />
          </FormField>
          <FormField label={t('storeSettings.creds.secret')} error={credError}>
            <Input
              testID="store-settings-cs"
              value={consumerSecret}
              onChangeText={setConsumerSecret}
              placeholder="cs_xxxxxxxxxxxx"
              autoCapitalize="none"
              secureTextEntry
              editable={!retest.isPending}
              invalid={Boolean(credError)}
            />
          </FormField>
          {credOk ? (
            <Text testID="store-settings-cred-ok" variant="caption" tone="success">
              {t('storeSettings.creds.tested')}
            </Text>
          ) : null}
          <View style={{ alignItems: 'flex-start', marginTop: tokens.spacing.xs }}>
            <Button
              testID="store-settings-retest"
              label={retest.isPending ? t('storeSettings.creds.testing') : t('storeSettings.creds.retest')}
              variant="secondary"
              onPress={onRetest}
              loading={retest.isPending}
              leading={<Ionicons name="flash-outline" size={16} color={tokens.color.text} />}
            />
          </View>
        </Card>
      ) : null}

      {/* Plugin connection status + how to re-pair (no broken in-app re-pair button). */}
      {hasPlugin ? (
        <Card title={t('storeSettings.plugin.heading')}>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
            <Text variant="label" tone="muted">
              {t('storeSettings.plugin.status')}
            </Text>
            <Badge tone={statusTone(plugin?.status ?? site.status)} label={plugin?.status ?? site.status} />
          </View>
          {plugin?.plugin_version ? (
            <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
              <Text variant="label" tone="muted">
                {t('storeSettings.plugin.version')}
              </Text>
              <Text variant="label">{plugin.plugin_version}</Text>
            </View>
          ) : null}
          {plugin?.last_seen_at ? (
            <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
              <Text variant="label" tone="muted">
                {t('storeSettings.plugin.lastSeen')}
              </Text>
              <Text variant="label">{fmt.dateTime(plugin.last_seen_at)}</Text>
            </View>
          ) : null}
          <Text variant="caption" tone="muted" style={{ marginTop: tokens.spacing.xs }}>
            {t('storeSettings.plugin.repairNote')}
          </Text>
        </Card>
      ) : null}

      {/* Danger zone: remove the connection from JetWeb only (does not delete the real store). */}
      <Card title={t('storeSettings.delete.heading')}>
        <Text variant="caption" tone="muted">
          {t('storeSettings.delete.note')}
        </Text>
        {!confirmDelete ? (
          <View style={{ alignItems: 'flex-start', marginTop: tokens.spacing.xs }}>
            <Button
              testID="store-settings-delete"
              label={t('storeSettings.delete.button')}
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
              leading={<Ionicons name="trash-outline" size={16} color={tokens.color.danger} />}
            />
          </View>
        ) : (
          <View style={{ gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
            <Text testID="store-settings-delete-confirm" variant="caption" tone="danger">
              {t('storeSettings.delete.confirm')}
            </Text>
            <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm }}>
              <Button
                testID="store-settings-delete-cancel"
                label={t('common.cancel')}
                variant="secondary"
                size="sm"
                onPress={() => setConfirmDelete(false)}
                disabled={remove.isPending}
              />
              <Button
                testID="store-settings-delete-confirm-btn"
                label={t('storeSettings.delete.confirmButton')}
                variant="ghost"
                size="sm"
                onPress={() => remove.mutate()}
                loading={remove.isPending}
              />
            </View>
          </View>
        )}
      </Card>
    </Screen>
  );
}
