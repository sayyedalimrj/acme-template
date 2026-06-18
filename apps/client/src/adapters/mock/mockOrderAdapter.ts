/**
 * Mock Order adapter — list (with filters + pagination) and get-by-id.
 */
import { orders } from '@/mock/data/orders';
import type { Order, OrderListQuery, Paged } from '@/domain/types';

import type { OrderAdapter } from '../types';
import { siteScopedView } from './mockActiveSite';
import { clone, delay, paginate } from './mockUtils';

function applyFilters(items: Order[], query: OrderListQuery): Order[] {
  let result = items;
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        `${o.billing.firstName} ${o.billing.lastName}`.toLowerCase().includes(q) ||
        o.billing.email.toLowerCase().includes(q),
    );
  }
  if (query.status) {
    result = result.filter((o) => o.status === query.status);
  }
  if (query.fulfillment) {
    result = result.filter((o) => o.fulfillment === query.fulfillment);
  }
  if (query.customerId) {
    result = result.filter((o) => o.customerId === query.customerId);
  }
  if (query.dateFrom) {
    result = result.filter((o) => o.dateCreated >= query.dateFrom!);
  }
  if (query.dateTo) {
    result = result.filter((o) => o.dateCreated <= query.dateTo!);
  }
  return result;
}

export function createMockOrderAdapter(): OrderAdapter {
  return {
    async listOrders(query: OrderListQuery = {}): Promise<Paged<Order>> {
      await delay();
      // Per-store view so switching the active site changes the orders list.
      const filtered = applyFilters(siteScopedView(orders), query).sort((a, b) =>
        b.dateCreated.localeCompare(a.dateCreated),
      );
      return clone(paginate(filtered, query.page, query.pageSize));
    },
    async getOrder(id: string): Promise<Order> {
      await delay();
      const found = orders.find((o) => o.id === id);
      if (!found) {
        throw new Error(`Order not found: ${id}`);
      }
      return clone(found);
    },
  };
}
