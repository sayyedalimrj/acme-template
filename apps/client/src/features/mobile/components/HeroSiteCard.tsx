/**
 * HeroSiteCard — the dark hero site/store card.
 *
 * Shows the store name, a friendly website label, the customer status pill, and the renewal
 * date, with a logo placeholder and a "check status" CTA. No technical terms. Pressing the card
 * or CTA triggers `onPress`. Designed to sit near the top of the home screen; used standalone
 * or inside a carousel (fixed `width`).
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, type DimensionValue } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SiteConnection } from '@/domain/types';

import { mobileMetrics, useMobileColors, useMobileShadow, useMobileType } from '../mobileTokens';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { PressableScale } from './PressableScale';

/** Display the site host without the protocol (customer-friendly). */
function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Two-letter initials from the store name. */
export function siteInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '•';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export interface HeroSiteCardProps {
  site: SiteConnection;
  renewalLabel?: string;
  onPress: () => void;
  width?: DimensionValue;
  /** Whether this store is the currently-selected active store (its data is shown app-wide). */
  isActive?: boolean;
  /** Called when the user taps "set as active" (only shown when the store is not active). */
  onActivate?: () => void;
}

export function HeroSiteCard({
  site,
  renewalLabel,
  onPress,
  width = '100%',
  isActive = false,
  onActivate,
}: HeroSiteCardProps): React.JSX.Element {
  const t = useT();
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const type = useMobileType();
  const { rowDirection, isRTL } = useTheme();

  return (
    // Root is a plain View (not a Pressable) so the inner "set active" / "check status" buttons
    // are not nested inside another button — nesting pressables triggers a DOM warning on web and
    // can swallow taps. The carousel's PanResponder still handles swiping over this View.
    <View
      accessibilityLabel={site.name}
      style={[
        {
          width,
          minHeight: mobileMetrics.heroHeight,
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: colors.hero,
          padding: 20,
          justifyContent: 'space-between',
          overflow: 'hidden',
        },
        shadow,
      ]}
    >
      {/* Soft decorative layer for depth (no gradient dependency). */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -50,
          right: isRTL ? undefined : -40,
          left: isRTL ? -40 : undefined,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: colors.heroLayer,
        }}
      />

      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: colors.heroLayer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.heroText, fontWeight: '700', fontSize: 16 }}>
            {siteInitials(site.name)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: type.heroTitleSize,
              fontWeight: '700',
              color: colors.heroText,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {site.name}
          </Text>
          <Text
            style={{
              fontSize: type.heroLabelSize,
              color: colors.heroTextSoft,
              writingDirection: 'ltr',
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {websiteLabel(site.url)}
          </Text>
        </View>
        <CustomerStatusBadge status={site.status} onDark />
      </View>

      <View style={{ gap: 12 }}>
        {/* Active-store control: a clear "Active store" chip when selected, otherwise a tappable
            "Set as active" button that switches the whole dashboard to this store. */}
        {isActive ? (
          <View
            testID="hero-active-indicator"
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              gap: 6,
              paddingHorizontal: 12,
              height: 32,
              borderRadius: 999,
              backgroundColor: 'rgba(43,167,112,0.22)',
            }}
          >
            <Ionicons name="checkmark-circle" size={16} color="#7CE3B0" />
            <Text style={{ color: colors.heroText, fontWeight: '700', fontSize: 12 }}>
              {t('home.hero.active')}
            </Text>
          </View>
        ) : onActivate ? (
          <PressableScale
            onPress={onActivate}
            testID="hero-activate"
            accessibilityLabel={t('home.hero.activate')}
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              gap: 6,
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.heroLayer,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.28)',
            }}
          >
            <Ionicons name="power" size={15} color={colors.heroText} />
            <Text style={{ color: colors.heroText, fontWeight: '700', fontSize: 13 }}>
              {t('home.hero.activate')}
            </Text>
          </PressableScale>
        ) : null}

        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ minWidth: 0 }}>
            <Text style={{ fontSize: 12, color: colors.heroTextSoft }}>
              {t('home.hero.renewal')}
            </Text>
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: colors.heroText }}
              numberOfLines={1}
            >
              {renewalLabel ?? '—'}
            </Text>
          </View>

          <PressableScale
            onPress={onPress}
            testID="hero-view-status"
            accessibilityLabel={t('home.hero.viewSite')}
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              height: 40,
              borderRadius: 10,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>
              {t('home.hero.viewSite')}
            </Text>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color={colors.onPrimary}
            />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
