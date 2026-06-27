/**
 * HTTP Onboarding adapter — persists onboarding requests through the production API.
 */
import { http } from '@/services/httpClient';
import { storeTemplates, subscriptionPlans } from '@/mock/data/onboardingCatalog';
import type {
  ExistingOnboardingInput,
  ExistingSiteOnboardingRequest,
  NewLaunchInput,
  NewStoreLaunchRequest,
  OnboardingRequest,
  OnboardingStatus,
  OnboardingStatusEvent,
  StoreTemplate,
  SubscriptionPlan,
} from '@/domain/types';

import type { OnboardingAdapter } from '../types';

interface BackendRequest {
  id: string;
  type: 'existing' | 'new';
  referral_code: string;
  status: string;
  payload: Record<string, unknown>;
  site_id?: string | null;
  estimated_ready_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendStatusEvent {
  status: string;
  note?: string | null;
  created_at: string;
}

function mapStatus(status: string): OnboardingStatus {
  const allowed: OnboardingStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'needs_customer_action',
    'connection_scheduled',
    'connected',
    'unsupported',
    'awaiting_assets',
    'provisioning',
    'ready_for_review',
    'delivered',
    'archived',
  ];
  if (allowed.includes(status as OnboardingStatus)) return status as OnboardingStatus;
  if (status === 'ready') return 'ready_for_review';
  if (status === 'rejected') return 'unsupported';
  return 'submitted';
}

function mapEvents(events: BackendStatusEvent[]): OnboardingStatusEvent[] {
  return events.map((e) => ({
    status: mapStatus(e.status),
    date: e.created_at,
    note: e.note ?? undefined,
  }));
}

function mapRequest(row: BackendRequest, events: BackendStatusEvent[] = []): OnboardingRequest {
  const payload = row.payload ?? {};
  const base = {
    id: row.id,
    referralCode: row.referral_code,
    businessName: String(payload.businessName ?? ''),
    contactNote: payload.contactNote ? String(payload.contactNote) : undefined,
    estimatedReadyAt: row.estimated_ready_at ?? undefined,
    siteId: row.site_id ?? undefined,
    statusHistory: events.length > 0 ? mapEvents(events) : [{ status: mapStatus(row.status), date: row.created_at }],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.type === 'existing') {
    return {
      ...base,
      type: 'existing',
      siteUrl: String(payload.siteUrl ?? ''),
      platform: (payload.platform ?? 'woocommerce') as ExistingSiteOnboardingRequest['platform'],
      requestType: (payload.requestType ?? 'connect_only') as ExistingSiteOnboardingRequest['requestType'],
      status: mapStatus(row.status) as ExistingSiteOnboardingRequest['status'],
    };
  }

  return {
    ...base,
    type: 'new',
    domain: String(payload.domain ?? ''),
    businessType: String(payload.businessType ?? ''),
    templateId: String(payload.templateId ?? ''),
    planId: (payload.planId ?? 'growth') as NewStoreLaunchRequest['planId'],
    brandAssets: Array.isArray(payload.brandAssets)
      ? (payload.brandAssets as NewStoreLaunchRequest['brandAssets'])
      : [],
    brandColorPreference: payload.brandColorPreference ? String(payload.brandColorPreference) : undefined,
    status: mapStatus(row.status) as NewStoreLaunchRequest['status'],
  };
}

export function createHttpOnboardingAdapter(): OnboardingAdapter {
  return {
    async listTemplates(): Promise<StoreTemplate[]> {
      return storeTemplates;
    },

    async listPlans(): Promise<SubscriptionPlan[]> {
      try {
        const res = await http.get<{ items: Array<{ code: string; name: string; price_minor: number }> }>(
          '/merchant/onboarding/plans',
        );
        if (res.items.length === 0) return subscriptionPlans;
        return res.items.map((p) => ({
          id: p.code as SubscriptionPlan['id'],
          name: p.name,
          priceLabel: `${p.price_minor}`,
          tagline: '',
          features: [],
          supportSetupIncluded: true,
          aiAdvisorIncluded: false,
          smsAutomationIncluded: false,
          growthChannelsLater: false,
          recommended: p.code === 'growth',
        }));
      } catch {
        return subscriptionPlans;
      }
    },

    async listRequests(): Promise<OnboardingRequest[]> {
      const res = await http.get<{ items: BackendRequest[] }>('/merchant/onboarding/requests');
      return res.items.map((r) => mapRequest(r));
    },

    async getRequest(id: string): Promise<OnboardingRequest> {
      const res = await http.get<{ request: BackendRequest; statusHistory: BackendStatusEvent[] }>(
        `/merchant/onboarding/requests/${encodeURIComponent(id)}`,
      );
      return mapRequest(res.request, res.statusHistory ?? []);
    },

    async createExistingSiteRequest(input: ExistingOnboardingInput): Promise<ExistingSiteOnboardingRequest> {
      const res = await http.post<{ request: BackendRequest }>('/merchant/onboarding/requests/existing', input);
      return mapRequest(res.request) as ExistingSiteOnboardingRequest;
    },

    async createStoreLaunchRequest(input: NewLaunchInput): Promise<NewStoreLaunchRequest> {
      const res = await http.post<{ request: BackendRequest }>('/merchant/onboarding/requests/new', input);
      return mapRequest(res.request) as NewStoreLaunchRequest;
    },
  };
}
