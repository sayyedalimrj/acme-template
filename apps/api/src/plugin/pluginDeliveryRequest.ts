/**
 * Plugin signed-delivery request contracts (backend skeleton).
 *
 * Models the shape of a (future) signed sync delivery request. There is NO HTTP server here.
 * Headers carry only non-secret routing/signing metadata — there is NO Authorization header,
 * NO bearer token, NO basic auth, and NO API key in this phase. See `security-model.md`.
 */
import type { PluginSyncEnvelope } from './pluginSyncEnvelope';

/** Signed-delivery request headers (all non-secret; signature is an HMAC hex digest). */
export interface PluginDeliveryHeaders {
  'x-wcos-site-id': string;
  'x-wcos-tenant-id'?: string;
  /** ISO-8601 timestamp. */
  'x-wcos-timestamp': string;
  'x-wcos-nonce': string;
  /** HMAC-SHA256 hex digest over the canonical base string. */
  'x-wcos-signature': string;
  'x-wcos-plugin-version'?: string;
}

/** Request body — the read-only sync envelope (summary-only; no PII/secrets). */
export interface PluginDeliveryBody {
  envelope: PluginSyncEnvelope;
}

/**
 * A full signed-delivery request. `rawBody` is the exact serialized JSON the plugin signed; if
 * absent, the handler serializes `body.envelope` deterministically to recompute the signature.
 */
export interface PluginDeliveryRequest {
  headers: Partial<PluginDeliveryHeaders>;
  body: PluginDeliveryBody;
  rawBody?: string;
}
