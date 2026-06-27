/**
 * Affiliate / marketer portal domain models — frontend-safe, mock-only.
 *
 * The affiliate portal is for marketers who refer merchants (sellers) to the platform and earn
 * a commission. It shows their referral link/code, the merchants they referred, commission
 * entries, earnings, and payout requests.
 *
 * SECURITY (binding — see security-model.md): frontend-safe display data only. No bank account
 * numbers, no payment-provider secrets, no card data, no raw PII beyond mock display names.
 * Money values are pre-formatted Persian display labels. Real payouts run server-side later via
 * the platform payment gateway (see apps/api `PaymentGateway`).
 */
import type { ISODate } from './types';
import type { MoneyLabel, PayoutMethod, PayoutRequestStatus } from './admin';

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** The marketer's own profile + referral identity (frontend-safe). */
export interface AffiliateProfile {
  name: string;
  /** Public referral code, e.g. "REZA20". */
  code: string;
  /** Shareable referral link (non-secret). */
  referralLink: string;
  /** Tier label, e.g. "طلایی". */
  tierLabel: string;
  /** Commission rate label, e.g. "۲۰٪". */
  commissionRateLabel: string;
}

// ---------------------------------------------------------------------------
// Referrals (merchants this marketer brought in)
// ---------------------------------------------------------------------------

/** Lifecycle of a referred merchant from the marketer's perspective. */
export type ReferralStatus = 'lead' | 'trial' | 'active' | 'churned';

/** A merchant referred by the marketer. */
export interface AffiliateReferral {
  id: string;
  storeName: string;
  ownerName: string;
  status: ReferralStatus;
  planLabel: string;
  joinedAt: ISODate;
  /** Commission earned so far from this referral (display label). */
  commissionLabel: MoneyLabel;
  /** Store sales volume attributed to this referral (stats only — no order data). */
  salesVolumeLabel?: MoneyLabel;
}

// ---------------------------------------------------------------------------
// Commission entries (the ledger)
// ---------------------------------------------------------------------------

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed';

/** A single commission ledger entry. */
export interface CommissionEntry {
  id: string;
  referralStoreName: string;
  amountLabel: MoneyLabel;
  /** Commission rate applied, e.g. "۲۰٪". */
  rateLabel: string;
  status: CommissionStatus;
  /** Human period label, e.g. "خرداد ۱۴۰۴". */
  periodLabel: string;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Payouts (requested by the marketer)
// ---------------------------------------------------------------------------

/** A payout the marketer requested (reuses the admin payout vocabulary). */
export interface AffiliatePayout {
  id: string;
  amountLabel: MoneyLabel;
  method: PayoutMethod;
  /** Masked destination, e.g. "کارت •••• ۴۳۲۱". */
  maskedDestination: string;
  status: PayoutRequestStatus;
  requestedAt: ISODate;
  paidAt?: ISODate;
}

// ---------------------------------------------------------------------------
// Overview (affiliate home)
// ---------------------------------------------------------------------------

/** The affiliate home overview. */
export interface AffiliateOverview {
  totalEarnedLabel: MoneyLabel;
  pendingLabel: MoneyLabel;
  paidLabel: MoneyLabel;
  /** Commission earned this month (display label). */
  thisMonthLabel: MoneyLabel;
  /** Balance available to withdraw now (display label). */
  availableLabel: MoneyLabel;
  referralsTotal: number;
  referralsActive: number;
  /** Lead → active conversion rate label, e.g. "۶۴٪". */
  conversionRateLabel: string;
}
