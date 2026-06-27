/**
 * HTTP Order adapter — reads the active site's orders from the backend read-model and maps them
 * onto the app's Order domain type with line items, billing, and totals when synced.
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type {
  BillingAddress,
  FulfillmentStatus,
  Order,
  OrderLineItem,
  OrderListQuery,
  OrderStatus,
  Paged,
} from '@/domain/types';

import type { OrderAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendLineItem {
  externalId?: string;
  productId?: string;
  name?: string;
  sku?: string | null;
  quantity?: number;
  priceMinor?: number;
  totalMinor?: number;
}

interface BackendAddress {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  address1?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface BackendOrder {
  external_id: string;
  number: string | null;
  status: string | null;
  total_minor: number | string;
  subtotal_minor?: number | string;
  tax_minor?: number | string;
  shipping_minor?: number | string;
  discount_minor?: number | string;
  currency: string;
  customer_name: string | null;
  payment_method?: string | null;
  line_items?: BackendLineItem[] | null;
  billing?: BackendAddress | null;
  shipping_address?: BackendAddress | null;
  external_created_at: string | null;
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'on-hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

function fulfillmentFor(status: OrderStatus): FulfillmentStatus {
  if (status === 'completed') return 'fulfilled';
  if (status === 'processing') return 'partial';
  return 'unfulfilled';
}

function mapBilling(b: BackendAddress | null | undefined, fallbackName: string): BillingAddress {
  if (b) {
    return {
      firstName: b.firstName ?? '',
      lastName: b.lastName ?? '',
      email: b.email ?? '',
      phone: b.phone ?? undefined,
      address1: b.address1 ?? undefined,
      city: b.city ?? undefined,
      postcode: b.postcode ?? undefined,
      country: b.country ?? undefined,
    };
  }
  const [firstName, ...rest] = fallbackName.split(' ');
  return { firstName: firstName ?? '', lastName: rest.join(' '), email: '' };
}

function mapLineItems(items: BackendLineItem[] | null | undefined, currency: string): OrderLineItem[] {
  return (items ?? []).map((li) => ({
    id: String(li.externalId ?? ''),
    productId: String(li.productId ?? ''),
    name: String(li.name ?? ''),
    sku: li.sku ?? '',
    quantity: Number(li.quantity ?? 0),
    price: minorToMoney(li.priceMinor ?? 0, currency),
    total: minorToMoney(li.totalMinor ?? 0, currency),
  }));
}

function toOrder(o: BackendOrder): Order {
  const status: OrderStatus = ORDER_STATUSES.includes(o.status as OrderStatus)
    ? (o.status as OrderStatus)
    : 'pending';
  const currency = o.currency;
  const total = minorToMoney(o.total_minor, currency);
  const created = o.external_created_at ?? new Date().toISOString();
  const fallbackName = o.customer_name ?? '';
  return {
    id: o.external_id,
    number: o.number ?? o.external_id,
    status,
    fulfillment: fulfillmentFor(status),
    currency,
    total,
    subtotal: minorToMoney(o.subtotal_minor ?? o.total_minor, currency),
    totalTax: minorToMoney(o.tax_minor ?? 0, currency),
    shippingTotal: minorToMoney(o.shipping_minor ?? 0, currency),
    discountTotal: minorToMoney(o.discount_minor ?? 0, currency),
    billing: mapBilling(o.billing, fallbackName),
    shipping: o.shipping_address
      ? {
          method: '',
          status: fulfillmentFor(status),
        }
      : undefined,
    lineItems: mapLineItems(o.line_items, currency),
    paymentMethodTitle: o.payment_method ?? '',
    statusHistory: [{ status, date: created }],
    dateCreated: created,
    dateModified: created,
  };
}

function siteId(): string {
  const id = getActiveHttpSiteId();
  if (!id) throw new Error('هیچ فروشگاهی انتخاب نشده است.');
  return id;
}

export function createHttpOrderAdapter(): OrderAdapter {
  return {
    async listOrders(query: OrderListQuery = {}): Promise<Paged<Order>> {
      const res = await http.get<{ items: BackendOrder[]; page: number; pageSize: number; total: number }>(
        `/merchant/sites/${siteId()}/orders${qs({ page: query.page, pageSize: query.pageSize, status: query.status })}`,
      );
      return {
        items: res.items.map(toOrder),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
      };
    },
    async getOrder(id: string): Promise<Order> {
      const res = await http.get<{ order: BackendOrder }>(
        `/merchant/sites/${siteId()}/orders/${encodeURIComponent(id)}`,
      );
      return toOrder(res.order);
    },
  };
}
