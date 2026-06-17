/**
 * Capability & permission contract (skeleton).
 *
 * Defines what the companion plugin can be authorized to do, and the WordPress/WooCommerce
 * capabilities those require. CONTRACT ONLY — no enforcement, no checks against a real site.
 * Reserved `*_later` capabilities are DISABLED BY DEFAULT and never granted in this phase.
 * Capability names are kept compatible with `apps/api` `SiteConnectionCapability`, plus the
 * plugin-only `site_health` and `sync_events`. See `../SECURITY.md`.
 */

/** Capabilities the companion plugin may serve. */
export type CompanionPluginCapability =
  | 'read_products'
  | 'read_orders'
  | 'read_customers'
  | 'read_reports'
  | 'receive_webhooks'
  | 'site_health'
  | 'sync_events'
  | 'mutate_products_later'
  | 'mutate_orders_later'
  | 'send_notifications_later';

/** Scope at which a capability applies (compatible with `apps/api` `PermissionScope`). */
export type CompanionPluginPermissionScope = 'global' | 'tenant' | 'site';

/**
 * WordPress user capabilities the connection may require. `*_later` ones are write-capable
 * and reserved for the controlled-mutation phase.
 */
export type RequiredWordPressCapability =
  | 'read'
  | 'manage_woocommerce'
  | 'view_woocommerce_reports'
  | 'edit_shop_orders_later'
  | 'edit_products_later';

/** WooCommerce REST permission required. Write scopes are reserved for later. */
export type RequiredWooCommerceCapability = 'read' | 'write_later' | 'read_write_later';

/** Result of evaluating whether a capability is/should be granted. */
export interface CapabilityCheckResult {
  capability: CompanionPluginCapability;
  granted: boolean;
  /** Whether the capability is enabled by default in the current phase. */
  enabledByDefault: boolean;
  /** Safe, non-secret reason when not granted. */
  reason?: string;
  /** WordPress capabilities that would be required but appear missing (safe diagnostics). */
  missingWordPressCapabilities?: RequiredWordPressCapability[];
}

/** Static definition of each capability's requirements and default-enabled state. */
export interface CapabilityDefinition {
  capability: CompanionPluginCapability;
  scope: CompanionPluginPermissionScope;
  requiredWordPress: RequiredWordPressCapability[];
  requiredWooCommerce: RequiredWooCommerceCapability;
  /** Reserved `*_later` capabilities are always `false` here. */
  enabledByDefault: boolean;
}

/** The capability matrix. Reserved write/notification capabilities are disabled by default. */
export const CAPABILITY_DEFINITIONS: readonly CapabilityDefinition[] = [
  {
    capability: 'read_products',
    scope: 'site',
    requiredWordPress: ['read', 'manage_woocommerce'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'read_orders',
    scope: 'site',
    requiredWordPress: ['read', 'manage_woocommerce'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'read_customers',
    scope: 'site',
    requiredWordPress: ['read', 'manage_woocommerce'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'read_reports',
    scope: 'site',
    requiredWordPress: ['read', 'view_woocommerce_reports'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'receive_webhooks',
    scope: 'site',
    requiredWordPress: ['manage_woocommerce'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'site_health',
    scope: 'site',
    requiredWordPress: ['read'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'sync_events',
    scope: 'site',
    requiredWordPress: ['manage_woocommerce'],
    requiredWooCommerce: 'read',
    enabledByDefault: true,
  },
  {
    capability: 'mutate_products_later',
    scope: 'site',
    requiredWordPress: ['edit_products_later'],
    requiredWooCommerce: 'write_later',
    enabledByDefault: false,
  },
  {
    capability: 'mutate_orders_later',
    scope: 'site',
    requiredWordPress: ['edit_shop_orders_later'],
    requiredWooCommerce: 'write_later',
    enabledByDefault: false,
  },
  {
    capability: 'send_notifications_later',
    scope: 'tenant',
    requiredWordPress: [],
    requiredWooCommerce: 'read',
    enabledByDefault: false,
  },
] as const;

/** Reserved capabilities that must never be enabled in this phase. */
export const RESERVED_LATER_CAPABILITIES: readonly CompanionPluginCapability[] = [
  'mutate_products_later',
  'mutate_orders_later',
  'send_notifications_later',
] as const;

/** Pure helper: is a capability enabled by default in the current phase? */
export function isCapabilityEnabledByDefault(capability: CompanionPluginCapability): boolean {
  const def = CAPABILITY_DEFINITIONS.find((d) => d.capability === capability);
  return def?.enabledByDefault ?? false;
}

/**
 * Pure placeholder capability check. Reserved `*_later` capabilities are always denied; other
 * capabilities are reported as default-enabled (no real site check is performed here).
 */
export function evaluateCapabilityPlaceholder(
  capability: CompanionPluginCapability,
): CapabilityCheckResult {
  const enabledByDefault = isCapabilityEnabledByDefault(capability);
  if (RESERVED_LATER_CAPABILITIES.includes(capability)) {
    return {
      capability,
      granted: false,
      enabledByDefault: false,
      reason: 'Reserved capability is disabled until a later, security-reviewed phase.',
    };
  }
  return { capability, granted: enabledByDefault, enabledByDefault };
}
