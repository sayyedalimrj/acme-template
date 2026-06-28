/**
 * HTTP Customer adapter — reads the active site's customers from the backend read-model.
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type {
  Customer,
  CustomerListQuery,
  CustomerOrderSummary,
  ISODate,
  OrderStatus,
  Paged,
} from '@/domain/types';

import type { CustomerAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendCustomer {
  external_id: string;
  display_name: string | null;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  orders_count: number;
  total_spent_minor: number | string;
  currency: string;
  external_created_at?: string | null;
}

interface BackendOrderSummary {
  external_id: string;
  number: string | null;
  status: string | null;
  total_minor: number | string;
  currency: string;
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

function mapRecentOrder(o: BackendOrderSummary): CustomerOrderSummary {
  const status: OrderStatus = ORDER_STATUSES.includes(o.status as OrderStatus)
    ? (o.status as OrderStatus)
    : 'pending';
  const created = o.external_created_at ?? new Date().toISOString();
  return {
    orderId: o.external_id,
    number: o.number ?? o.external_id,
    status,
    total: minorToMoney(o.total_minor, o.currency),
    currency: o.currency,
    dateCreated: created,
  };
}

function toCustomer(c: BackendCustomer, recentOrders?: CustomerOrderSummary[]): Customer {
  const [firstName, ...rest] = (c.display_name ?? '').split(' ');
  const created = c.external_created_at ?? new Date().toISOString();
  return {
    id: c.external_id,
    firstName: firstName ?? '',
    lastName: rest.join(' '),
    email: c.email ?? '',
    phone: c.phone ?? undefined,
    username: c.username ?? c.display_name ?? c.external_id,
    role: 'customer',
    ordersCount: c.orders_count,
    totalSpent: minorToMoney(c.total_spent_minor, c.currency),
    currency: c.currency,
    dateCreated: created,
    recentOrders,
    lastOrderDate: recentOrders?.[0]?.dateCreated as ISODate | undefined,
  };
}

function siteId(): string {
  const id = getActiveHttpSiteId();
  if (!id) throw new Error('هیچ فروشگاهی انتخاب نشده است.');
  return id;
}

export function createHttpCustomerAdapter(): CustomerAdapter {
  return {
    async listCustomers(query: CustomerListQuery = {}): Promise<Paged<Customer>> {
      const res = await http.get<{ items: BackendCustomer[]; page: number; pageSize: number; total: number }>(
        `/merchant/sites/${siteId()}/customers${qs({
          page: query.page,
          pageSize: query.pageSize,
          search: query.search,
        })}`,
      );
      return {
        items: res.items.map((c) => toCustomer(c)),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
      };
    },
    async getCustomer(id: string): Promise<Customer> {
      const res = await http.get<{ customer: BackendCustomer; recentOrders: BackendOrderSummary[] }>(
        `/merchant/sites/${siteId()}/customers/${encodeURIComponent(id)}`,
      );
      const recent = (res.recentOrders ?? []).map(mapRecentOrder);
      return toCustomer(res.customer, recent);
    },
  };
}
