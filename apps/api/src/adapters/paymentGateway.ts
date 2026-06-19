/**
 * Payment gateway contract (backend skeleton).
 *
 * INTERFACE ONLY. This models how the PLATFORM charges a tenant for its own subscription
 * (plan billing) — it is NOT about a merchant's WooCommerce store checkout (that stays inside
 * the merchant's WordPress/WooCommerce site). There are no real HTTP calls, no provider SDKs,
 * no API keys, and no card data here. The future backend talks to the provider server-side
 * (keys live in backend env only) and returns frontend-safe results. The provided stub returns
 * safe `not_implemented` / `not_configured` errors.
 *
 * Design rules (binding — see `.kiro/steering/security.md`):
 *  - NEVER accept, store, log, or echo card data (PAN, CVV, expiry) or provider secret keys.
 *    Card capture happens on the provider's hosted page (redirect flow) or a provider element,
 *    never on our servers. Inputs are scanned and raw-secret-like fields are rejected.
 *  - Amounts are integer MINOR units (e.g. rials, cents) + an ISO-4217 currency, never floats.
 *  - Every call carries a `RequestContext` (tenant/user/role) and is tenant-scoped.
 *  - Mutations that move money in a privileged way (refunds, raw webhook application) are
 *    reserved for a controlled later phase and suffixed `Later`.
 *
 * The redirect/verify shape intentionally fits both global (e.g. Stripe Checkout) and common
 * Iranian gateways (e.g. Zarinpal, IDPay, NextPay), which all use "create payment → redirect to
 * the gateway → verify on return/callback".
 */
import type { RequestContext } from '../domain/permission';
import { assertNoRawSecretFields } from '../security/credentialPolicy';
import { createSafeError, type Result } from '../security/errors';

/** Supported (planned) payment providers. `mock` is for non-production demos only. */
export type PaymentProviderKind = 'stripe' | 'zarinpal' | 'idpay' | 'nextpay' | 'manual' | 'mock';

/** ISO-4217 currency code (e.g. `IRR`, `IRT` display, `USD`, `EUR`). */
export type PaymentCurrency = string;

/** Lifecycle of a platform billing payment. */
export type PaymentStatus =
  | 'requires_action' // user must complete payment on the gateway (redirect pending)
  | 'pending' // created, awaiting gateway result
  | 'authorized' // authorized but not yet captured
  | 'paid' // settled successfully
  | 'failed' // declined / error
  | 'canceled' // abandoned / canceled by user
  | 'refunded' // fully refunded
  | 'expired'; // session timed out

/** Non-secret, flat metadata that may be attached to a payment for correlation. */
export type PaymentMetadata = Record<string, string | number | boolean>;

/** Request to start a hosted-checkout payment for a tenant's subscription/plan. */
export interface CheckoutRequest {
  /** The plan being purchased/renewed (entitlement key/id; non-secret). */
  planId: string;
  /** Optional existing subscription this payment renews/upgrades. */
  subscriptionId?: string;
  /** Amount to charge, in integer MINOR units of `currency`. Must be > 0. */
  amountMinor: number;
  currency: PaymentCurrency;
  /** Customer-facing description shown on the gateway (non-secret). */
  description?: string;
  /** Where the gateway should return the user after payment (our backend callback URL). */
  returnUrl: string;
  /** Optional non-secret correlation metadata (no card data, no secrets). */
  metadata?: PaymentMetadata;
}

/** A created hosted-checkout session. The client only ever sees the redirect URL + status. */
export interface CheckoutSession {
  provider: PaymentProviderKind;
  /** Opaque, non-secret provider reference (e.g. authority/session id). */
  providerRef: string;
  status: PaymentStatus;
  /** URL to redirect the user to for payment (hosted page). Absent for non-redirect flows. */
  redirectUrl?: string;
  amountMinor: number;
  currency: PaymentCurrency;
  /** ISO timestamp when the session expires, if the provider sets one. */
  expiresAt?: string;
}

/** The verified outcome of a payment (after gateway callback/return). */
export interface PaymentVerification {
  provider: PaymentProviderKind;
  providerRef: string;
  status: PaymentStatus;
  /** Amount actually settled, in minor units (present when `status === 'paid'`). */
  paidAmountMinor?: number;
  currency?: PaymentCurrency;
  /** ISO timestamp of settlement, when paid. */
  paidAt?: string;
  /**
   * Opaque reference to the resulting billing event row (see `BillingEventRecord`). The caller
   * persists invoice METADATA only — never card data.
   */
  billingEventRef?: string;
}

/** Request to refund a previously-settled payment (controlled later phase). */
export interface RefundRequest {
  providerRef: string;
  /** Partial refund amount in minor units; omit for a full refund. */
  amountMinor?: number;
  /** Non-secret reason note for the audit log. */
  reason?: string;
}

/** Inbound provider webhook, reduced to safe METADATA only (no raw body, no secrets). */
export interface PaymentWebhookEnvelope {
  provider: PaymentProviderKind;
  /** Provider event type label (e.g. `payment.succeeded`). */
  eventType: string;
  /** Opaque, non-secret provider event id (for idempotency). */
  providerEventRef: string;
  /** ISO timestamp the webhook was received. */
  receivedAt: string;
  /** Whether a signature header was present (the value itself is never carried here). */
  signaturePresent: boolean;
}

