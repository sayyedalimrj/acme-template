/**
 * Affiliate display helpers — pure status → Persian label + UI tone maps.
 */
import type { CommissionStatus, ReferralStatus } from '@/domain/affiliate';
import type { StatusMeta } from '@/features/admin/adminFormat';

export function referralStatusMeta(status: ReferralStatus): StatusMeta {
  switch (status) {
    case 'active':
      return { label: 'فعال', tone: 'success' };
    case 'trial':
      return { label: 'آزمایشی', tone: 'info' };
    case 'lead':
      return { label: 'سرنخ', tone: 'warning' };
    case 'churned':
      return { label: 'از دست رفته', tone: 'neutral' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

export function commissionStatusMeta(status: CommissionStatus): StatusMeta {
  switch (status) {
    case 'pending':
      return { label: 'در انتظار', tone: 'warning' };
    case 'approved':
      return { label: 'تأیید شده', tone: 'info' };
    case 'paid':
      return { label: 'پرداخت شد', tone: 'success' };
    case 'reversed':
      return { label: 'برگشت خورده', tone: 'danger' };
    default:
      return { label: status, tone: 'neutral' };
  }
}
