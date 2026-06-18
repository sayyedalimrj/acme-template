/**
 * SiteCarousel — paged hero-site carousel that works with touch AND a mouse.
 *
 * The previous version relied on a native paging ScrollView, which can't be dragged with a
 * mouse on the web and whose page dots were not interactive. This version drives an animated
 * track with a PanResponder (react-native-web maps mouse events onto the responder system, so
 * dragging with a mouse behaves like a touch swipe), plus:
 *   - tappable page dots (jump to any store),
 *   - prev/next arrow buttons (mouse-friendly on desktop),
 *   - snap-to-page on release.
 *
 * It is a controlled component: the parent owns `selectedIndex` and reacts to `onSelect`
 * (which also switches the active store so the rest of the dashboard updates).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { useTheme } from '@/theme';
import type { SiteConnection } from '@/domain/types';

import { useMobileColors } from '../mobileTokens';
import { easing, motionDuration, useReducedMotion } from '../motion';
import { HeroSiteCard } from './HeroSiteCard';

/** Horizontal gap between adjacent hero cards. */
const PAGE_GAP = 14;

export interface SiteCarouselProps {
  sites: SiteConnection[];
  selectedIndex: number;
  /** Called when the visible page changes (swipe, arrow, or dot). */
  onSelect: (index: number) => void;
  /** Called when a hero card itself is pressed (e.g. open plans). */
  onPressSite: (site: SiteConnection) => void;
  renewalFor: (site: SiteConnection) => string | undefined;
  /** Accessibility labels for the arrows. */
  prevLabel: string;
  nextLabel: string;
}

export function SiteCarousel({
  sites,
  selectedIndex,
  onSelect,
  onPressSite,
  renewalFor,
  prevLabel,
  nextLabel,
}: SiteCarouselProps): React.JSX.Element {
  const colors = useMobileColors();
  const { isRTL } = useTheme();
  const reduced = useReducedMotion();

  const [pageWidth, setPageWidth] = useState(0);
  // Lazy state (not a ref) so we never touch `.current` during render.
  const [translateX] = useState(() => new Animated.Value(0));

  const count = sites.length;
  const dirSign = isRTL ? -1 : 1;

  const animateToIndex = useCallback(
    (index: number, animated = true): void => {
      const to = -index * (pageWidth + PAGE_GAP) * dirSign;
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
    [pageWidth, dirSign, reduced, translateX],
  );

  // Keep the track aligned with the controlled index, the measured width, and direction.
  useEffect(() => {
    animateToIndex(selectedIndex);
  }, [selectedIndex, animateToIndex]);

  const goTo = useCallback(
    (rawIndex: number): void => {
      const clamped = Math.max(0, Math.min(count - 1, rawIndex));
      animateToIndex(clamped);
      if (clamped !== selectedIndex) {
        onSelect(clamped);
      }
    },
    [count, selectedIndex, animateToIndex, onSelect],
  );

  // Rebuilt whenever the captured values change so gesture math always uses fresh state.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only claim clearly-horizontal drags so taps still reach the hero card.
        onMoveShouldSetPanResponder: (_evt, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_evt, g) => {
          const base = -selectedIndex * (pageWidth + PAGE_GAP) * dirSign;
          translateX.setValue(base + g.dx);
        },
        onPanResponderRelease: (_evt, g) => {
          const threshold = Math.max(40, pageWidth * 0.22);
          const movedPages = -Math.sign(g.dx) * dirSign;
          let target = selectedIndex;
          if (Math.abs(g.dx) > threshold || Math.abs(g.vx) > 0.35) {
            target = selectedIndex + movedPages;
          }
          target = Math.max(0, Math.min(count - 1, target));
          const to = -target * (pageWidth + PAGE_GAP) * dirSign;
          if (reduced) {
            translateX.setValue(to);
          } else {
            Animated.timing(translateX, {
              toValue: to,
              duration: motionDuration.normal,
              easing: easing.standard,
              useNativeDriver: true,
            }).start();
          }
          if (target !== selectedIndex) {
            onSelect(target);
          }
        },
      }),
    [selectedIndex, pageWidth, dirSign, count, reduced, translateX, onSelect],
  );

  const onLayout = (event: LayoutChangeEvent): void => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && w !== pageWidth) {
      setPageWidth(w);
    }
  };

  // Arrow chevrons point logically (prev = toward index 0).
  const prevIcon = isRTL ? 'chevron-forward' : 'chevron-back';
  const nextIcon = isRTL ? 'chevron-back' : 'chevron-forward';
  const atStart = selectedIndex <= 0;
  const atEnd = selectedIndex >= count - 1;

  return (
    <View style={{ gap: 12 }}>
      <View onLayout={onLayout} style={{ overflow: 'hidden' }}>
        {pageWidth > 0 ? (
          <Animated.View
            // The PanResponder makes mouse drag behave like a touch swipe (RNW maps mouse
            // events onto the responder system).
            {...panResponder.panHandlers}
            style={{ flexDirection: 'row', transform: [{ translateX }] }}
          >
            {sites.map((site, index) => (
              <View
                key={site.id}
                style={{
                  width: pageWidth,
                  marginRight: index === sites.length - 1 ? 0 : PAGE_GAP,
                }}
              >
                <HeroSiteCard
                  site={site}
                  renewalLabel={renewalFor(site)}
                  onPress={() => onPressSite(site)}
                />
              </View>
            ))}
          </Animated.View>
        ) : (
          <HeroSiteCard
            site={sites[0]}
            renewalLabel={renewalFor(sites[0])}
            onPress={() => onPressSite(sites[0])}
          />
        )}
      </View>

      {/* Dots + arrows row */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={prevLabel}
          accessibilityState={{ disabled: atStart }}
          testID="site-carousel-prev"
          disabled={atStart}
          onPress={() => goTo(selectedIndex - 1)}
          style={({ pressed }) => ({
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.tile,
            opacity: atStart ? 0.35 : pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name={prevIcon} size={16} color={colors.text} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {sites.map((site, index) => {
            const active = index === selectedIndex;
            return (
              <Pressable
                key={site.id}
                accessibilityRole="button"
                accessibilityLabel={site.name}
                accessibilityState={{ selected: active }}
                testID={`site-dot-${index}`}
                onPress={() => goTo(index)}
                hitSlop={8}
                style={{
                  width: active ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: active ? colors.primary : colors.mutedSoft,
                }}
              />
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          accessibilityState={{ disabled: atEnd }}
          testID="site-carousel-next"
          disabled={atEnd}
          onPress={() => goTo(selectedIndex + 1)}
          style={({ pressed }) => ({
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.tile,
            opacity: atEnd ? 0.35 : pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name={nextIcon} size={16} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
