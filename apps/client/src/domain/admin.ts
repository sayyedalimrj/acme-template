/**
 * Admin (platform back-office) domain models — frontend-safe, mock-only.
 *
 * The admin portal is the PLATFORM OWNER's back-office for operating the whole business:
 * merchants (the store owners who use the merchant app), platform-wide orders, the marketer/
 * affiliate network, and commission payouts.
 *
 * SECURITY (binding — see security-model.md): these shapes carry ONLY frontend-safe display
 * data. They never contain store credentials, payment-provider secrets, card/PAN data, or raw
 * PII beyond mock display names. Monetary values are pre-formatted Persian display labels (e.g.
 * "۱۲٬۴۵۰٬۰۰۰ تومان"), never used for real charges. Real admin actions/visibility are enforced
 * server-side later (see apps/api RBAC + tenant isolation).
 */
import type { ISODate, OrderStatus, SubscriptionPlanId } from './types';

/** A pre-formatted, display-only money label (no real charge, no precision math). */
export type MoneyLabel = string;

// ---------------------------------------------------------------------------
// Merchants (the store owners who use the merchant app)
// ---------------------------------------------------------------------------

/** Account/billing status of a merchant on the platform. */
export type MerchantAccountStatus = 'active' | 'trial' | 'past_due' | 'suspended' | 'canceled';

/** A merchant account as seen by the platform admin. */
export interface AdminMerchant {
  id: string;
  storeName: string;
  ownerName: string;
  /** Public store URL (non-secret). */
  url: string;
  planId: SubscriptionPlanId;
  planName: string;
  status: MerchantAccountStatus;
  /** Monthly recurring revenue this merchant contributes (display label). */
  mrrLabel: MoneyLabel;
  /** The merchant's own store sales this month (display label). */
  storeSalesLabel: MoneyLabel;
  ordersCount: number;
  productsCount: number;
  joinedAt: ISODate;
  lastActiveAt: ISODate;
  /** If the merchant came through a marketer, who referred them. */
  referredByMarketerId?: string;
  referredByMarketerName?: string;
}

// ---------------------------------------------------------------------------
// Platform-wide orders (across all merchant stores)
// ---------------------------------------------------------------------------

/** A compact, platform-wide order row (across every connected store). */
export interface AdminOrderSummary {
  id: string;
  number: string;
  storeName: string;
  merchantId: string;
  customerName: string;
  status: OrderStatus;
  totalLabel: MoneyLabel;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Marketers / affiliates (managed from the admin side)
// ---------------------------------------------------------------------------

export type MarketerStatus = 'active' | 'paused';

/** A marketer/affiliate as seen by the platform admin. */
export interface AdminMarketerSummary {
  id: string;
  name: string;
  /** Public referral code (non-secret). */
  code: string;
  status: MarketerStatus;
  referralsTotal: number;
  activeReferrals: number;
  /** Commission rate label, e.g. "۲۰٪". */
  commissionRateLabel: string;
  commissionPendingLabel: MoneyLabel;
  commissionPaidLabel: MoneyLabel;
  joinedAt: ISODate;
}

// ---------------------------------------------------------------------------
// Commission payout requests (admin approves / marks paid — mock)
// ---------------------------------------------------------------------------

export type PayoutRequestStatus = 'requested' | 'approved' | 'paid' | 'rejected';

/** Human-friendly payout method (no account numbers/secrets stored). */
export type PayoutMethod = 'bank_card' | 'bank_iban' | 'wallet';

/** A marketer's commission payout request awaiting admin action. */
export interface AdminPayoutRequest {
  id: string;
  marketerId: string;
  marketerName: string;
  amountLabel: MoneyLabel;
  method: PayoutMethod;
  /** Masked destination, e.g. "کارت •••• ۴۳۲۱" — never a full number. */
  maskedDestination: string;
  status: PayoutRequestStatus;
  requestedAt: ISODate;
}

// ---------------------------------------------------------------------------
// Overview (admin home)
// ---------------------------------------------------------------------------

/** A KPI tile for the admin overview. */
export interface AdminMetric {
  id: string;
  label: string;
  value: string;
  /** Optional Persian change hint, e.g. "+۸٪ این ماه". */
  changeLabel?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

/** A recent platform activity row. */
export interface AdminActivityEntry {
  id: string;
  kind: 'merchant' | 'order' | 'marketer' | 'payout' | 'support' | 'system';
  message: string;
  date: ISODate;
}

/** The admin home overview. */
export interface AdminOverview {
  merchantsTotal: number;
  merchantsActive: number;
  merchantsTrialing: number;
  /** Platform monthly recurring revenue (display label). */
  mrrLabel: MoneyLabel;
  /** Gross merchandise value across all stores this month (display label). */
  gmvLabel: MoneyLabel;
  openSupport: number;
  pendingPayouts: number;
  pendingPayoutsAmountLabel: MoneyLabel;
  metrics: AdminMetric[];
  recentActivity: AdminActivityEntry[];
}
