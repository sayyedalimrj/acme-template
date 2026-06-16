import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import {
  authService,
  customerService,
  dashboardService,
  orderService,
  productService,
  siteService,
} from '@/services';

// Reset cached (stateful) mock adapters before each test so auth/site state is isolated.
beforeEach(() => {
  resetAdaptersForTests();
});

describe('dashboardService', () => {
  it('returns an overview with commercial signals', async () => {
    const overview = await dashboardService.getOverview();
    expect(overview.productsCount).toBeGreaterThan(0);
    expect(overview.recentOrders.length).toBeGreaterThan(0);
    expect(overview.topProducts.length).toBeGreaterThan(0);
    expect(overview.actionItems.length).toBeGreaterThan(0);
    expect(overview.fulfillment).toHaveProperty('unfulfilled');
    expect(typeof overview.salesTotal).toBe('string');
  });
});

describe('productService', () => {
  it('lists products with pagination metadata', async () => {
    const page = await productService.listProducts();
    expect(page.items.length).toBe(page.total);
    expect(page.page).toBe(1);
    expect(page.items[0]).toHaveProperty('sku');
  });

  it('filters by status and search', async () => {
    const published = await productService.listProducts({ status: 'publish' });
    expect(published.items.every((p) => p.status === 'publish')).toBe(true);

    const search = await productService.listProducts({ search: 'tote' });
    expect(search.items.length).toBe(1);
    expect(search.items[0].name.toLowerCase()).toContain('tote');
  });

  it('gets a product by id and rejects unknown ids', async () => {
    const product = await productService.getProduct('prod_1001');
    expect(product.id).toBe('prod_1001');
    await expect(productService.getProduct('prod_does_not_exist')).rejects.toThrow();
  });
});

describe('orderService', () => {
  it('lists orders and filters by status', async () => {
    const all = await orderService.listOrders();
    expect(all.total).toBeGreaterThan(0);

    const processing = await orderService.listOrders({ status: 'processing' });
    expect(processing.items.every((o) => o.status === 'processing')).toBe(true);
  });

  it('gets an order by id including fulfillment', async () => {
    const order = await orderService.getOrder('order_5820');
    expect(order.id).toBe('order_5820');
    expect(order.fulfillment).toBe('fulfilled');
  });
});

describe('customerService', () => {
  it('lists customers and searches by name', async () => {
    const all = await customerService.listCustomers();
    expect(all.total).toBeGreaterThan(0);

    const search = await customerService.listCustomers({ search: 'priya' });
    expect(search.items.length).toBe(1);
    expect(search.items[0].firstName).toBe('Priya');
  });

  it('gets a customer by id', async () => {
    const customer = await customerService.getCustomer('cust_310');
    expect(customer.id).toBe('cust_310');
    expect(customer.email).toContain('@');
  });
});

describe('authService (mock)', () => {
  it('starts authenticated, signs out, and signs back in', async () => {
    const initial = await authService.getSession();
    expect(initial.status).toBe('authenticated');
    expect(initial.user).not.toBeNull();

    const after = await authService.signOut();
    expect(after.status).toBe('unauthenticated');
    expect(after.user).toBeNull();

    const back = await authService.signInMock({ email: 'owner@store.test' });
    expect(back.status).toBe('authenticated');
    expect(back.user?.email).toBe('owner@store.test');
  });
});

describe('siteService (mock)', () => {
  it('exposes an active site and supports switching', async () => {
    const active = await siteService.getActiveSite();
    expect(active?.id).toBe('site_demo');

    const switched = await siteService.setActiveSite('site_atelier');
    expect(switched.id).toBe('site_atelier');
    expect((await siteService.getActiveSite())?.id).toBe('site_atelier');
  });

  it('connects and disconnects a mock site without secrets', async () => {
    const before = (await siteService.listSites()).length;
    const site = await siteService.connectMockSite({
      name: 'New Store',
      url: 'https://new-store.example.test',
    });
    expect(site.status).toBe('connected');
    // No secret fields are present on the returned connection.
    expect(Object.keys(site)).not.toContain('consumerKey');
    expect((await siteService.listSites()).length).toBe(before + 1);

    await siteService.disconnectMockSite(site.id);
    expect((await siteService.listSites()).length).toBe(before);
  });
});
