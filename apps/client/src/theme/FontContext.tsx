/**
 * Font context — exposes the loaded Vazirmatn family to Text and mobile inputs.
 */
import React, { createContext, useContext, type ReactNode } from 'react';

import { useAppFonts } from './fonts';

export interface FontContextValue {
  fontsLoaded: boolean;
  fontFamily: string | undefined;
}

const FontContext = createContext<FontContextValue>({
  fontsLoaded: false,
  fontFamily: undefined,
});

export function FontProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const value = useAppFonts();
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useAppFont(): FontContextValue {
  return useContext(FontContext);
}
