/**
 * Product service — thin wrapper over the active ProductAdapter (read-only in the MVP).
 */
import { getAdapters } from '@/adapters';
import type {
  Paged,
  Product,
  ProductCreateInput,
  ProductListQuery,
  ProductUpdateInput,
} from '@/domain/types';

export const productService = {
  listProducts(query?: ProductListQuery): Promise<Paged<Product>> {
    return getAdapters().products.listProducts(query);
  },
  getProduct(id: string): Promise<Product> {
    return getAdapters().products.getProduct(id);
  },
  updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
    return getAdapters().products.updateProduct(id, input);
  },
  createProduct(input: ProductCreateInput): Promise<Product> {
    return getAdapters().products.createProduct(input);
  },
};
