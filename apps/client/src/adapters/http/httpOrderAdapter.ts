/**
 * HTTP Order adapter — reads the active site's orders from the backend read-model and maps them
 * onto the app's Order domain type. The read-model is PII-minimized; line items / addresses that
 * the backend does not expose are filled with safe defaults.
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type {
  FulfillmentStatus,
  Order,
  OrderListQuery,
  OrderStatus,
  Paged,
} from '@/domain/types';

import type { OrderAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendOrder {
  external_id: string;
  number: string | null;
  status: string | null;
  total_minor: number | string;
  currency: string;
  customer_name: string | null;
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

function toOrder(o: BackendOrder): Order {
  const status: OrderStatus = ORDER_STATUSES.includes(o.status as OrderStatus)
    ? (o.status as OrderStatus)
    : 'pending';
  const total = minorToMoney(o.total_minor, o.currency);
  const zero = minorToMoney(0, o.currency);
  const created = o.external_created_at ?? new Date().toISOString();
  const [firstName, ...rest] = (o.customer_name ?? '').split(' ');
  return {
    id: o.external_id,
    number: o.number ?? o.external_id,
    status,
    fulfillment: fulfillmentFor(status),
    currency: o.currency,
    total,
    subtotal: total,
    totalTax: zero,
    shippingTotal: zero,
    discountTotal: zero,
    billing: { firstName: firstName ?? '', lastName: rest.join(' '), email: '' },
    lineItems: [],
    paymentMethodTitle: '',
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
