/**
 * Product edit route ("/products/edit/[id]"). Reads the id param and renders the edit screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ProductEditScreen } from '@/features/products/ProductEditScreen';

export default function ProductEditRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductEditScreen productId={id} />;
}