/** Result of verifying a payment webhook signature (placeholder until keys are wired). */
export interface PaymentWebhookVerification {
  verified: boolean;
  /** Safe reason when not verified (e.g. `not_configured`, `missing_signature`). */
  reason?: 'not_configured' | 'missing_signature' | 'invalid_signature';
}

/**
 * The platform payment gateway. All provider calls happen server-side; the client only ever
 * receives a redirect URL and frontend-safe status. Card data never touches our servers.
 */
export interface PaymentGateway {
  /** Start a hosted-checkout session for a tenant subscription payment. */
  createCheckout(
    request: CheckoutRequest,
    context: RequestContext,
  ): Promise<Result<CheckoutSession>>;
  /** Verify a payment after the gateway returns/callbacks (idempotent). */
  verifyPayment(providerRef: string, context: RequestContext): Promise<Result<PaymentVerification>>;
  /** Read the current status of a payment without re-verifying side effects. */
  getPaymentStatus(
    providerRef: string,
    context: RequestContext,
  ): Promise<Result<PaymentVerification>>;
  /** Reserved for the controlled-mutation phase: issue a refund. */
  refundLater(request: RefundRequest, context: RequestContext): Promise<Result<never>>;
  /** Reserved for the controlled-mutation phase: apply a verified webhook to billing state. */
  handleWebhookLater(
    envelope: PaymentWebhookEnvelope,
    context: RequestContext,
  ): Promise<Result<never>>;
}

/** Guard: a tenant must be present on the request context. */
function requireTenant(context: RequestContext): Result<never> | null {
  if (!context || !context.tenantId || context.tenantId.trim().length === 0) {
    return {
      ok: false,
      error: createSafeError('unauthorized', 'A tenant context is required.'),
    };
  }
  return null;
}

/** Guard: amounts must be positive integers in minor units. */
function requirePositiveMinorAmount(amountMinor: number): Result<never> | null {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    return {
      ok: false,
      error: createSafeError('validation_error', 'amountMinor must be a positive integer.'),
    };
  }
  return null;
}

/** Guard: a non-empty provider reference is required. */
function requireProviderRef(providerRef: string): Result<never> | null {
  if (!providerRef || providerRef.trim().length === 0) {
    return {
      ok: false,
      error: createSafeError('validation_error', 'A providerRef is required.'),
    };
  }
  return null;
}

/**
 * Placeholder webhook signature verification. Returns `not_configured` until real provider
 * signing material is injected server-side (never committed). It NEVER returns `verified: true`
 * in the skeleton, so unsigned/unconfigured webhooks can never be trusted by mistake.
 */
export function verifyPaymentWebhookSignaturePlaceholder(
  envelope: Pick<PaymentWebhookEnvelope, 'signaturePresent'>,
): PaymentWebhookVerification {
  if (!envelope.signaturePresent) {
    return { verified: false, reason: 'missing_signature' };
  }
  return { verified: false, reason: 'not_configured' };
}

/**
 * A stub payment gateway that performs no network calls and stores nothing. It validates the
 * tenant context and obvious input shape (and rejects any raw secret-like fields), then returns
 * safe `not_implemented` errors. Safe to wire into route handlers now.
 */
export function createNotImplementedPaymentGateway(): PaymentGateway {
  return {
    createCheckout: async (request, context) => {
      const noTenant = requireTenant(context);
      if (noTenant) {
        return noTenant;
      }
      const guard = assertNoRawSecretFields(request);
      if (!guard.ok) {
        return guard as Result<never>;
      }
      const badAmount = requirePositiveMinorAmount(request.amountMinor);
      if (badAmount) {
        return badAmount;
      }
      return { ok: false, error: createSafeError('not_implemented', undefined, { operation: 'createCheckout' }) };
    },
    verifyPayment: async (providerRef, context) => {
      const noTenant = requireTenant(context);
      if (noTenant) {
        return noTenant;
      }
      const badRef = requireProviderRef(providerRef);
      if (badRef) {
        return badRef;
      }
      return { ok: false, error: createSafeError('not_implemented', undefined, { operation: 'verifyPayment' }) };
    },
    getPaymentStatus: async (providerRef, context) => {
      const noTenant = requireTenant(context);
      if (noTenant) {
        return noTenant;
      }
      const badRef = requireProviderRef(providerRef);
      if (badRef) {
        return badRef;
      }
      return { ok: false, error: createSafeError('not_implemented', undefined, { operation: 'getPaymentStatus' }) };
    },
    refundLater: async (request, context) => {
      const noTenant = requireTenant(context);
      if (noTenant) {
        return noTenant;
      }
      const guard = assertNoRawSecretFields(request);
      if (!guard.ok) {
        return guard as Result<never>;
      }
      return { ok: false, error: createSafeError('not_implemented', undefined, { operation: 'refundLater' }) };
    },
    handleWebhookLater: async (envelope, context) => {
      const noTenant = requireTenant(context);
      if (noTenant) {
        return noTenant;
      }
      const guard = assertNoRawSecretFields(envelope);
      if (!guard.ok) {
        return guard as Result<never>;
      }
      return { ok: false, error: createSafeError('not_implemented', undefined, { operation: 'handleWebhookLater' }) };
    },
  };
}
