/**
 * Settings screen (basic).
 *
 * Read-only/admin-health settings: app + account overview, active-site summary, appearance
 * controls (theme/direction, in-memory only), the production credential/security model
 * notice, a non-functional team/roles placeholder, and a mock system-status panel.
 *
 * No real credentials, no backend, no WooCommerce settings API — mock-only. Built from
 * existing UI primitives + typed-token StyleSheet; RN primitives only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Divider,
  Screen,
  Surface,
  Text,
  type BadgeTone,
} from '@/components/ui';
import { appConfig } from '@/config/app.config';
import { useActiveSite } from '@/features/site/useSites';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';
import type { StringKey } from '@/i18n/strings';

function Row({ label, value }: { label: string; value: ReactNode }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
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
        <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const ROLES: { nameKey: StringKey; descKey: StringKey }[] = [
  { nameKey: 'settings.role.owner', descKey: 'settings.role.ownerDesc' },
  { nameKey: 'settings.role.manager', descKey: 'settings.role.managerDesc' },
  { nameKey: 'settings.role.staff', descKey: 'settings.role.staffDesc' },
  { nameKey: 'settings.role.viewer', descKey: 'settings.role.viewerDesc' },
];

const STATUS_ITEMS: { labelKey: StringKey; ready: boolean }[] = [
  { labelKey: 'settings.status.appShell', ready: true },
  { labelKey: 'settings.status.mockServices', ready: true },
  { labelKey: 'settings.status.backendProxy', ready: false },
  { labelKey: 'settings.status.wooApi', ready: false },
];

function siteStatusTone(status: string): BadgeTone {
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

export function SettingsScreen(): React.JSX.Element {
  const { tokens, rowDirection, mode, toggleMode, direction, toggleDirection, setDirection } =
    useTheme();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const { user, signOut } = useSession();
  const { data: site } = useActiveSite();

  return (
    <Screen testID="settings-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('settings.title')}</Text>
        <Text tone="muted">{t('settings.subtitle')}</Text>
      </View>

      {/* A. App overview */}
      <Card title={t('settings.section.app')}>
        <Row label={t('settings.app.name')} value={appConfig.appName} />
        <Row
          label={t('settings.app.dataSource')}
          value={<Badge tone="info" label={t('settings.app.mock')} />}
        />
        <Row label={t('settings.app.version')} value={appConfig.appVersion} />
        <Row label={t('settings.app.platform')} value={t('settings.app.platformValue')} />
      </Card>

      {/* Account overview */}
      <Card title={t('settings.section.account')}>
        <Row label={t('settings.account.signedInAs')} value={user?.name ?? t('topbar.account')} />
        <Row label={t('settings.account.email')} value={user?.email ?? '—'} />
        {user?.role ? <Row label={t('settings.account.role')} value={user.role} /> : null}
        <View style={{ marginTop: tokens.spacing.sm, alignItems: 'flex-start' }}>
          <Button
            label={t('settings.account.signOut')}
            variant="secondary"
            size="sm"
            onPress={() => {
              void signOut();
            }}
            leading={<Ionicons name="log-out-outline" size={16} color={tokens.color.text} />}
          />
        </View>
      </Card>

      {/* Subscription / plans */}
      <Card title={t('settings.section.subscription')}>
        <Text variant="caption" tone="muted">
          {t('settings.subscription.note')}
        </Text>
        <View style={{ marginTop: tokens.spacing.sm, alignItems: 'flex-start' }}>
          <Button
            label={t('settings.subscription.view')}
            variant="secondary"
            size="sm"
            onPress={() => router.navigate('/plans' as never)}
            leading={<Ionicons name="pricetags-outline" size={16} color={tokens.color.text} />}
          />
        </View>
      </Card>

      {/* B. Active site */}
      <Card title={t('settings.section.activeSite')}>
        {site ? (
          <>
            <Row label={t('settings.app.name')} value={site.name} />
            <Row label="URL" value={site.url} />
            <Row
              label={t('settings.site.status')}
              value={<Badge tone={siteStatusTone(site.status)} label={site.status} />}
            />
          </>
        ) : (
          <Text tone="muted">{t('settings.site.none')}</Text>
        )}
        <View style={{ marginTop: tokens.spacing.sm, alignItems: 'flex-start' }}>
          <Button
            label={t('settings.site.manage')}
            variant="secondary"
            size="sm"
            onPress={() => router.navigate('/connect-site' as never)}
            leading={<Ionicons name="link-outline" size={16} color={tokens.color.text} />}
          />
        </View>
      </Card>

      {/* Language */}
      <Card title={t('settings.section.language')}>
        <Text variant="caption" tone="muted">
          {t('settings.language.note')}
        </Text>
        <View
          style={{
            flexDirection: rowDirection,
            gap: tokens.spacing.sm,
            marginTop: tokens.spacing.sm,
          }}
        >
          <Button
            label={t('settings.language.persian')}
            variant={locale === 'fa' ? 'primary' : 'secondary'}
            size="sm"
            testID="lang-fa"
            onPress={() => {
              setLocale('fa');
              setDirection('rtl');
            }}
          />
          <Button
            label={t('settings.language.english')}
            variant={locale === 'en' ? 'primary' : 'secondary'}
            size="sm"
            testID="lang-en"
            onPress={() => {
              setLocale('en');
              setDirection('ltr');
            }}
          />
        </View>
      </Card>

      {/* C. Appearance */}
      <Card title={t('settings.section.appearance')}>
        <Row
          label={t('settings.appearance.colorMode')}
          value={
            <View
              style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
            >
              <Text variant="label">
                {mode === 'dark'
                  ? t('settings.appearance.mode.dark')
                  : t('settings.appearance.mode.light')}
              </Text>
              <Button
                label={t('settings.appearance.toggleMode')}
                variant="secondary"
                size="sm"
                onPress={toggleMode}
                testID="toggle-mode"
              />
            </View>
          }
        />
        <Row
          label={t('settings.appearance.direction')}
          value={
            <View
              style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
            >
              <Text variant="label">{direction.toUpperCase()}</Text>
              <Button
                label={t('settings.appearance.toggleDirection')}
                variant="secondary"
                size="sm"
                onPress={toggleDirection}
                testID="toggle-direction"
              />
            </View>
          }
        />
        <Text variant="caption" tone="muted">
          {t('settings.appearance.note')}
        </Text>
      </Card>

      {/* D. Security & connections */}
      <Card title={t('settings.section.security')}>
        <Surface
          variant="surfaceAlt"
          bordered
          padding="md"
          style={{ flexDirection: rowDirection, gap: tokens.spacing.sm }}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={tokens.color.warning} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            {t('settings.security.note')}
          </Text>
        </Surface>
      </Card>

      {/* E. Team & roles placeholder */}
      <Card title={t('settings.section.team')}>
        <Text variant="caption" tone="muted">
          {t('settings.team.note')}
        </Text>
        <View style={{ gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }}>
          {ROLES.map((role, index) => (
            <View key={role.nameKey} style={{ gap: tokens.spacing.sm }}>
              {index > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label">{t(role.nameKey)}</Text>
                  <Text variant="caption" tone="muted">
                    {t(role.descKey)}
                  </Text>
                </View>
                <Badge tone="neutral" label={t('nav.soon')} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* F. System status placeholder */}
      <Card title={t('settings.section.status')}>
        {STATUS_ITEMS.map((item, index) => (
          <View key={item.labelKey}>
            {index > 0 ? <Divider /> : null}
            <View
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                }}
              >
                <Ionicons
                  name={item.ready ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={item.ready ? tokens.color.success : tokens.color.textMuted}
                />
                <Text variant="label">{t(item.labelKey)}</Text>
              </View>
              <Badge
                tone={item.ready ? 'success' : 'neutral'}
                label={item.ready ? t('settings.status.ready') : t('settings.status.notConnected')}
              />
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
