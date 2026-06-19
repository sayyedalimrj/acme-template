/**
 * Affiliate portal mock data (frontend-safe, in-memory, deterministic).
 *
 * Realistic data for a marketer: profile + referral code, referred merchants, commission
 * ledger, payouts, and overview KPIs. No secrets, no bank numbers, no card data. Money values
 * are display-only Persian labels.
 */
import type {
  AffiliateOverview,
  AffiliatePayout,
  AffiliateProfile,
  AffiliateReferral,
  CommissionEntry,
} from '@/domain/affiliate';

export const AFFILIATE_PROFILE: AffiliateProfile = {
  name: 'رضا کریمی',
  code: 'REZA20',
  referralLink: 'https://app.example/r/REZA20',
  tierLabel: 'طلایی',
  commissionRateLabel: '۲۰٪',
};

export const AFFILIATE_REFERRALS: readonly AffiliateReferral[] = [
  {
    id: 'r-01',
    storeName: 'فروشگاه بادبان',
    ownerName: 'سارا محمدی',
    status: 'active',
    planLabel: 'رشد',
    joinedAt: '1403-12-02',
    commissionLabel: '۹٬۸۰۰٬۰۰۰ تومان',
  },
  {
    id: 'r-02',
    storeName: 'لوازم خانگی مهر',
    ownerName: 'حمید عباسی',
    status: 'active',
    planLabel: 'رشد',
    joinedAt: '1403-11-21',
    commissionLabel: '۶٬۲۰۰٬۰۰۰ تومان',
  },
  {
    id: 'r-03',
    storeName: 'گالری چرم رادین',
    ownerName: 'رادین فرهی',
    status: 'trial',
    planLabel: 'آزمایشی',
    joinedAt: '1404-03-18',
    commissionLabel: '۰ تومان',
  },
  {
    id: 'r-04',
    storeName: 'عطر و ادکلن نیلا',
    ownerName: 'نیلا اکبری',
    status: 'lead',
    planLabel: '—',
    joinedAt: '1404-03-25',
    commissionLabel: '۰ تومان',
  },
  {
    id: 'r-05',
    storeName: 'پوشاک آوا',
    ownerName: 'آوا مرادی',
    status: 'churned',
    planLabel: 'لغو شده',
    joinedAt: '1403-10-05',
    commissionLabel: '۱٬۴۰۰٬۰۰۰ تومان',
  },
];

export const AFFILIATE_COMMISSIONS: readonly CommissionEntry[] = [
  {
    id: 'c-101',
    referralStoreName: 'فروشگاه بادبان',
    amountLabel: '۹۸۰٬۰۰۰ تومان',
    rateLabel: '۲۰٪',
    status: 'pending',
    periodLabel: 'خرداد ۱۴۰۴',
    createdAt: '1404-03-29',
  },
  {
    id: 'c-102',
    referralStoreName: 'لوازم خانگی مهر',
    amountLabel: '۹۸۰٬۰۰۰ تومان',
    rateLabel: '۲۰٪',
    status: 'approved',
    periodLabel: 'خرداد ۱۴۰۴',
    createdAt: '1404-03-20',
  },
  {
    id: 'c-103',
    referralStoreName: 'فروشگاه بادبان',
    amountLabel: '۹۸۰٬۰۰۰ تومان',
    rateLabel: '۲۰٪',
    status: 'paid',
    periodLabel: 'اردیبهشت ۱۴۰۴',
    createdAt: '1404-02-28',
  },
  {
    id: 'c-104',
    referralStoreName: 'پوشاک آوا',
    amountLabel: '۷۰۰٬۰۰۰ تومان',
    rateLabel: '۲۰٪',
    status: 'reversed',
    periodLabel: 'فروردین ۱۴۰۴',
    createdAt: '1404-01-15',
  },
  {
    id: 'c-105',
    referralStoreName: 'لوازم خانگی مهر',
    amountLabel: '۹۸۰٬۰۰۰ تومان',
    rateLabel: '۲۰٪',
    status: 'paid',
    periodLabel: 'اردیبهشت ۱۴۰۴',
    createdAt: '1404-02-28',
  },
];

export const AFFILIATE_PAYOUTS: readonly AffiliatePayout[] = [
  {
    id: 'ap-01',
    amountLabel: '۴٬۳۰۰٬۰۰۰ تومان',
    method: 'bank_iban',
    maskedDestination: 'شبا •••• ۹۸۷۶',
    status: 'approved',
    requestedAt: '1404-03-26',
  },
  {
    id: 'ap-02',
    amountLabel: '۵٬۶۰۰٬۰۰۰ تومان',
    method: 'bank_card',
    maskedDestination: 'کارت •••• ۴۳۲۱',
    status: 'paid',
    requestedAt: '1404-02-12',
    paidAt: '1404-02-15',
  },
  {
    id: 'ap-03',
    amountLabel: '۳٬۱۰۰٬۰۰۰ تومان',
    method: 'bank_card',
    maskedDestination: 'کارت •••• ۴۳۲۱',
    status: 'paid',
    requestedAt: '1404-01-10',
    paidAt: '1404-01-13',
  },
];

export const AFFILIATE_OVERVIEW: AffiliateOverview = {
  totalEarnedLabel: '۲۸٬۹۰۰٬۰۰۰ تومان',
  pendingLabel: '۴٬۳۰۰٬۰۰۰ تومان',
  paidLabel: '۲۴٬۶۰۰٬۰۰۰ تومان',
  thisMonthLabel: '۱٬۹۶۰٬۰۰۰ تومان',
  availableLabel: '۴٬۳۰۰٬۰۰۰ تومان',
  referralsTotal: AFFILIATE_REFERRALS.length,
  referralsActive: AFFILIATE_REFERRALS.filter((r) => r.status === 'active').length,
  conversionRateLabel: '۶۴٪',
};
