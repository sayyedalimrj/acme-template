import { describe, expect, it } from '@jest/globals';

import { storeTemplates, subscriptionPlans } from '@/mock/data/onboardingCatalog';
import { onboardingRequests } from '@/mock/data/onboardingRequests';

import {
  BRAND_ASSET_KEYS,
  defaultBrandAssets,
  flowForType,
  isExisting,
  isNew,
  isValidDomain,
  isValidStoreUrl,
  requestPrimaryLine,
  statusMeta,
  uniqueCategories,
} from '@/features/onboarding/onboardingHelpers';

describe('onboarding helpers', () => {
  it('validates store URLs (http/https required)', () => {
    expect(isValidStoreUrl('https://shop.example.com')).toBe(true);
    expect(isValidStoreUrl('http://shop.example.com')).toBe(true);
    expect(isValidStoreUrl('shop.example.com')).toBe(false);
    expect(isValidStoreUrl('')).toBe(false);
  });

  it('validates bare domains and tolerates a protocol prefix', () => {
    expect(isValidDomain('termeh-wear.com')).toBe(true);
    expect(isValidDomain('shop.example.co.uk')).toBe(true);
    expect(isValidDomain('https://termeh-wear.com')).toBe(true);
    expect(isValidDomain('not a domain')).toBe(false);
    expect(isValidDomain('example')).toBe(false);
  });

  it('maps every status to a label key and tone', () => {
    expect(statusMeta('submitted').labelKey).toBe('onboarding.status.submitted');
    expect(statusMeta('connected').tone).toBe('success');
    expect(statusMeta('unsupported').tone).toBe('danger');
    expect(statusMeta('needs_customer_action').tone).toBe('warning');
  });

  it('returns the right canonical flow per path', () => {
    expect(flowForType('existing')).toContain('connection_scheduled');
    expect(flowForType('new')).toContain('provisioning');
    expect(flowForType('new')).toContain('delivered');
  });

  it('discriminates request types and derives the primary line', () => {
    const existing = onboardingRequests.find(isExisting)!;
    const launch = onboardingRequests.find(isNew)!;
    expect(existing).toBeDefined();
    expect(launch).toBeDefined();
    expect(requestPrimaryLine(existing)).toBe(existing.siteUrl);
    expect(requestPrimaryLine(launch)).toBe(launch.domain);
  });

  it('builds the default brand-asset checklist (all need)', () => {
    const assets = defaultBrandAssets();
    expect(assets).toHaveLength(BRAND_ASSET_KEYS.length);
    expect(assets.every((a) => a.readiness === 'need')).toBe(true);
  });

  it('derives unique business categories from the template catalog', () => {
    const categories = uniqueCategories(storeTemplates);
    expect(categories).toContain('پوشاک');
    expect(categories).toContain('آرایشی و بهداشتی');
    // De-duplicated even though multiple templates share a category.
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('offers four subscription plans including a managed tier', () => {
    expect(subscriptionPlans.map((p) => p.id)).toEqual(['starter', 'growth', 'pro', 'managed']);
  });
});
