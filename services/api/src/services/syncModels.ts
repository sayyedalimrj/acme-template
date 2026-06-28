/**
 * Shared upsert helpers for synced read-model rows (orders, customers).
 * Used by REST sync, plugin ingest, and webhooks so all paths persist the same shape.
 */
import { query } from '../db';
import type { NormalizedCustomer, NormalizedOrder } from './woocommerce/wooClient';

export async function upsertSyncedOrder(
  siteId: string,
  tenantId: string,
  o: NormalizedOrder,
): Promise<void> {
  await query(
    `INSERT INTO synced_order (
       site_id, tenant_id, external_id, number, status,
       total_minor, subtotal_minor, tax_minor, shipping_minor, discount_minor,
       currency, customer_name, customer_external_id, payment_method,
       line_items, billing, shipping_address,
       external_created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, now())
     ON CONFLICT (site_id, external_id) DO UPDATE SET
       number = EXCLUDED.number,
       status = EXCLUDED.status,
       total_minor = EXCLUDED.total_minor,
       subtotal_minor = EXCLUDED.subtotal_minor,
       tax_minor = EXCLUDED.tax_minor,
       shipping_minor = EXCLUDED.shipping_minor,
       discount_minor = EXCLUDED.discount_minor,
       customer_name = EXCLUDED.customer_name,
       customer_external_id = COALESCE(EXCLUDED.customer_external_id, synced_order.customer_external_id),
       payment_method = EXCLUDED.payment_method,
       line_items = EXCLUDED.line_items,
       billing = EXCLUDED.billing,
       shipping_address = EXCLUDED.shipping_address,
       external_created_at = COALESCE(EXCLUDED.external_created_at, synced_order.external_created_at),
       updated_at = now()`,
    [
      siteId,
      tenantId,
      o.externalId,
      o.number,
      o.status,
      o.totalMinor,
      o.subtotalMinor,
      o.taxMinor,
      o.shippingMinor,
      o.discountMinor,
      o.currency,
      o.customerName,
      o.customerExternalId,
      o.paymentMethodTitle,
      JSON.stringify(o.lineItems),
      JSON.stringify(o.billing),
      o.shipping ? JSON.stringify(o.shipping) : null,
      o.createdAt,
    ],
  );
}

export async function upsertSyncedCustomer(
  siteId: string,
  tenantId: string,
  c: NormalizedCustomer,
): Promise<void> {
  await query(
    `INSERT INTO synced_customer (
       site_id, tenant_id, external_id, display_name, email, phone, username,
       orders_count, total_spent_minor, currency, external_created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
     ON CONFLICT (site_id, external_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       username = EXCLUDED.username,
       orders_count = EXCLUDED.orders_count,
       total_spent_minor = EXCLUDED.total_spent_minor,
       external_created_at = EXCLUDED.external_created_at,
       updated_at = now()`,
    [
      siteId,
      tenantId,
      c.externalId,
      c.displayName,
      c.email,
      c.phone,
      c.username,
      c.ordersCount,
      c.totalSpentMinor,
      c.currency,
      c.dateCreated,
    ],
  );
}
