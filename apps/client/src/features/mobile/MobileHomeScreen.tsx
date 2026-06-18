/**
 * MobileHomeScreen — the customer-facing mobile home.
 *
 * A calm, mobile-first home: friendly header (avatar, store name, notifications, support),
 * a dark hero site card (single, multi-site carousel, or an onboarding card when there is no
 * site), four quick actions, a "more features" entry, and a short recent-activity list. All
 * copy is customer-friendly — no technical platform terms. Mock-only; no backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { LoadingState, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSites } from '@/features/site/useSites';
import { useTheme } from '@/theme';
import type { SiteConnection } from '@/domain/types';

import {
  AnimatedSection,
  EmptySiteCard,
  HeroSiteCard,
  MiniActivityRow,
  MobileHeader,
  MobilePage,
  PressableScale,
  QuickActionCard,
  siteInitials,
} from './components';
import { QUICK_ACTIONS, RECENT_ACTIVITY, SITE_RENEWAL_KEYS, UNREAD } from './mobileMockData';
import { mobileColors, mobileMetrics, mobileShadow, mobileType } from './mobileTokens';

function SectionTitle({ title }: { title: string }): React.JSX.Element {
  const { isRTL } = useTheme();
  return (
    <Text
      style={{
        fontSize: mobileType.sectionSize,
        fontWeight: '700',
        color: mobileColors.text,
        textAlign: isRTL ? 'right' : 'left',
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

/** Horizontal, paged carousel of hero site cards with page dots. */
function SiteCarousel({
  sites,
  selectedIndex,
  onSelect,
  onPressSite,
  renewalFor,
}: {
  sites: SiteConnection[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onPressSite: (site: SiteConnection) => void;
  renewalFor: (site: SiteConnection) => string | undefined;
}): React.JSX.Element {
  const [pageWidth, setPageWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent): void => {
    setPageWidth(event.nativeEvent.layout.width);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (pageWidth <= 0) {
      return;
    }
    const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (index !== selectedIndex) {
      onSelect(index);
    }
  };

  return (
    <View onLayout={onLayout} style={{ gap: 12 }}>
      {pageWidth > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
        >
          {sites.map((site) => (
            <View key={site.id} style={{ width: pageWidth }}>
              <HeroSiteCard
                site={site}
                renewalLabel={renewalFor(site)}
                onPress={() => onPressSite(site)}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <HeroSiteCard
          site={sites[0]}
          renewalLabel={renewalFor(sites[0])}
          onPress={() => onPressSite(sites[0])}
        />
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {sites.map((site, index) => (
          <View
            key={site.id}
            style={{
              width: index === selectedIndex ? 18 : 7,
              height: 7,
              borderRadius: 4,
              backgroundColor:
                index === selectedIndex ? mobileColors.primary : mobileColors.mutedSoft,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function MoreEntryCard({ onPress }: { onPress: () => void }): React.JSX.Element {
  const t = useT();
  const { rowDirection, isRTL } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={t('home.more.title')}
      testID="home-more-entry"
      style={[
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 14,
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: mobileColors.card,
          padding: 16,
        },
        mobileShadow,
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: mobileColors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="apps-outline" size={22} color={mobileColors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{
            fontSize: mobileType.labelSize,
            fontWeight: '700',
            color: mobileColors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {t('home.more.title')}
        </Text>
        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: mobileColors.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {t('home.more.subtitle')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          height: 36,
          borderRadius: 9,
          backgroundColor: mobileColors.tile,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: mobileColors.primary }}>
          {t('home.more.cta')}
        </Text>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={15}
          color={mobileColors.primary}
        />
      </View>
    </PressableScale>
  );
}

export function MobileHomeScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const go = (href: string): void => router.navigate(href as never);
  const { data: sites, isPending } = useSites();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const siteList = sites ?? [];
  const hasSites = siteList.length > 0;
  const selectedSite = hasSites ? (siteList[selectedIndex] ?? siteList[0]) : undefined;

  const renewalFor = (site: SiteConnection): string | undefined => {
    const key = SITE_RENEWAL_KEYS[site.id];
    return key ? t(key) : undefined;
  };

  const headerName = selectedSite?.name ?? t('home.businessFallback');
  const headerInitials = selectedSite ? siteInitials(selectedSite.name) : '•';

  const header = (
    <MobileHeader
      greeting={t('home.greeting')}
      name={headerName}
      initials={headerInitials}
      unreadNotifications={UNREAD.notifications}
      unreadSupport={UNREAD.support}
      onPressNotifications={() => go('/notifications')}
      onPressSupport={() => go('/support')}
      notificationsLabel={t('notif.title')}
      supportLabel={t('csupport.title')}
    />
  );

  if (isPending) {
    return (
      <MobilePage testID="mobile-home-screen" header={header}>
        <View style={{ paddingHorizontal: mobileMetrics.screenPadding, paddingTop: 40 }}>
          <LoadingState />
        </View>
      </MobilePage>
    );
  }

  return (
    <MobilePage testID="mobile-home-screen" header={header}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 24 }}>
        {/* Hero / site state */}
        <AnimatedSection index={0}>
          {!hasSites ? (
            <EmptySiteCard
              onPrimary={() => go('/onboarding')}
              onSecondary={() => go('/connect-site')}
            />
          ) : siteList.length === 1 ? (
            <HeroSiteCard
              site={siteList[0]}
              renewalLabel={renewalFor(siteList[0])}
              onPress={() => go('/more')}
            />
          ) : (
            <SiteCarousel
              sites={siteList}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onPressSite={() => go('/more')}
              renewalFor={renewalFor}
            />
          )}
        </AnimatedSection>

        {/* Quick actions */}
        <AnimatedSection index={1}>
          <SectionTitle title={t('home.quick.title')} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {QUICK_ACTIONS.map((action) => (
              <View key={action.key} style={{ flex: 1, minWidth: 0 }}>
                <QuickActionCard
                  icon={action.icon}
                  label={t(action.labelKey)}
                  count={action.count}
                  onPress={() => go(action.href)}
                  testID={`quick-${action.key}`}
                />
              </View>
            ))}
          </View>
        </AnimatedSection>

        {/* More features entry */}
        <AnimatedSection index={2}>
          <MoreEntryCard onPress={() => go('/more')} />
        </AnimatedSection>

        {/* Short recent activity */}
        <AnimatedSection index={3}>
          <SectionTitle title={t('home.activity.title')} />
          <View
            style={[
              {
                borderRadius: mobileMetrics.cardRadius,
                backgroundColor: mobileColors.card,
                paddingHorizontal: 16,
                paddingVertical: 4,
              },
              mobileShadow,
            ]}
          >
            {RECENT_ACTIVITY.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? (
                  <View style={{ height: 1, backgroundColor: mobileColors.separator }} />
                ) : null}
                <MiniActivityRow
                  icon={item.icon}
                  tint={item.tint}
                  title={t(item.titleKey)}
                  caption={t(item.captionKey)}
                  onPress={() => go('/notifications')}
                />
              </View>
            ))}
          </View>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
