/**
 * Admin display helpers — pure functions mapping statuses to Persian labels + UI tones.
 *
 * Pure and dependency-free (no React) so they are trivial to unit-test and reuse across the
 * admin screens.
 */
import type { OrderStatus } from '@/domain/types';
import type {
  MarketerStatus,
  MerchantAccountStatus,
  PayoutMethod,
  PayoutRequestStatus,
} from '@/domain/admin';
import type { StatusTone } from '@/features/mobile/components';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export function merchantStatusMeta(status: MerchantAccountStatus): StatusMeta {
  switch (status) {
    case 'active':
      return { label: 'فعال', tone: 'success' };
    case 'trial':
      return { label: 'آزمایشی', tone: 'info' };
    case 'past_due':
      return { label: 'پرداخت معوق', tone: 'warning' };
    case 'suspended':
      return { label: 'معلق', tone: 'danger' };
    case 'canceled':
      return { label: 'لغو شده', tone: 'neutral' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

export function orderStatusMeta(status: OrderStatus): StatusMeta {
  switch (status) {
    case 'completed':
      return { label: 'تکمیل شده', tone: 'success' };
    case 'processing':
      return { label: 'در حال پردازش', tone: 'info' };
    case 'pending':
      return { label: 'در انتظار', tone: 'warning' };
    case 'on-hold':
      return { label: 'در انتظار بررسی', tone: 'warning' };
    case 'refunded':
      return { label: 'بازپرداخت', tone: 'neutral' };
    case 'cancelled':
      return { label: 'لغو شده', tone: 'danger' };
    case 'failed':
      return { label: 'ناموفق', tone: 'danger' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

export function marketerStatusMeta(status: MarketerStatus): StatusMeta {
  return status === 'active'
    ? { label: 'فعال', tone: 'success' }
    : { label: 'متوقف', tone: 'neutral' };
}

export function payoutStatusMeta(status: PayoutRequestStatus): StatusMeta {
  switch (status) {
    case 'requested':
      return { label: 'در انتظار تأیید', tone: 'warning' };
    case 'approved':
      return { label: 'تأیید شده', tone: 'info' };
    case 'paid':
      return { label: 'پرداخت شد', tone: 'success' };
    case 'rejected':
      return { label: 'رد شده', tone: 'danger' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

export function payoutMethodLabel(method: PayoutMethod): string {
  switch (method) {
    case 'bank_card':
      return 'کارت بانکی';
    case 'bank_iban':
      return 'شبا';
    case 'wallet':
      return 'کیف پول';
    default:
      return method;
  }
}
