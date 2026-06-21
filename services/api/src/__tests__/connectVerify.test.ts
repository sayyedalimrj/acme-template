/**
 * Connect / re-test (POST /merchant/sites/connect/verify) — PR60 regression guards.
 *
 *  - A masked placeholder ("••••••") is rejected (400) BEFORE any verification, so the frontend's
 *    masked display can never be sent as a real secret and stored credentials are never overwritten.
 *  - A successful verify responds without blocking on the full sync: `verifyWooConnection` is
 *    mocked to resolve immediately while the (separate) background sync is not awaited by the route.
 *
 * `db` and `services/sites` are mocked (no Postgres / no network).
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

const mockVerifyWooConnection = jest.fn();
jest.mock('../services/sites', () => {
  const actual = jest.requireActual('../services/sites');
  return {
    ...actual,
    verifyWooConnection: (...args: unknown[]) => mockVerifyWooConnection(...args),
  };
});

import request from 'supertest';

import { queryOne } from '../db';
import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';

const app = createApp();
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

const owner = signToken({ sub: 'u1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const SITE_ID = '11111111-1111-1111-1111-111111111111';
const PATH = '/merchant/sites/connect/verify';

const ownedSite = {
  id: SITE_ID, tenant_id: 't1', name: 's', url: 'https://shop.example', connection_mode: 'woo_rest',
  status: 'pending', woo_version: null, wp_version: null, currency: 'IRT',
  last_synced_at: null, last_error: null, created_at: '2026-01-01',
};

beforeEach(() => {
  mockVerifyWooConnection.mockReset();
  mockedQueryOne.mockReset();
});

describe('connect/verify — masked secret guard', () => {
  it('rejects a masked placeholder secret with 400 and never calls verification', async () => {
    const res = await request(app)
      .post(PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ siteId: SITE_ID, consumerKey: 'ck_realkey123', consumerSecret: '••••••••' });
    expect(res.status).toBe(400);
    expect(mockVerifyWooConnection).not.toHaveBeenCalled();
  });

  it('rejects an all-asterisks masked secret with 400', async () => {
    const res = await request(app)
      .post(PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ siteId: SITE_ID, consumerKey: 'ck_realkey123', consumerSecret: '********' });
    expect(res.status).toBe(400);
    expect(mockVerifyWooConnection).not.toHaveBeenCalled();
  });
});

describe('connect/verify — quick success without blocking on sync', () => {
  it('verifies and returns the connected site without awaiting a full sync', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never); // siteFor → getSite
    mockVerifyWooConnection.mockResolvedValueOnce({ ...ownedSite, status: 'connected' });
    const res = await request(app)
      .post(PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ siteId: SITE_ID, consumerKey: 'ck_realkey123', consumerSecret: 'cs_realsecret456' });
    expect(res.status).toBe(200);
    expect(res.body.site.status).toBe('connected');
    expect(mockVerifyWooConnection).toHaveBeenCalledTimes(1);
  });
});
