/**
 * Active-site context for the http data source (mirrors the mock active-site holder).
 *
 * Site-scoped data adapters (products/orders/customers/dashboard) read the active site id here so
 * switching the active site changes the data — without threading a siteId through every call.
 */
let activeSiteId: string | null = null;

export function setActiveHttpSiteId(id: string | null): void {
  activeSiteId = id;
}

export function getActiveHttpSiteId(): string | null {
  return activeSiteId;
}
