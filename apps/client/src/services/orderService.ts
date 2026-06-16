/**
 * Order service — thin wrapper over the active OrderAdapter (read-only in the MVP).
 */
import { getAdapters } from '@/adapters';
import type { Order, OrderListQuery, Paged } from '@/domain/types';

export const orderService = {
  listOrders(query?: OrderListQuery): Promise<Paged<Order>> {
    return getAdapters().orders.listOrders(query);
  },
  getOrder(id: string): Promise<Order> {
    return getAdapters().orders.getOrder(id);
  },
};
