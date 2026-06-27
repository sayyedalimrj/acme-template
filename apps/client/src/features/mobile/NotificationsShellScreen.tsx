/**
 * Notifications screen — live API when backend is configured; mock shell otherwise.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { EmptyState, Text } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import {
  AnimatedSection,
  MiniActivityRow,
  MobilePage,
  MobileSubHeader,
} from '@/features/mobile/components';
import { NOTIFICATION_GROUPS } from '@/features/mobile/mobileMockData';
import { mobileMetrics, mobileType, useMobileColors, useMobileShadow } from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { notificationService } from '@/services/notificationService';
import { useTheme } from '@/theme';

export function NotificationsShellScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const { isRTL } = useTheme();
  const live = isApiConfigured();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['merchant', 'notifications'],
    queryFn: () => notificationService.list(),
    enabled: live,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant', 'notifications'] });
    },
  });

  const onBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.navigate('/' as never);
  };

  return (
    <MobilePage
      testID="notifications-screen"
      header={
        <MobileSubHeader title={t('notif.title')} onBack={onBack} backLabel={t('mobile.back')} />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 20 }}>
        {live ? (
          listQuery.isPending ? (
            <Text tone="muted">{t('common.loading')}</Text>
          ) : (listQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState testID="notifications-empty" icon="notifications-outline" title={t('notif.empty')} fill={false} />
          ) : (
            <AnimatedSection index={0}>
              <View
                style={[
                  {
                    borderRadius: mobileMetrics.cardRadius,
                    backgroundColor: colors.card,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                  },
                  shadow,
                ]}
              >
                {(listQuery.data?.items ?? []).map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? (
                      <View style={{ height: 1, backgroundColor: colors.separator }} />
                    ) : null}
                    <MiniActivityRow
                      icon="notifications-outline"
                      tint={item.read ? 'muted' : 'primary'}
                      title={item.title}
                      caption={`${item.body} · ${fmt.date(item.createdAt)}`}
                      unread={!item.read}
                      onPress={() => {
                        if (!item.read) markRead.mutate(item.id);
                      }}
                      testID={`notif-live-${item.id}`}
                    />
                  </View>
                ))}
              </View>
            </AnimatedSection>
          )
        ) : (
          NOTIFICATION_GROUPS.map((group, groupIndex) => (
            <AnimatedSection key={group.key} index={groupIndex}>
              <View style={{ gap: 12 }}>
                <Text
                  style={{
                    fontSize: mobileType.labelSize,
                    fontWeight: '700',
                    color: colors.textSecondary,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {t(group.titleKey)}
                </Text>
                <View
                  style={[
                    {
                      borderRadius: mobileMetrics.cardRadius,
                      backgroundColor: colors.card,
                      paddingHorizontal: 16,
                      paddingVertical: 4,
                    },
                    shadow,
                  ]}
                >
                  {group.items.map((item, index) => (
                    <View key={item.id}>
                      {index > 0 ? (
                        <View style={{ height: 1, backgroundColor: colors.separator }} />
                      ) : null}
                      <MiniActivityRow
                        icon={item.icon}
                        tint={item.tint}
                        title={t(item.titleKey)}
                        caption={t(item.captionKey)}
                        unread={item.unread}
                        testID={`notif-${item.id}`}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </AnimatedSection>
          ))
        )}
      </View>
    </MobilePage>
  );
}
