/** Cross-portal / unauthenticated access returns 401/403 (enforced before any DB access). */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

import request from 'supertest';

import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';

const app = createApp();

const merchantToken = signToken({ sub: 'm1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const affiliateToken = signToken({ sub: 'a1', role: 'affiliate', portal: 'affiliate' });
const adminToken = signToken({ sub: 'ad1', role: 'platform_admin', portal: 'admin', tenantId: null });

describe('health', () => {
  it('is public', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('unauthenticated', () => {
  it('rejects admin/merchant/affiliate without a token (401)', async () => {
    expect((await request(app).get('/admin/overview')).status).toBe(401);
    expect((await request(app).get('/merchant/overview')).status).toBe(401);
    expect((await request(app).get('/affiliate/overview')).status).toBe(401);
  });
});

describe('cross-portal isolation', () => {
  it('merchant token cannot reach admin or affiliate (403)', async () => {
    expect((await request(app).get('/admin/overview').set('Authorization', `Bearer ${merchantToken}`)).status).toBe(403);
    expect((await request(app).get('/affiliate/overview').set('Authorization', `Bearer ${merchantToken}`)).status).toBe(403);
  });

  it('affiliate token cannot reach admin or merchant (403)', async () => {
    expect((await request(app).get('/admin/overview').set('Authorization', `Bearer ${affiliateToken}`)).status).toBe(403);
    expect((await request(app).get('/merchant/overview').set('Authorization', `Bearer ${affiliateToken}`)).status).toBe(403);
  });

  it('admin token cannot use the merchant portal token scope (403 on requirePortal)', async () => {
    // admin token has portal=admin; merchant routes require portal=merchant.
    expect((await request(app).get('/merchant/overview').set('Authorization', `Bearer ${adminToken}`)).status).toBe(403);
  });
});

describe('plugin + webhook endpoints reject unsigned requests', () => {
  it('plugin sync without signature → 401', async () => {
    const res = await request(app).post('/plugin/sync').send({ schemaVersion: 'wcos.sync.v1' });
    expect(res.status).toBe(401);
  });
});
