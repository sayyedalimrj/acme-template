/**
 * Support service — ticket creation, threaded replies, truthful unread counters, tenant isolation.
 * `db` is mocked; we assert the SQL the service emits (unread direction, status transition, scoping).
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

import { query, queryOne } from '../db';
import {
  addMessage,
  createTicket,
  getTicket,
  markRead,
  unreadCount,
} from '../services/supportService';

const mq = query as jest.MockedFunction<typeof query>;
const mqo = queryOne as jest.MockedFunction<typeof queryOne>;

beforeEach(() => {
  mq.mockReset();
  mqo.mockReset();
});

describe('supportService', () => {
  it('createTicket inserts the ticket (admin_unread=1) plus a merchant first message', async () => {
    mq.mockResolvedValueOnce([{ id: 't1', tenant_id: 'tn1', status: 'open', admin_unread: 1 }] as never);
    mq.mockResolvedValueOnce([{ id: 'm1', ticket_id: 't1', sender_role: 'merchant' }] as never);
    const r = await createTicket({ tenantId: 'tn1', userId: 'u1', subject: 's', body: 'b' });
    expect(r.ticket.id).toBe('t1');
    expect(mq.mock.calls[0][0] as string).toContain('INSERT INTO support_ticket');
    expect(mq.mock.calls[0][0] as string).toContain('admin_unread');
    expect(mq.mock.calls[1][0] as string).toContain("'merchant'");
  });

  it('an admin reply increments merchant_unread and moves open → in_progress', async () => {
    mqo.mockResolvedValueOnce({ id: 't1', tenant_id: 'tn1', status: 'open' } as never); // getTicket
    mq.mockResolvedValueOnce([{ id: 'm2', sender_role: 'admin' }] as never); // insert message
    mq.mockResolvedValueOnce([] as never); // update ticket
    await addMessage('t1', { senderRole: 'admin', userId: 'a1', body: 'hi' });
    const updateSql = mq.mock.calls[1][0] as string;
    expect(updateSql).toContain('merchant_unread = merchant_unread + 1');
    expect(updateSql).toContain("status = 'open'"); // CASE WHEN open THEN in_progress
  });

  it('a merchant reply increments admin_unread', async () => {
    mqo.mockResolvedValueOnce({ id: 't1', tenant_id: 'tn1', status: 'in_progress' } as never);
    mq.mockResolvedValueOnce([{ id: 'm3', sender_role: 'merchant' }] as never);
    mq.mockResolvedValueOnce([] as never);
    await addMessage('t1', { senderRole: 'merchant', userId: 'u1', body: 'hi' }, { tenantId: 'tn1' });
    expect(mq.mock.calls[1][0] as string).toContain('admin_unread = admin_unread + 1');
  });

  it('getTicket enforces tenant ownership (cross-tenant → not_found)', async () => {
    mqo.mockResolvedValueOnce({ id: 't1', tenant_id: 'OTHER' } as never);
    await expect(getTicket('t1', { tenantId: 'tn1' })).rejects.toMatchObject({ code: 'not_found' });
  });

  it('markRead(merchant) resets the merchant_unread counter', async () => {
    mqo.mockResolvedValueOnce({ id: 't1', tenant_id: 'tn1' } as never); // getTicket guard
    mq.mockResolvedValueOnce([] as never);
    await markRead('t1', 'merchant', { tenantId: 'tn1' });
    expect(mq.mock.calls[0][0] as string).toContain('merchant_unread = 0');
  });

  it('unreadCount: merchant sums merchant_unread for the tenant; admin counts unread tickets', async () => {
    mqo.mockResolvedValueOnce({ n: '3' } as never);
    expect(await unreadCount({ tenantId: 'tn1' })).toBe(3);
    expect(mqo.mock.calls[0][0] as string).toContain('sum(merchant_unread)');

    mqo.mockResolvedValueOnce({ n: '2' } as never);
    expect(await unreadCount({})).toBe(2);
    expect(mqo.mock.calls[1][0] as string).toContain('admin_unread > 0');
  });
});
