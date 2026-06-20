/**
 * BillingGateway — platform subscription billing (charging merchants for the platform).
 *
 * Provider-agnostic create→redirect→verify flow. Provider secret keys live ONLY in backend env.
 * We never accept or store card data. Providers:
 *   - manual: no online gateway; payment is recorded pending and an admin marks it paid.
 *   - mock:   non-production only; settles immediately (for local/dev/e2e).
 *   - zarinpal: real Iranian gateway (requires ZARINPAL_MERCHANT_ID).
 */
import { env, isProduction } from '../../env';
import { badRequest, badGateway } from '../../util/errors';

export type BillingProvider = 'manual' | 'mock' | 'zarinpal';
export type PaymentStatus = 'pending' | 'requires_action' | 'paid' | 'failed' | 'canceled' | 'expired';

export interface CheckoutInput {
  amountMinor: number;
  currency: string;
  description: string;
  returnUrl: string;
}

export interface CheckoutSession {
  provider: BillingProvider;
  providerRef: string;
  status: PaymentStatus;
  redirectUrl?: string;
}

export interface VerifyResult {
  status: PaymentStatus;
  paidAmountMinor?: number;
  providerEventRef: string;
}

export function activeProvider(): BillingProvider {
  return env.BILLING_PROVIDER;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw badRequest('مبلغ پرداخت نامعتبر است.');
  }
  const provider = activeProvider();

  if (provider === 'mock') {
    if (isProduction) throw badRequest('درگاه آزمایشی در محیط تولید مجاز نیست.');
    return { provider, providerRef: `mock_${Date.now()}`, status: 'requires_action', redirectUrl: input.returnUrl };
  }

  if (provider === 'manual') {
    // No online redirect; an admin will confirm receipt and mark the payment paid.
    return { provider, providerRef: `manual_${Date.now()}`, status: 'pending' };
  }

  // zarinpal
  if (!env.ZARINPAL_MERCHANT_ID) throw badRequest('درگاه پرداخت پیکربندی نشده است.');
  const base = zarinpalBase();
  const res = await fetch(`${base}/pg/v4/payment/request.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: env.ZARINPAL_MERCHANT_ID,
      amount: input.amountMinor,
      description: input.description,
      callback_url: input.returnUrl,
    }),
  }).catch(() => null);
  if (!res || !res.ok) throw badGateway('ارتباط با درگاه پرداخت ناموفق بود.');
  const data = (await res.json().catch(() => ({}))) as { data?: { authority?: string; code?: number } };
  const authority = data?.data?.authority;
  if (!authority) throw badGateway('درگاه پرداخت پاسخ معتبر نداد.');
  return {
    provider,
    providerRef: authority,
    status: 'requires_action',
    redirectUrl: `${base}/pg/StartPay/${authority}`,
  };
}

export async function verifyPayment(providerRef: string, amountMinor: number): Promise<VerifyResult> {
  const provider = activeProvider();

  if (provider === 'mock') {
    return { status: 'paid', paidAmountMinor: amountMinor, providerEventRef: `mock_evt_${providerRef}` };
  }
  if (provider === 'manual') {
    // Manual verification is performed by an admin action, not here.
    return { status: 'pending', providerEventRef: `manual_evt_${providerRef}` };
  }

  if (!env.ZARINPAL_MERCHANT_ID) throw badRequest('درگاه پرداخت پیکربندی نشده است.');
  const base = zarinpalBase();
  const res = await fetch(`${base}/pg/v4/payment/verify.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: env.ZARINPAL_MERCHANT_ID,
      amount: amountMinor,
      authority: providerRef,
    }),
  }).catch(() => null);
  if (!res) throw badGateway('ارتباط با درگاه پرداخت ناموفق بود.');
  const data = (await res.json().catch(() => ({}))) as { data?: { code?: number; ref_id?: number } };
  const code = data?.data?.code;
  // 100 = success, 101 = already verified.
  if (code === 100 || code === 101) {
    return {
      status: 'paid',
      paidAmountMinor: amountMinor,
      providerEventRef: String(data?.data?.ref_id ?? providerRef),
    };
  }
  return { status: 'failed', providerEventRef: `zarinpal_fail_${providerRef}` };
}

function zarinpalBase(): string {
  return env.ZARINPAL_SANDBOX ? 'https://sandbox.zarinpal.com' : env.ZARINPAL_BASE_URL.replace(/\/+$/, '');
}
