/**
 * Customer service — thin wrapper over the active CustomerAdapter (read-only in the MVP).
 */
import { getAdapters } from '@/adapters';
import type { Customer, CustomerListQuery, Paged } from '@/domain/types';

export const customerService = {
  listCustomers(query?: CustomerListQuery): Promise<Paged<Customer>> {
    return getAdapters().customers.listCustomers(query);
  },
  getCustomer(id: string): Promise<Customer> {
    return getAdapters().customers.getCustomer(id);
  },
};
