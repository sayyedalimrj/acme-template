/**
 * App font loading — IRANYekanX Pro (Farsi numerals) bundled from licensed assets.
 *
 * Source: `IRANYekanX Pro.rar` in the repo root (FontIran license — see assets/fonts/iranyekan/FontLicense.txt).
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
  "'IRANYekanX', 'Vazirmatn', 'Vazir', 'IRANSansX', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** CSS font stack for <Text> on web (supports fallbacks). */
export function resolveTextFontFamily(fontsLoaded: boolean): string | undefined {
  if (Platform.OS !== 'web') {
    return fontsLoaded ? 'IRANYekanXRegular' : undefined;
  }
  return fontsLoaded ? `'IRANYekanX', ${WEB_FALLBACK_STACK}` : WEB_FALLBACK_STACK;
}

/** Single font family for TextInput (comma stacks break RN TextInput on web). */
export function resolveInputFontFamily(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return undefined;
  }
  if (Platform.OS === 'web') {
    return 'IRANYekanX';
  }
  return resolveFontFamilyForWeight(fontsLoaded, fontWeight);
}

/** Map RN fontWeight to the matching bundled IRANYekanX face on native. */
export function resolveFontFamilyForWeight(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return undefined;
  }
  if (Platform.OS === 'web') {
    return 'IRANYekanX';
  }
  const w = typeof fontWeight === 'number' ? fontWeight : Number(fontWeight);
  if (w >= 700) return 'IRANYekanXBold';
  if (w >= 600) return 'IRANYekanXSemiBold';
  if (w >= 500) return 'IRANYekanXMedium';
  return 'IRANYekanXRegular';
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
