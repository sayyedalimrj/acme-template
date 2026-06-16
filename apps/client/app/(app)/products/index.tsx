/**
 * Products route ("/products"). Thin wrapper around the Products list feature screen.
 */
import React from 'react';

import { ProductListScreen } from '@/features/products/ProductListScreen';

export default function ProductsRoute(): React.JSX.Element {
  return <ProductListScreen />;
}
