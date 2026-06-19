/**
 * SiteCarousel — paged hero-site carousel that works with touch AND a mouse.
 *
 * Driven by an animated track + PanResponder, so dragging with a mouse on the web behaves like
 * a touch swipe (react-native-web maps mouse events onto the responder system). Paging is
 * PHYSICAL (drag left → next page), which behaves identically in RTL and LTR — no direction
 * math to get wrong. Page dots are tappable; there are no arrow buttons (kept clean).
 *
 * The last page is always a distinct "add a store" card. The component is uncontrolled: it
 * owns the visible page and only notifies the parent when a STORE page settles (so the parent
 * can switch the active store) or when the add card is pressed.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import type { SiteConnection } from '@/domain/types';

import { mobileMetrics, useMobileColors, useMobileType } from '../mobileTokens';
import { easing, motionDuration, useReducedMotion } from '../motion';
import { HeroSiteCard } from './HeroSiteCard';

const PAGE_GAP = 14;

export interface SiteCarouselProps {
  sites: SiteConnection[];
  /** Store shown first (usually the active store). */
  initialActiveSiteId?: string;
  /** Called when a STORE page settles (swipe/dot) so the parent can switch the active store. */
  onSelectSite: (siteId: string) => void;
  /** Called when a hero card is pressed (e.g. open plans). */
  onPressSite: (site: SiteConnection) => void;
  /** Called when the "add a store" card is pressed. */
  onPressAdd: () => void;
  renewalFor: (site: SiteConnection) => string | undefined;
}

function AddSiteCard({ onPress }: { onPress: () => void }): React.JSX.Element {
  const colors = useMobileColors();
  const type = useMobileType();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      testID="site-add-card"
      onPress={onPress}
      style={({ pressed }) => ({
        height: mobileMetrics.heroHeight,
        borderRadius: mobileMetrics.heroRadius,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </View>
      <Text
        style={{
          fontSize: type.heroTitleSize,
          fontWeight: '700',
          color: colors.primary,
          textAlign: 'center',
        }}
      >
        {t('home.hero.addSite')}
      </Text>
      <Text
        style={{
          fontSize: type.captionSize,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {t('home.hero.addSiteSubtitle')}
      </Text>
    </Pressable>
  );
}

export function SiteCarousel({
  sites,
  initialActiveSiteId,
  onSelectSite,
  onPressSite,
  onPressAdd,
  renewalFor,
}: SiteCarouselProps): React.JSX.Element {
  const colors = useMobileColors();
  const reduced = useReducedMotion();

  const pageCount = sites.length + 1; // stores + the add card
  const initialIndex = Math.max(
    0,
    sites.findIndex((s) => s.id === initialActiveSiteId),
  );

  const [page, setPage] = useState(initialIndex);
  const [pageWidth, setPageWidth] = useState(0);
  const [translateX] = useState(() => new Animated.Value(0));

  const animateTo = useCallback(
    (index: number, animated = true): void => {
      const to = -index * (pageWidth + PAGE_GAP);
      if (!animated || reduced || pageWidth === 0) {
        translateX.setValue(to);
        return;
      }
      Animated.timing(translateX, {
        toValue: to,
        duration: motionDuration.normal,
        easing: easing.standard,
        useNativeDriver: true,
      }).start();
    },
    [pageWidth, reduced, translateX],
  );

  const settleOn = useCallback(
    (next: number): void => {
      const clamped = Math.max(0, Math.min(pageCount - 1, next));
      setPage(clamped);
      animateTo(clamped);
      // Notify only for STORE pages (the last page is the add card).
      if (clamped < sites.length) {
        const site = sites[clamped];
        if (site) {
          onSelectSite(site.id);
        }
      }
    },
    [pageCount, animateTo, sites, onSelectSite],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_evt, g) => {
          translateX.setValue(-page * (pageWidth + PAGE_GAP) + g.dx);
        },
        onPanResponderRelease: (_evt, g) => {
          const threshold = Math.max(40, pageWidth * 0.22);
          // Physical paging: drag left (dx < 0) → next page; drag right → previous page.
          let next = page;
          if (g.dx < -threshold || g.vx < -0.35) {
            next = page + 1;
          } else if (g.dx > threshold || g.vx > 0.35) {
            next = page - 1;
          }
          settleOn(next);
        },
      }),
    [page, pageWidth, translateX, settleOn],
  );

  const onLayout = (event: LayoutChangeEvent): void => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && w !== pageWidth) {
      setPageWidth(w);
      // Re-align to the current page at the new width.
      translateX.setValue(-page * (w + PAGE_GAP));
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View onLayout={onLayout} style={{ overflow: 'hidden' }}>
        {pageWidth > 0 ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={{ flexDirection: 'row', transform: [{ translateX }] }}
          >
            {sites.map((site) => (
              <View key={site.id} style={{ width: pageWidth, marginRight: PAGE_GAP }}>
                <HeroSiteCard
                  site={site}
                  renewalLabel={renewalFor(site)}
                  onPress={() => onPressSite(site)}
                />
              </View>
            ))}
            <View style={{ width: pageWidth }}>
              <AddSiteCard onPress={onPressAdd} />
            </View>
          </Animated.View>
        ) : (
          <HeroSiteCard
            site={sites[0]}
            renewalLabel={renewalFor(sites[0])}
            onPress={() => onPressSite(sites[0])}
          />
        )}
      </View>

      {/* Tappable page dots (no arrows). */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        {Array.from({ length: pageCount }).map((_, index) => {
          const active = index === page;
          const isAdd = index === sites.length;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              testID={`site-dot-${index}`}
              onPress={() => settleOn(index)}
              hitSlop={8}
              style={{
                width: active ? 18 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: active
                  ? isAdd
                    ? colors.primary
                    : colors.primary
                  : colors.mutedSoft,
                opacity: isAdd && !active ? 0.6 : 1,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
