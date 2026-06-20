/**
 * HTTP Customer adapter — reads the active site's customers from the backend read-model and maps
 * them onto the app's Customer domain type (display name + aggregates; PII minimized).
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type { Customer, CustomerListQuery, Paged } from '@/domain/types';

import type { CustomerAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendCustomer {
  external_id: string;
  display_name: string | null;
  orders_count: number;
  total_spent_minor: number | string;
  currency: string;
}

function toCustomer(c: BackendCustomer): Customer {
  const [firstName, ...rest] = (c.display_name ?? '').split(' ');
  const now = new Date().toISOString();
  return {
    id: c.external_id,
    firstName: firstName ?? '',
    lastName: rest.join(' '),
    email: '',
    username: c.display_name ?? c.external_id,
    role: 'customer',
    ordersCount: c.orders_count,
    totalSpent: minorToMoney(c.total_spent_minor, c.currency),
    currency: c.currency,
    dateCreated: now,
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
        `/merchant/sites/${siteId()}/customers${qs({ page: query.page, pageSize: query.pageSize })}`,
      );
      return {
        items: res.items.map(toCustomer),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
      };
    },
    async getCustomer(id: string): Promise<Customer> {
      // The backend exposes a list read-model; find the customer within it.
      const res = await http.get<{ items: BackendCustomer[] }>(
        `/merchant/sites/${siteId()}/customers${qs({ pageSize: 100 })}`,
      );
      const found = res.items.find((c) => c.external_id === id);
      if (!found) throw new Error(`Customer not found: ${id}`);
      return toCustomer(found);
    },
  };
}
