/**
 * App font loading — IRANYekanX Pro (Farsi numerals) bundled from licensed assets.
 *
 * Source: `IRANYekanX Pro.rar` in the repo root (FontIran license — see assets/fonts/iranyekan/FontLicense.txt).
 *
 * IMPORTANT (web): `expo-font` registers each face under a CSS `font-family` equal to its
 * key in `appFontMap` (e.g. `IRANYekanXRegular`, `IRANYekanXBold`). There is no combined
 * `IRANYekanX` family on web, so every resolver must reference the actual per-weight family
 * names — on web exactly like on native — otherwise the browser can't find the font and
 * silently falls back to a system font.
 */
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

export const appFontMap = {
  IRANYekanXRegular: require('../../assets/fonts/iranyekan/IRANYekanXFaNum-Regular.ttf'),
  IRANYekanXMedium: require('../../assets/fonts/iranyekan/IRANYekanXFaNum-Medium.ttf'),
  IRANYekanXSemiBold: require('../../assets/fonts/iranyekan/IRANYekanXFaNum-DemiBold.ttf'),
  IRANYekanXBold: require('../../assets/fonts/iranyekan/IRANYekanXFaNum-Bold.ttf'),
} as const;

export type AppFontFamily = keyof typeof appFontMap;

const WEB_FALLBACK_STACK =
  "'Vazirmatn', 'Vazir', 'IRANSansX', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/**
 * Map an RN fontWeight to the matching bundled IRANYekanX face. The returned name is also the
 * CSS `font-family` that `expo-font` registers for that face on web.
 */
function faceForWeight(fontWeight?: string | number): AppFontFamily {
  const w = typeof fontWeight === 'number' ? fontWeight : Number(fontWeight);
  if (w >= 700) return 'IRANYekanXBold';
  if (w >= 600) return 'IRANYekanXSemiBold';
  if (w >= 500) return 'IRANYekanXMedium';
  return 'IRANYekanXRegular';
}

/** CSS font stack for <Text>. On web the loaded face comes first, then graceful fallbacks. */
export function resolveTextFontFamily(fontsLoaded: boolean): string | undefined {
  if (!fontsLoaded) {
    return Platform.OS === 'web' ? WEB_FALLBACK_STACK : undefined;
  }
  if (Platform.OS === 'web') {
    return `'IRANYekanXRegular', ${WEB_FALLBACK_STACK}`;
  }
  return 'IRANYekanXRegular';
}

/** Single font family for TextInput (comma stacks break RN TextInput on web). */
export function resolveInputFontFamily(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return undefined;
  }
  // Web and native both reference the per-weight family registered by expo-font.
  return faceForWeight(fontWeight);
}

/** Map RN fontWeight to the matching bundled IRANYekanX face (web + native). */
export function resolveFontFamilyForWeight(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return Platform.OS === 'web' ? WEB_FALLBACK_STACK : undefined;
  }
  const face = faceForWeight(fontWeight);
  if (Platform.OS === 'web') {
    return `'${face}', ${WEB_FALLBACK_STACK}`;
  }
  return face;
}

/** @deprecated Use resolveTextFontFamily or resolveInputFontFamily. */
export function resolveAppFontFamily(fontsLoaded: boolean): string | undefined {
  return resolveTextFontFamily(fontsLoaded);
}

export function useAppFonts(): { fontsLoaded: boolean; fontFamily: string | undefined } {
  const [fontsLoaded] = useFonts(appFontMap);
  return {
    fontsLoaded,
    fontFamily: resolveTextFontFamily(fontsLoaded),
  };
}
