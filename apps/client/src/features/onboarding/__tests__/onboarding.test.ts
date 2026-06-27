import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { onboardingService } from '@/services';

const FORBIDDEN_CREDENTIAL_KEYS = [
  'consumerKey',
  'consumerSecret',
  'applicationPassword',
  'password',
  'apiKey',
  'username',
  'adminPassword',
  'token',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('onboarding service (mock)', () => {
  it('lists the template catalog with categories and availability', async () => {
    const templates = await onboardingService.listTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((t) => Boolean(t.category) && Boolean(t.previewLabel))).toBe(true);
    expect(templates.some((t) => t.availability === 'available')).toBe(true);
  });

  it('lists plan placeholders (starter → managed)', async () => {
    const plans = await onboardingService.listPlans();
    expect(plans.map((p) => p.id)).toEqual(['starter', 'growth', 'pro', 'managed']);
  });

  it('creates an existing-site request WITHOUT any credential fields', async () => {
    const before = (await onboardingService.listRequests()).length;
    const request = await onboardingService.createExistingSiteRequest({
      referralCode: 'REZA20',
      businessName: 'My Store',
      siteUrl: 'https://my-store.example.test',
      platform: 'woocommerce',
      requestType: 'managed_handover',
      contactNote: 'Please help us connect.',
    });

    expect(request.type).toBe('existing');
    expect(request.status).toBe('submitted');
    expect(request.statusHistory.length).toBeGreaterThan(0);

    // The stored request must never carry a credential-like field.
    const keys = Object.keys(request);
    FORBIDDEN_CREDENTIAL_KEYS.forEach((k) => expect(keys).not.toContain(k));

    expect((await onboardingService.listRequests()).length).toBe(before + 1);
  });

  it('creates a store-launch request with template + plan + brand assets', async () => {
    const request = await onboardingService.createStoreLaunchRequest({
      referralCode: 'REZA20',
      businessName: 'Termeh Wear',
      domain: 'termeh-wear.example.test',
      businessType: 'پوشاک',
      templateId: 'tpl_pooshak_aurora',
      planId: 'growth',
      brandAssets: [
        { key: 'logo', readiness: 'have' },
        { key: 'product_photos', readiness: 'need' },
      ],
      brandColorPreference: 'navy and cream',
    });

    expect(request.type).toBe('new');
    expect(request.templateId).toBe('tpl_pooshak_aurora');
    expect(request.planId).toBe('growth');
    expect(request.brandAssets).toHaveLength(2);
    expect(request.status).toBe('submitted');

    const keys = Object.keys(request);
    FORBIDDEN_CREDENTIAL_KEYS.forEach((k) => expect(keys).not.toContain(k));

    // It is retrievable by id with its timeline.
    const fetched = await onboardingService.getRequest(request.id);
    expect(fetched.id).toBe(request.id);
    expect(fetched.statusHistory.length).toBeGreaterThan(0);
  });

  it('ignores stray (non-allow-listed) input fields such as injected credentials', async () => {
    // Even if a caller smuggles a credential-like field, it must not be persisted.
    const request = await onboardingService.createExistingSiteRequest({
      referralCode: 'REZA20',
      businessName: 'Sneaky Store',
      siteUrl: 'https://sneaky.example.test',
      platform: 'woocommerce',
      requestType: 'connect_only',
      // @ts-expect-error — not part of the input type; must be dropped by the adapter.
      consumerSecret: 'cs_should_never_be_stored',
    });
    expect(JSON.stringify(request)).not.toContain('cs_should_never_be_stored');
  });
});
