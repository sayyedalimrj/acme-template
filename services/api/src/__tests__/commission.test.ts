/** Commission generation logic (db mocked). */
jest.mock('../db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  pool: { connect: jest.fn() },
}));

import { query, queryOne } from '../db';
import { generateCommissionForPayment } from '../services/commission';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('generateCommissionForPayment', () => {
  it('does nothing when the tenant was not referred', async () => {
    mockedQueryOne.mockResolvedValueOnce(null as never);
    const res = await generateCommissionForPayment({
      tenantId: 't1',
      amountMinor: 1_000_000,
      currency: 'IRT',
      period: '2026-01',
    });
    expect(res.created).toBe(false);
  });

  it('creates a commission at the marketer rate (20%)', async () => {
    mockedQueryOne.mockResolvedValueOnce({ id: 'ref1', marketer_id: 'mk1', rate_bps: 2000 } as never);
    mockedQuery.mockResolvedValueOnce([{ id: 'comm1' }] as never);
    const res = await generateCommissionForPayment({
      tenantId: 't1',
      amountMinor: 1_000_000,
      currency: 'IRT',
      period: '2026-01',
    });
    expect(res).toMatchObject({ created: true, commissionId: 'comm1', amountMinor: 200_000 });
  });

  it('is idempotent (duplicate period → no new row)', async () => {
    mockedQueryOne.mockResolvedValueOnce({ id: 'ref1', marketer_id: 'mk1', rate_bps: 2000 } as never);
    mockedQuery.mockResolvedValueOnce([] as never); // ON CONFLICT DO NOTHING
    const res = await generateCommissionForPayment({
      tenantId: 't1',
      amountMinor: 1_000_000,
      currency: 'IRT',
      period: '2026-01',
    });
    expect(res.created).toBe(false);
  });
});
