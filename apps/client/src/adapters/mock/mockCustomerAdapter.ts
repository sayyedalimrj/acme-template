/**
 * Mock Customer adapter — list (with search + pagination) and get-by-id.
 */
import { customers } from '@/mock/data/customers';
import type { Customer, CustomerListQuery, Paged } from '@/domain/types';

import type { CustomerAdapter } from '../types';
import { siteScopedView } from './mockActiveSite';
import { clone, delay, paginate } from './mockUtils';

function applyFilters(items: Customer[], query: CustomerListQuery): Customer[] {
  if (!query.search) {
    return items;
  }
  const q = query.search.toLowerCase();
  return items.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q),
  );
}

export function createMockCustomerAdapter(): CustomerAdapter {
  return {
    async listCustomers(query: CustomerListQuery = {}): Promise<Paged<Customer>> {
      await delay();
      // Per-store view so switching the active site changes the customer list.
      const scoped = siteScopedView(customers);
      const filtered = applyFilters(scoped, query);
      return clone(paginate(filtered, query.page, query.pageSize));
    },
    async getCustomer(id: string): Promise<Customer> {
      await delay();
      const found = customers.find((c) => c.id === id);
      if (!found) {
        throw new Error(`Customer not found: ${id}`);
      }
      return clone(found);
    },
  };
}
