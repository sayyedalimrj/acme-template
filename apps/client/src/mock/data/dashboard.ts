/**
 * Mock dashboard overview ("operating home").
 *
 * Derived from the catalog/orders/customers mock data so the numbers stay self-consistent,
 * then enriched with commercial signals: inventory counts, fulfillment counts, urgent action
 * items, and a lightweight abandoned-cart summary. Demo data only; no secrets, no network.
 */
import type {
  ActionItem,
  DashboardOverview,
  FulfillmentCounts,
  TopProductEntry,
} from '@/domain/types';

import { products } from './catalog';
import { customers } from './customers';
import { orders } from './orders';

const CURRENCY = 'USD';

const lowStockThreshold = 10;
const lowStockProducts = products.filter(
  (p) => p.stockStatus === 'instock' && (p.stockQuantity ?? 0) <= lowStockThreshold,
);
const outOfStockProducts = products.filter(
  (p) => p.stockStatus === 'outofstock' || p.stockStatus === 'onbackorder',
);

const fulfillment: FulfillmentCounts = orders.reduce<FulfillmentCounts>(
  (acc, o) => {
    acc[o.fulfillment] += 1;
    return acc;
  },
  { unfulfilled: 0, partial: 0, fulfilled: 0 },
);

const topProducts: TopProductEntry[] = [...products]
  .filter((p) => (p.totalSales ?? 0) > 0)
  .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
  .slice(0, 4)
  .map((product) => {
    const unitsSold = product.totalSales ?? 0;
    const revenue = (unitsSold * Number.parseFloat(product.price)).toFixed(2);
    return { product, unitsSold, revenue };
  });

const actionItems: ActionItem[] = [
  ...outOfStockProducts.map<ActionItem>((p) => ({
    id: `act_stock_${p.id}`,
    type: p.stockStatus === 'outofstock' ? 'out_of_stock' : 'low_stock',
    severity: p.stockStatus === 'outofstock' ? 'critical' : 'warning',
    title: p.stockStatus === 'outofstock' ? 'Out of stock' : 'Backordered',
    message: `${p.name} (${p.sku}) needs restocking.`,
    date: p.dateModified,
    entity: { kind: 'product', id: p.id, label: p.name },
    actionLabel: 'Restock',
  })),
  ...lowStockProducts.map<ActionItem>((p) => ({
    id: `act_low_${p.id}`,
    type: 'low_stock',
    severity: 'warning',
    title: 'Low stock',
    message: `${p.name} is down to ${p.stockQuantity} units.`,
    date: p.dateModified,
    entity: { kind: 'product', id: p.id, label: p.name },
    actionLabel: 'Restock',
  })),
  {
    id: 'act_order_5819',
    type: 'order_on_hold',
    severity: 'warning',
    title: 'Order on hold',
    message: 'Order #5819 is awaiting payment.',
    date: '2026-06-13T16:22:00Z',
    entity: { kind: 'order', id: 'order_5819', label: '#5819' },
    actionLabel: 'Review',
  },
  {
    id: 'act_order_5818',
    type: 'order_pending',
    severity: 'info',
    title: 'New order',
    message: 'Order #5818 is pending and ready to process.',
    date: '2026-06-15T07:48:00Z',
    entity: { kind: 'order', id: 'order_5818', label: '#5818' },
    actionLabel: 'Process',
  },
];

export const dashboardOverview: DashboardOverview = {
  period: { from: '2026-05-16T00:00:00Z', to: '2026-06-15T23:59:59Z' },
  currency: CURRENCY,
  salesTotal: '48217.65',
  ordersCount: 1284,
  productsCount: products.length,
  customersCount: customers.length,
  lowStockCount: lowStockProducts.length,
  outOfStockCount: outOfStockProducts.length,
  fulfillment,
  actionItems,
  inventoryAlerts: [...outOfStockProducts, ...lowStockProducts].slice(0, 6),
  recentOrders: [...orders].sort((a, b) => b.dateCreated.localeCompare(a.dateCreated)).slice(0, 5),
  topProducts,
  activity: [
    {
      id: 'evt_1',
      type: 'order',
      message: 'Order #5821 moved to processing',
      date: '2026-06-14T18:05:00Z',
    },
    {
      id: 'evt_2',
      type: 'product',
      message: 'چراغ رومیزی لومن (گردو) به حالت پیش‌سفارش رفت',
      date: '2026-06-08T13:33:00Z',
    },
    {
      id: 'evt_3',
      type: 'customer',
      message: 'مشتری جدید: مریم احمدی',
      date: '2026-06-15T07:40:00Z',
    },
    { id: 'evt_4', type: 'order', message: 'Order #5817 refunded', date: '2026-06-12T14:30:00Z' },
  ],
  // Analytics readiness (future): conversion funnel + abandoned-cart recovery.
  conversionRate: 2.8,
  abandonedCarts: { count: 23, recoverableValue: '1842.30', currency: CURRENCY },
};
