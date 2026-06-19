/**
 * Mock customers. Demo data only — no real PII, no secrets.
 *
 * Names/emails use the reserved `example.test` domain. `recentOrders` are compact summaries
 * used by the future customer detail view.
 */
import type { Customer } from '@/domain/types';

const CURRENCY = 'USD';

export const customers: Customer[] = [
  {
    id: 'cust_310',
    firstName: 'سارا',
    lastName: 'رضایی',
    email: 'maya.brennan@example.test',
    username: 'maya.brennan',
    role: 'customer',
    ordersCount: 7,
    totalSpent: '642.18',
    currency: CURRENCY,
    lastOrderDate: '2026-06-14T18:02:00Z',
    recentOrders: [
      {
        orderId: 'order_5821',
        number: '5821',
        status: 'processing',
        total: '128.49',
        currency: CURRENCY,
        dateCreated: '2026-06-14T18:02:00Z',
      },
    ],
    dateCreated: '2024-08-12T10:00:00Z',
  },
  {
    id: 'cust_287',
    firstName: 'امیر',
    lastName: 'حسینی',
    email: 'devon.lee@example.test',
    username: 'devon.lee',
    role: 'customer',
    ordersCount: 3,
    totalSpent: '214.00',
    currency: CURRENCY,
    lastOrderDate: '2026-06-13T09:40:00Z',
    recentOrders: [
      {
        orderId: 'order_5820',
        number: '5820',
        status: 'completed',
        total: '78.00',
        currency: CURRENCY,
        dateCreated: '2026-06-13T09:40:00Z',
      },
    ],
    dateCreated: '2025-01-19T14:20:00Z',
  },
  {
    id: 'cust_142',
    firstName: 'نیلوفر',
    lastName: 'کریمی',
    email: 'priya.nair@example.test',
    username: 'priya.nair',
    role: 'customer',
    ordersCount: 12,
    totalSpent: '1284.75',
    currency: CURRENCY,
    lastOrderDate: '2026-06-13T16:22:00Z',
    recentOrders: [
      {
        orderId: 'order_5819',
        number: '5819',
        status: 'on-hold',
        total: '54.00',
        currency: CURRENCY,
        dateCreated: '2026-06-13T16:22:00Z',
      },
    ],
    dateCreated: '2024-05-03T08:45:00Z',
  },
  {
    id: 'cust_409',
    firstName: 'مریم',
    lastName: 'احمدی',
    email: 'aiko.tanaka@example.test',
    username: 'aiko.tanaka',
    role: 'customer',
    ordersCount: 1,
    totalSpent: '48.00',
    currency: CURRENCY,
    lastOrderDate: '2026-06-15T07:48:00Z',
    recentOrders: [
      {
        orderId: 'order_5818',
        number: '5818',
        status: 'pending',
        total: '48.00',
        currency: CURRENCY,
        dateCreated: '2026-06-15T07:48:00Z',
      },
    ],
    dateCreated: '2026-06-15T07:30:00Z',
  },
  {
    id: 'cust_198',
    firstName: 'رضا',
    lastName: 'محمدی',
    email: 'carlos.mendez@example.test',
    username: 'carlos.mendez',
    role: 'customer',
    ordersCount: 5,
    totalSpent: '389.50',
    currency: CURRENCY,
    lastOrderDate: '2026-06-10T10:00:00Z',
    recentOrders: [
      {
        orderId: 'order_5817',
        number: '5817',
        status: 'refunded',
        total: '32.50',
        currency: CURRENCY,
        dateCreated: '2026-06-10T10:00:00Z',
      },
    ],
    dateCreated: '2024-11-28T19:05:00Z',
  },
  {
    id: 'cust_521',
    firstName: 'زهرا',
    lastName: 'نوری',
    email: 'hannah.okoro@example.test',
    username: 'hannah.okoro',
    role: 'subscriber',
    ordersCount: 0,
    totalSpent: '0.00',
    currency: CURRENCY,
    dateCreated: '2026-06-15T06:10:00Z',
  },
];

export const customerById = (id: string): Customer => {
  const found = customers.find((c) => c.id === id);
  if (!found) throw new Error(`Mock customer not found: ${id}`);
  return found;
};
