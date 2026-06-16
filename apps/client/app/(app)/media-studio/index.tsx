/**
 * AI Product Media Studio route ("/media-studio"). Reads an optional `productId` query param
 * (e.g. from a product detail link) to preselect a product.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { MediaStudioScreen } from '@/features/media-studio/MediaStudioScreen';

export default function MediaStudioRoute(): React.JSX.Element {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  return <MediaStudioScreen initialProductId={productId} />;
}
