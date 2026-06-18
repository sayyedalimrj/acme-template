/**
 * New product route ("/products/new"). Thin wrapper around the mock product create form.
 */
import React from 'react';

import { ProductCreateScreen } from '@/features/products/ProductCreateScreen';

export default function ProductCreateRoute(): React.JSX.Element {
  return <ProductCreateScreen />;
}
