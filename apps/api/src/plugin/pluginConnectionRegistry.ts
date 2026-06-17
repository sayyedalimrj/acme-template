/**
 * Plugin connection registry placeholder (backend skeleton).
 *
 * A tiny IN-MEMORY registry of plugin connection metadata. There is NO database and NO
 * persistence — entries live only for the process lifetime and reset on restart. Records hold
 * metadata only (never secrets); inputs carrying secret-like fields are rejected. See
 * `security-model.md`.
 */
import type { SiteConnectionCapability, SiteId } from '../domain/site';
import { findRawSecretFields } from '../security/credentialPolicy';
import { createSafeError, type Result } from '../security/errors';
import type { PluginConnectionRecord, PluginDeliveryStatus } from './pluginSyncEnvelope';

/** In-memory store (process-lifetime only; not persisted). */
const registry = new Map<SiteId, PluginConnectionRecord>();

/** Input for registering a connection (metadata only — no secrets). */
export interface RegisterPluginConnectionInput {
  siteId: SiteId;
  tenantId?: string;
  pluginVersion: string;
  siteUrl: string;
  connectionStatus: string;
  deliveryStatus?: PluginDeliveryStatus;
  lastSyncAt?: string;
  capabilities?: SiteConnectionCapability[];
}

/**
 * Register (or update) a plugin connection placeholder. Rejects any input carrying raw
 * secret-like fields. Stores metadata only, in memory.
 *
 * @param input Connection metadata.
 */
export function registerPluginConnectionPlaceholder(
  input: RegisterPluginConnectionInput,
): Result<PluginConnectionRecord> {
  const offending = findRawSecretFields(input);
  if (offending.length > 0) {
    return {
      ok: false,
      error: createSafeError('raw_secret_rejected', undefined, {
        rejectedFieldCount: offending.length,
        rejectedFields: offending.join(', '),
      }),
    };
  }
  if (!input.siteId || input.siteId.trim().length === 0) {
    return { ok: false, error: createSafeError('validation_error', 'A siteId is required.') };
  }

  const record: PluginConnectionRecord = {
    tenantId: input.tenantId,
    siteId: input.siteId,
    pluginVersion: input.pluginVersion,
    siteUrl: input.siteUrl,
    connectionStatus: input.connectionStatus,
    deliveryStatus: input.deliveryStatus ?? 'not_configured',
    lastSyncAt: input.lastSyncAt,
    capabilities: input.capabilities ?? [],
  };
  registry.set(input.siteId, record);

  return { ok: true, data: record };
}

/** Get a connection record by site id (in-memory). */
export function getPluginConnectionStatus(siteId: SiteId): Result<PluginConnectionRecord> {
  const record = registry.get(siteId);
  if (!record) {
    return {
      ok: false,
      error: createSafeError('not_found', 'No plugin connection for that siteId.'),
    };
  }
  return { ok: true, data: record };
}

/** Disconnect (remove) a connection placeholder by site id (in-memory). */
export function disconnectPluginConnectionPlaceholder(
  siteId: SiteId,
): Result<{ disconnected: true }> {
  if (!registry.has(siteId)) {
    return {
      ok: false,
      error: createSafeError('not_found', 'No plugin connection for that siteId.'),
    };
  }
  registry.delete(siteId);
  return { ok: true, data: { disconnected: true } };
}

/** Test/example helper: clear the in-memory registry. */
export function resetPluginConnectionRegistry(): void {
  registry.clear();
}
