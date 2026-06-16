/**
 * Product detail route ("/products/[id]"). Reads the id param and renders the feature screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ProductDetailScreen } from '@/features/products/ProductDetailScreen';

export default function ProductDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen productId={id} />;
}
