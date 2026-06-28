/**
 * Product category service — reads WooCommerce categories synced for the active site.
 */
import { http, qs } from '@/services/httpClient';
import { getActiveHttpSiteId } from '@/adapters/http/httpActiveSite';
import type { ProductCategory } from '@/domain/types';

interface BackendCategory {
  external_id: string;
  name: string | null;
  slug: string | null;
  parent_external_id?: string | null;
}

function mapCategory(row: BackendCategory): ProductCategory {
  return {
    id: row.external_id,
    name: row.name ?? row.slug ?? row.external_id,
    slug: row.slug ?? row.external_id,
  };
}

export const categoryService = {
  async listCategories(siteId?: string): Promise<ProductCategory[]> {
    const id = siteId ?? getActiveHttpSiteId();
    if (!id) return [];
    const res = await http.get<{ items: BackendCategory[] }>(
      `/merchant/sites/${id}/categories${qs({ pageSize: 200 })}`,
    );
    return res.items.map(mapCategory);
  },
};
