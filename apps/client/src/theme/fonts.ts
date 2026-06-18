/**
 * App font loading (Vazirmatn OFL via @expo-google-fonts).
 *
 * Persian is primary for the client app. Vazirmatn ships as a stand-in until a licensed
 * IRANYekanX asset is provided; swap the loaded families here when that file is available.
 */
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

/** Font map passed to `useFonts`. */
export const appFontMap = {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} as const;

export type AppFontFamily = keyof typeof appFontMap;

/** Primary UI font on native (after expo-font load). Web falls back to the CSS stack. */
export const NATIVE_FONT_FAMILY: AppFontFamily = 'Vazirmatn_400Regular';

const WEB_FONT_STACK =
  "'Vazirmatn', 'B Yekan', 'IRANYekanX', 'Vazir', 'IRANSansX', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Resolved font family for Text and mobile inputs on the current platform. */
export function resolveAppFontFamily(fontsLoaded: boolean): string | undefined {
  if (Platform.OS === 'web') {
    return fontsLoaded ? `'Vazirmatn', ${WEB_FONT_STACK}` : WEB_FONT_STACK;
  }
  return fontsLoaded ? NATIVE_FONT_FAMILY : undefined;
}

/** Map RN fontWeight to the matching Vazirmatn face when fonts are loaded. */
export function resolveFontFamilyForWeight(
  fontsLoaded: boolean,
  fontWeight?: string | number,
): string | undefined {
  if (!fontsLoaded) {
    return resolveAppFontFamily(false);
  }
  if (Platform.OS === 'web') {
    return resolveAppFontFamily(true);
  }
  const w = typeof fontWeight === 'number' ? fontWeight : Number(fontWeight);
  if (w >= 700) return 'Vazirmatn_700Bold';
  if (w >= 600) return 'Vazirmatn_600SemiBold';
  if (w >= 500) return 'Vazirmatn_500Medium';
  return 'Vazirmatn_400Regular';
}

export function useAppFonts(): { fontsLoaded: boolean; fontFamily: string | undefined } {
  const [fontsLoaded] = useFonts(appFontMap);
  return {
    fontsLoaded,
    fontFamily: resolveAppFontFamily(fontsLoaded),
  };
}
