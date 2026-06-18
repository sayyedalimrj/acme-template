/**
 * App font loading — Vazirmatn (OFL) today; IRANYekanX when licensed files are added.
 *
 * Drop IRANYekanX `.ttf` files into `assets/fonts/` and set `USE_IRANYEKANX` to true.
 * Persian is primary for the client app.
 */
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

/** Flip to true after adding licensed IRANYekanX files under `assets/fonts/`. */
export const USE_IRANYEKANX = false;

const vazirmatnFontMap = {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} as const;

/** Font map passed to `useFonts`. Extend with IRANYekanX when licensed assets are present. */
export const appFontMap = USE_IRANYEKANX
  ? ({
      // TODO: require licensed files, e.g. IRANYekanXRegular: require('../../assets/fonts/IRANYekanX-Regular.ttf'),
      ...vazirmatnFontMap,
    } as const)
  : vazirmatnFontMap;

export type AppFontFamily = keyof typeof appFontMap;

const WEB_FALLBACK_STACK =
  "'Vazirmatn', 'IRANYekanX', 'Vazir', 'IRANSansX', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** CSS font stack for <Text> on web (supports fallbacks). */
export function resolveTextFontFamily(fontsLoaded: boolean): string | undefined {
  if (Platform.OS !== 'web') {
    return fontsLoaded ? 'Vazirmatn_400Regular' : undefined;
  }
  return fontsLoaded ? `'Vazirmatn', ${WEB_FALLBACK_STACK}` : WEB_FALLBACK_STACK;
}

/**
 * Single font family for TextInput (comma stacks break RN TextInput on web).
 */
export function resolveInputFontFamily(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return Platform.OS === 'web' ? undefined : undefined;
  }
  if (Platform.OS === 'web') {
    return 'Vazirmatn';
  }
  return resolveFontFamilyForWeight(fontsLoaded, fontWeight);
}

/** Map RN fontWeight to the matching bundled face on native. */
export function resolveFontFamilyForWeight(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return undefined;
  }
  if (Platform.OS === 'web') {
    return 'Vazirmatn';
  }
  const w = typeof fontWeight === 'number' ? fontWeight : Number(fontWeight);
  if (w >= 700) return 'Vazirmatn_700Bold';
  if (w >= 600) return 'Vazirmatn_600SemiBold';
  if (w >= 500) return 'Vazirmatn_500Medium';
  return 'Vazirmatn_400Regular';
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
