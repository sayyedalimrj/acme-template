/**
 * ProductImage — aspect-ratio-safe product thumbnail with loading/error fallbacks.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import { useTheme } from '@/theme';

export type ProductImageFit = 'contain' | 'cover';

export interface ProductImageProps {
  uri?: string | null;
  alt?: string;
  width: number | `${number}%`;
  height: number;
  fit?: ProductImageFit;
  borderRadius?: number;
  testID?: string;
  style?: StyleProp<ImageStyle>;
}

export function ProductImage({
  uri,
  alt,
  width,
  height,
  fit = 'contain',
  borderRadius = 12,
  testID,
  style,
}: ProductImageProps): React.JSX.Element {
  const { tokens } = useTheme();
  const [loading, setLoading] = useState(Boolean(uri));
  const [broken, setBroken] = useState(false);

  const showPlaceholder = !uri || broken;

  return (
    <View
      testID={testID}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: tokens.color.surfaceAlt,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {showPlaceholder ? (
        <Ionicons
          name="image-outline"
          size={Math.min(Number(height) * 0.35, 28)}
          color={tokens.color.textMuted}
        />
      ) : (
        <>
          {loading ? (
            <View
              style={{
                ...StyleSheet.absoluteFill,
                backgroundColor: tokens.color.surfaceAlt,
              }}
            />
          ) : null}
          <Image
            source={{ uri }}
            accessibilityLabel={alt}
            accessibilityIgnoresInvertColors
            resizeMode={fit === 'cover' ? 'cover' : 'contain'}
            style={[{ width: '100%', height: '100%' }, style]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setBroken(true);
              setLoading(false);
            }}
          />
        </>
      )}
    </View>
  );
}
