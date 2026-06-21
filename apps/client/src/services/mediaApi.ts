/**
 * Product media API (http). Manage a WooCommerce product's full image gallery from the app:
 * list all images, replace/reorder/set-cover/remove (ordered array), upload a new image, and add
 * by URL. Secrets never touch the frontend — the backend talks to WooCommerce/WordPress.
 */
import { http } from '@/services/httpClient';

export interface ProductMediaImage {
  id: string | null;
  src: string;
  alt: string | null;
  position: number;
  isCover: boolean;
}

/** A gallery entry reference for the replace/reorder call (existing media id OR a hosted URL). */
export interface MediaRef {
  id?: string;
  src?: string;
}

const base = (siteId: string): string => `/merchant/sites/${encodeURIComponent(siteId)}`;

export function getProductMedia(
  siteId: string,
  productId: string,
): Promise<{ images: ProductMediaImage[] }> {
  return http.get(`${base(siteId)}/products/${encodeURIComponent(productId)}/media`);
}

/** Replace the gallery with an ordered list (first = cover). Used for reorder/cover/remove/add. */
export function setProductMedia(
  siteId: string,
  productId: string,
  images: MediaRef[],
): Promise<{ images: ProductMediaImage[] }> {
  return http.patch(`${base(siteId)}/products/${encodeURIComponent(productId)}/media`, { images });
}

/** Upload an image binary (base64) to the store media library; returns its id + URL. */
export function uploadMedia(
  siteId: string,
  file: { filename: string; contentType: string; dataBase64: string },
): Promise<{ media: { id: string; src: string; alt: string | null } }> {
  return http.post(`${base(siteId)}/media`, file);
}

/** Convert a gallery image list into the ordered ref payload (prefer media id, else URL). */
export function toMediaRefs(images: ReadonlyArray<ProductMediaImage>): MediaRef[] {
  return images.map((img) => (img.id ? { id: img.id } : { src: img.src }));
}
