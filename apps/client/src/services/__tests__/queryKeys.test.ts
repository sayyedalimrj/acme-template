import { describe, expect, it } from '@jest/globals';

import { queryKeys } from '@/services';

describe('queryKeys', () => {
  it('builds global keys for session and sites', () => {
    expect(queryKeys.session()).toEqual(['session']);
    expect(queryKeys.sites()).toEqual(['sites']);
    expect(queryKeys.activeSite()).toEqual(['sites', 'active']);
  });

  it('namespaces store data by site id (site-aware)', () => {
    expect(queryKeys.dashboard('site_demo')).toEqual(['site', 'site_demo', 'dashboard']);
    expect(queryKeys.product('site_demo', 'prod_1')).toEqual([
      'site',
      'site_demo',
      'product',
      'prod_1',
    ]);
    expect(queryKeys.order('site_demo', 'order_1')).toEqual([
      'site',
      'site_demo',
      'order',
      'order_1',
    ]);
    expect(queryKeys.customer('site_demo', 'cust_1')).toEqual([
      'site',
      'site_demo',
      'customer',
      'cust_1',
    ]);
  });

  it('includes the query object in list keys and isolates by site', () => {
    const a = queryKeys.products('site_a', { status: 'publish' });
    const b = queryKeys.products('site_b', { status: 'publish' });
    expect(a).toEqual(['site', 'site_a', 'products', { status: 'publish' }]);
    expect(a).not.toEqual(b);

    // Defaults to an empty object when no query is provided.
    expect(queryKeys.orders('site_a')).toEqual(['site', 'site_a', 'orders', {}]);
  });
});
