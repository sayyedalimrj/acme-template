/**
 * Shared active-site state for the mock layer.
 *
 * The mock SiteAdapter owns the active-site selection, but the data adapters (products,
 * orders, customers, dashboard) need to know which site is active so they can return a
 * per-store VIEW of the fixtures — otherwise switching stores would change the query cache
 * key without changing what the user actually sees.
 *
 * This is mock-only, in-memory state. Real data is isolated server-side per tenant/site.
 */
import { DEFAULT_ACTIVE_SITE_ID } from '@/mock/data/sites';

let activeSiteId: string | null = DEFAULT_ACTIVE_SITE_ID;

export function getActiveMockSiteId(): string | null {
  return activeSiteId;
}

export function setActiveMockSiteId(siteId: string | null): void {
  activeSiteId = siteId;
}

/** Test-only: restore the default active site between tests. */
export function resetActiveMockSiteId(): void {
  activeSiteId = DEFAULT_ACTIVE_SITE_ID;
}

/** Stable small seed derived from the (active) site id; 0 for the primary/default store. */
export function activeSiteSeed(): number {
  const id = activeSiteId;
  if (!id || id === DEFAULT_ACTIVE_SITE_ID) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997;
  }
  // Never 0 for a non-default store, so its view is always distinct from the primary.
  return (hash % 96) + 1;
}

/**
 * Return a deterministic per-store VIEW of a fixture list.
 *
 * The primary/default store sees the full list unchanged. Other stores see a rotated +
 * trimmed subset (stable per store) so each store clearly shows different data. No records
 * are invented — it is a deterministic projection of the shared fixtures.
 */
export function siteScopedView<T>(items: readonly T[]): T[] {
  const seed = activeSiteSeed();
  if (seed === 0 || items.length <= 1) {
    return items.slice();
  }
  const rotation = seed % items.length;
  const rotated = [...items.slice(rotation), ...items.slice(0, rotation)];
  // Trim a deterministic amount (keep at least ~60%) so the count also differs per store.
  const keep = Math.max(1, items.length - (seed % Math.max(1, Math.ceil(items.length / 3))));
  return rotated.slice(0, keep);
}
