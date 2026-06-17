/**
 * Companion plugin metadata contract (skeleton).
 *
 * Safe, non-secret identity/version/capability metadata describing the future companion
 * plugin. All URLs and contacts are placeholders. No secrets, no production claims, no
 * runtime behavior. See `../SECURITY.md`.
 */
import type { CompanionPluginCapability } from './capabilities-contract';

/** Features the plugin will support, in dependency-friendly order. */
export type PluginSupportedFeature =
  | 'site_identity'
  | 'secure_handshake'
  | 'health_check'
  | 'capability_discovery'
  | 'event_bridge'
  | 'webhook_configuration'
  | 'disconnect_revoke'
  | 'safe_diagnostics';

/** Frontend-safe plugin metadata. No secret values; URLs/contacts are placeholders. */
export interface PluginMetadata {
  pluginName: string;
  pluginSlug: string;
  /** Pre-release contract version — not a shipped plugin version. */
  pluginVersion: string;
  /** Minimum WordPress version (placeholder until validated against the real runtime). */
  requiredWordPressVersion: string;
  /** Minimum WooCommerce version (placeholder until validated against the real runtime). */
  requiredWooCommerceVersion: string;
  supportedFeatures: PluginSupportedFeature[];
  /** Capabilities the plugin declares it can serve (reserved `*_later` ones stay disabled). */
  declaredCapabilities: CompanionPluginCapability[];
  /** Placeholder support contact (fake address; never a real inbox). */
  supportContact: string;
  /** Placeholder documentation URL (fake domain). */
  docsUrl: string;
}

/** The companion plugin's declared metadata. Contract values only. */
export const COMPANION_PLUGIN_METADATA: PluginMetadata = {
  pluginName: 'WooCommerce OS Companion',
  pluginSlug: 'woocommerce-os-companion',
  pluginVersion: '0.0.0-contract',
  requiredWordPressVersion: '6.0',
  requiredWooCommerceVersion: '8.0',
  supportedFeatures: [
    'site_identity',
    'secure_handshake',
    'health_check',
    'capability_discovery',
    'event_bridge',
    'webhook_configuration',
    'disconnect_revoke',
    'safe_diagnostics',
  ],
  declaredCapabilities: [
    'read_products',
    'read_orders',
    'read_customers',
    'read_reports',
    'receive_webhooks',
    'site_health',
    'sync_events',
  ],
  supportContact: 'support@example-store.test',
  docsUrl: 'https://example-store.test/companion/docs',
};
