/**
 * Pure helpers for the onboarding module: status presentation, validation, option lists,
 * and request summarization. Kept free of React so they are trivially unit-testable and
 * reused across the index screen, forms, and request detail.
 *
 * SECURITY: helpers only ever read frontend-safe fields. There is no path here that accepts
 * or surfaces a credential.
 */
import type { BadgeTone } from '@/components/ui';
import type {
  BrandAssetItem,
  BrandAssetKey,
  ExistingRequestType,
  ExistingSiteOnboardingRequest,
  NewStoreLaunchRequest,
  OnboardingRequest,
  OnboardingStatus,
  PlatformConfirmation,
  StoreTemplate,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

// ---------------------------------------------------------------------------
// Status presentation
// ---------------------------------------------------------------------------

export interface StatusMeta {
  labelKey: StringKey;
  tone: BadgeTone;
}

/** Presentation (label key + badge tone) for every onboarding status across both paths. */
const STATUS_META: Record<OnboardingStatus, StatusMeta> = {
  draft: { labelKey: 'onboarding.status.draft', tone: 'neutral' },
  submitted: { labelKey: 'onboarding.status.submitted', tone: 'info' },
  under_review: { labelKey: 'onboarding.status.under_review', tone: 'info' },
  needs_customer_action: { labelKey: 'onboarding.status.needs_customer_action', tone: 'warning' },
  connection_scheduled: { labelKey: 'onboarding.status.connection_scheduled', tone: 'info' },
  connected: { labelKey: 'onboarding.status.connected', tone: 'success' },
  unsupported: { labelKey: 'onboarding.status.unsupported', tone: 'danger' },
  awaiting_assets: { labelKey: 'onboarding.status.awaiting_assets', tone: 'warning' },
  provisioning: { labelKey: 'onboarding.status.provisioning', tone: 'info' },
  ready_for_review: { labelKey: 'onboarding.status.ready_for_review', tone: 'warning' },
  delivered: { labelKey: 'onboarding.status.delivered', tone: 'success' },
  archived: { labelKey: 'onboarding.status.archived', tone: 'neutral' },
};

export function statusMeta(status: OnboardingStatus): StatusMeta {
  return STATUS_META[status];
}

/** Canonical (happy-path) status order for each front door, used by the step timeline. */
export const EXISTING_FLOW: OnboardingStatus[] = [
  'submitted',
  'under_review',
  'needs_customer_action',
  'connection_scheduled',
  'connected',
];

export const NEW_FLOW: OnboardingStatus[] = [
  'submitted',
  'under_review',
  'awaiting_assets',
  'provisioning',
  'ready_for_review',
  'connected',
  'delivered',
];

export function flowForType(type: OnboardingRequest['type']): OnboardingStatus[] {
  return type === 'existing' ? EXISTING_FLOW : NEW_FLOW;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isExisting(req: OnboardingRequest): req is ExistingSiteOnboardingRequest {
  return req.type === 'existing';
}

export function isNew(req: OnboardingRequest): req is NewStoreLaunchRequest {
  return req.type === 'new';
}

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

/** The primary subtitle line for a request card/detail (URL for A, domain for B). */
export function requestPrimaryLine(req: OnboardingRequest): string {
  return isExisting(req) ? req.siteUrl : req.domain;
}

/** i18n key describing the next support action for a request's current status. */
export function nextActionKey(req: OnboardingRequest): StringKey {
  switch (req.status) {
    case 'submitted':
      return 'onboarding.next.submitted';
    case 'under_review':
      return 'onboarding.next.under_review';
    case 'needs_customer_action':
      return 'onboarding.next.needs_customer_action';
    case 'connection_scheduled':
      return 'onboarding.next.connection_scheduled';
    case 'awaiting_assets':
      return 'onboarding.next.awaiting_assets';
    case 'provisioning':
      return 'onboarding.next.provisioning';
    case 'ready_for_review':
      return 'onboarding.next.ready_for_review';
    case 'connected':
      return 'onboarding.next.connected';
    case 'delivered':
      return 'onboarding.next.delivered';
    case 'unsupported':
      return 'onboarding.next.unsupported';
    case 'archived':
      return 'onboarding.next.archived';
    case 'draft':
    default:
      return 'onboarding.next.draft';
  }
}

// ---------------------------------------------------------------------------
// Validation (frontend-safe inputs only)
// ---------------------------------------------------------------------------

/** A non-empty http(s) URL, matching the existing connect-site rule. */
export function isValidStoreUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

/** A bare domain like "shop.example.com" (no protocol required, no spaces). */
export function isValidDomain(value: string): boolean {
  const trimmed = value.trim().replace(/^https?:\/\//i, '');
  return /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(trimmed);
}

// ---------------------------------------------------------------------------
// Option lists + label keys
// ---------------------------------------------------------------------------

export const PLATFORM_OPTIONS: PlatformConfirmation[] = ['woocommerce', 'not_sure', 'other'];

/** Request types offered in the first mock UI (migration consult is documented for later). */
export const EXISTING_REQUEST_TYPE_OPTIONS: ExistingRequestType[] = [
  'connect_only',
  'managed_handover',
];

export const BRAND_ASSET_KEYS: BrandAssetKey[] = [
  'logo',
  'product_photos',
  'product_list',
  'about_text',
  'contact_info',
  'shipping_payment',
];

export function platformLabelKey(platform: PlatformConfirmation): StringKey {
  switch (platform) {
    case 'woocommerce':
      return 'onboarding.platform.woocommerce';
    case 'not_sure':
      return 'onboarding.platform.not_sure';
    case 'other':
    default:
      return 'onboarding.platform.other';
  }
}

export function requestTypeLabelKey(type: ExistingRequestType): StringKey {
  switch (type) {
    case 'connect_only':
      return 'onboarding.requestType.connect_only';
    case 'managed_handover':
      return 'onboarding.requestType.managed_handover';
    case 'migration_consult':
    default:
      return 'onboarding.requestType.migration_consult';
  }
}

export function brandAssetLabelKey(key: BrandAssetKey): StringKey {
  switch (key) {
    case 'logo':
      return 'onboarding.asset.logo';
    case 'product_photos':
      return 'onboarding.asset.product_photos';
    case 'product_list':
      return 'onboarding.asset.product_list';
    case 'about_text':
      return 'onboarding.asset.about_text';
    case 'contact_info':
      return 'onboarding.asset.contact_info';
    case 'shipping_payment':
    default:
      return 'onboarding.asset.shipping_payment';
  }
}

/** Default brand-asset checklist (every item starts as "need"). */
export function defaultBrandAssets(): BrandAssetItem[] {
  return BRAND_ASSET_KEYS.map((key) => ({ key, readiness: 'need' }));
}

/** Unique business categories present in the template catalog, in first-seen order. */
export function uniqueCategories(templates: StoreTemplate[]): string[] {
  const seen: string[] = [];
  for (const tpl of templates) {
    if (!seen.includes(tpl.category)) {
      seen.push(tpl.category);
    }
  }
  return seen;
}
