/**
 * Future HTTP route contracts (backend skeleton).
 *
 * TYPES + DESCRIPTORS ONLY. There is NO HTTP server, NO router, and NO request handling in
 * this PR. This file documents the intended endpoints, their required permission, and a
 * one-line purpose, so the client and future server share one source of truth. See
 * `architecture.md` and `security-model.md`.
 */
import type { PermissionAction } from '../domain/permission';

/** HTTP methods used by the future API. */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** A documented route contract. */
export interface RouteContract {
  method: HttpMethod;
  /** Path template with `:param` placeholders. */
  path: string;
  /** Safe, human-readable description of the endpoint's purpose. */
  description: string;
  /** Permission required to call it (RBAC placeholder). */
  requiredPermission: PermissionAction;
  /** True for endpoints reserved for a later phase (not built yet). */
  futureOnly?: boolean;
}

/**
 * The planned route surface. Documentation/contract only — nothing here is served.
 * Mutations and write paths are intentionally absent from this skeleton.
 */
export const ROUTE_CONTRACTS: readonly RouteContract[] = [
  {
    method: 'POST',
    path: '/tenants/:tenantId/sites',
    description: 'Create a site under a tenant (frontend-safe metadata only; no credentials).',
    requiredPermission: 'site.create',
  },
  {
    method: 'GET',
    path: '/tenants/:tenantId/sites',
    description: 'List sites for a tenant.',
    requiredPermission: 'site.read',
  },
  {
    method: 'POST',
    path: '/sites/:siteId/connection/start',
    description: 'Begin a secure connection flow (server-side; client gets a reference only).',
    requiredPermission: 'site.connect',
  },
  {
    method: 'POST',
    path: '/sites/:siteId/connection/verify',
    description: 'Verify a connection flow / companion-plugin handshake (server-side).',
    requiredPermission: 'site.connect',
  },
  {
    method: 'POST',
    path: '/sites/:siteId/credentials/metadata',
    description: 'Record credential METADATA only (raw secret fields are rejected).',
    requiredPermission: 'credential.metadata.manage',
  },
  {
    method: 'GET',
    path: '/sites/:siteId/proxy/products',
    description: 'Read products via the WooCommerce proxy (backend-signed).',
    requiredPermission: 'proxy.read',
  },
  {
    method: 'GET',
    path: '/sites/:siteId/proxy/orders',
    description: 'Read orders via the WooCommerce proxy (backend-signed).',
    requiredPermission: 'proxy.read',
  },
  {
    method: 'GET',
    path: '/sites/:siteId/proxy/customers',
    description: 'Read customers via the WooCommerce proxy (backend-signed).',
    requiredPermission: 'proxy.read',
  },
  {
    method: 'POST',
    path: '/webhooks/woocommerce/:siteId',
    description: 'Receive a WooCommerce webhook (verified + idempotent in a later phase).',
    requiredPermission: 'webhook.receive',
    futureOnly: true,
  },
  {
    method: 'GET',
    path: '/audit',
    description: 'Read the audit log (secrets always redacted).',
    requiredPermission: 'audit.read',
  },
] as const;
