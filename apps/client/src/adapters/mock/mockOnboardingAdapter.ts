/**
 * Mock Onboarding adapter.
 *
 * Manages the onboarding platform in memory: the template catalog + plan placeholders and
 * the list of onboarding requests (both "front doors"). New requests are created with a
 * generated id, an initial `submitted` status, and a status timeline.
 *
 * SECURITY (binding): this adapter accepts ONLY frontend-safe input and constructs records
 * field-by-field from a known allow-list, so no credential-like field can ever leak into a
 * stored request — even if a caller passes extra properties. No WooCommerce keys/secrets, no
 * WordPress application passwords, no admin/hosting logins. Real connection/provisioning is a
 * server-side concern handled later (backend/proxy or companion plugin). See security-model.md.
 */
import { storeTemplates, subscriptionPlans } from '@/mock/data/onboardingCatalog';
import { onboardingRequests as seedRequests } from '@/mock/data/onboardingRequests';
import type {
  ExistingOnboardingInput,
  ExistingSiteOnboardingRequest,
  NewLaunchInput,
  NewStoreLaunchRequest,
  OnboardingRequest,
  StoreTemplate,
  SubscriptionPlan,
} from '@/domain/types';

import type { OnboardingAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockOnboardingAdapter(): OnboardingAdapter {
  // Newest first for display.
  let requests: OnboardingRequest[] = clone(seedRequests).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  let nextId = 1;

  return {
    async listTemplates(): Promise<StoreTemplate[]> {
      await delay(150);
      return clone(storeTemplates);
    },

    async listPlans(): Promise<SubscriptionPlan[]> {
      await delay(120);
      return clone(subscriptionPlans);
    },

    async listRequests(): Promise<OnboardingRequest[]> {
      await delay(180);
      return clone(requests);
    },

    async getRequest(id: string): Promise<OnboardingRequest> {
      await delay(150);
      const found = requests.find((r) => r.id === id);
      if (!found) {
        throw new Error(`Onboarding request not found: ${id}`);
      }
      return clone(found);
    },

    async createExistingSiteRequest(
      input: ExistingOnboardingInput,
    ): Promise<ExistingSiteOnboardingRequest> {
      await delay(280);
      const now = new Date().toISOString();
      // Field-by-field allow-list — never spread `input`, so no stray/credential field is stored.
      const request: ExistingSiteOnboardingRequest = {
        id: `onb_exist_new_${nextId++}`,
        type: 'existing',
        businessName: input.businessName,
        siteUrl: input.siteUrl,
        platform: input.platform,
        requestType: input.requestType,
        contactNote: input.contactNote,
        status: 'submitted',
        statusHistory: [{ status: 'submitted', date: now }],
        createdAt: now,
        updatedAt: now,
      };
      requests = [request, ...requests];
      return clone(request);
    },

    async createStoreLaunchRequest(input: NewLaunchInput): Promise<NewStoreLaunchRequest> {
      await delay(280);
      const now = new Date().toISOString();
      // Field-by-field allow-list — never spread `input`, so no stray/credential field is stored.
      const request: NewStoreLaunchRequest = {
        id: `onb_new_new_${nextId++}`,
        type: 'new',
        businessName: input.businessName,
        domain: input.domain,
        businessType: input.businessType,
        templateId: input.templateId,
        planId: input.planId,
        brandAssets: input.brandAssets.map((a) => ({ key: a.key, readiness: a.readiness })),
        brandColorPreference: input.brandColorPreference,
        contactNote: input.contactNote,
        status: 'submitted',
        statusHistory: [{ status: 'submitted', date: now }],
        createdAt: now,
        updatedAt: now,
      };
      requests = [request, ...requests];
      return clone(request);
    },
  };
}
