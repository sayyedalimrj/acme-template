/**
 * Mock store launch / site connection requests for the internal admin queue.
 */
import type { ISODate } from '@/domain/types';

export type AdminOnboardingStatus =
  | 'submitted'
  | 'under_review'
  | 'provisioning'
  | 'needs_customer_action'
  | 'ready'
  | 'delivered'
  | 'rejected';

export interface AdminOnboardingRequest {
  id: string;
  type: 'new' | 'existing';
  tenantName: string;
  businessName: string;
  domain?: string;
  siteUrl?: string;
  templateLabel?: string;
  categoryLabel?: string;
  planLabel?: string;
  status: AdminOnboardingStatus;
  missingItems: string[];
  owner?: string;
  nextAction: string;
  createdAt: ISODate;
}

export const adminOnboardingRequests: AdminOnboardingRequest[] = [
  {
    id: 'onb_admin_01',
    type: 'new',
    tenantName: 'Atlas Home',
    businessName: 'خانه اطلس',
    domain: 'atlas-home.example.test',
    templateLabel: 'فروشگاه مدرن',
    categoryLabel: 'خانه و دکور',
    planLabel: 'حرفه‌ای',
    status: 'submitted',
    missingItems: ['لوگو', 'رنگ برند'],
    owner: 'support-owner-a',
    nextAction: 'تأیید اولیه و شروع آماده‌سازی',
    createdAt: '2026-06-24T10:00:00Z',
  },
  {
    id: 'onb_admin_02',
    type: 'existing',
    tenantName: 'Marigold Botanicals',
    businessName: 'گل‌فروشی ماری‌گلد',
    siteUrl: 'https://marigold-botanicals.example.test',
    status: 'needs_customer_action',
    missingItems: ['تأیید دسترسی مدیریت'],
    owner: 'support-owner-b',
    nextAction: 'پیگیری اطلاعات از فروشنده',
    createdAt: '2026-06-20T14:30:00Z',
  },
  {
    id: 'onb_admin_03',
    type: 'new',
    tenantName: 'Saffron Co',
    businessName: 'زعفران سحر',
    domain: 'saffron-sahar.example.test',
    templateLabel: 'غذا و ارگانیک',
    categoryLabel: 'مواد غذایی',
    planLabel: 'پایه',
    status: 'provisioning',
    missingItems: [],
    owner: 'support-owner-a',
    nextAction: 'اتمام آماده‌سازی و آماده‌سازی تحویل',
    createdAt: '2026-06-18T09:15:00Z',
  },
];
