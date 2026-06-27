/**
 * Plugin pairing credentials — shown once after starting a plugin connection.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Badge, Card, Surface, Text } from '@/components/ui';
import { getSiteStatus, type PluginConnectionStartResult } from '@/services/connectionApi';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

export interface PluginPairingCardProps {
  pairing: PluginConnectionStartResult;
  onConnected?: () => void;
}

function CopyRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.xs }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Surface variant="surfaceAlt" bordered padding="sm">
        <Text variant="label" selectable>
          {value}
        </Text>
      </Surface>
    </View>
  );
}

export function PluginPairingCard({ pairing, onConnected }: PluginPairingCardProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const [status, setStatus] = useState<string>('pending');
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await getSiteStatus(pairing.siteId);
        if (cancelled) return;
        setStatus(res.site.status);
        if (res.plugin?.status === 'connected' || res.site.status === 'connected') {
          setPolling(false);
          onConnected?.();
        }
      } catch {
        /* keep polling */
      }
    };
    void tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pairing.siteId, polling, onConnected]);

  return (
    <Card title={t('connectSite.plugin.pairingTitle')}>
      <Surface variant="surfaceAlt" bordered padding="md" style={{ gap: tokens.spacing.sm, marginBottom: tokens.spacing.md }}>
        <Text variant="body" tone="muted">
          {t('connectSite.plugin.pairingIntro')}
        </Text>
        <Badge tone="warning" label={t('connectSite.plugin.secretOnce')} />
      </Surface>
      <View style={{ gap: tokens.spacing.md }}>
        <CopyRow label={t('connectSite.plugin.backendUrl')} value={pairing.deliveryBaseUrl} />
        <CopyRow label={t('connectSite.plugin.siteId')} value={pairing.siteId} />
        <CopyRow label={t('connectSite.plugin.tenantId')} value={pairing.tenantId} />
        <CopyRow label={t('connectSite.plugin.signingSecret')} value={pairing.signingSecret} />
      </View>
      <View style={{ marginTop: tokens.spacing.md, gap: tokens.spacing.xs }}>
        <Text variant="caption" tone="muted">
          {t('connectSite.plugin.steps')}
        </Text>
        <Badge tone={status === 'connected' ? 'success' : 'warning'} label={`${t('connectSite.plugin.waiting')}: ${status}`} />
      </View>
    </Card>
  );
}
