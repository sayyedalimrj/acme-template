/**
 * Support service — real merchant <-> admin tickets/messages backed by Postgres.
 *
 * Merchants create + reply to tickets scoped to their tenant; admins see and reply to all tickets.
 * Unread counters are truthful: a side's counter increases when the OTHER side posts and resets to
 * 0 when that side reads the thread. No fabricated counts.
 */
import { query, queryOne } from '../db';
import { notFound } from '../util/errors';

export type SupportStatus = 'open' | 'in_progress' | 'closed';
export type SupportSenderRole = 'merchant' | 'admin' | 'system';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  site_id: string | null;
  created_by: string | null;
  subject: string;
  category: string;
  status: SupportStatus;
  merchant_unread: number;
  admin_unread: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_role: SupportSenderRole;
  sender_user_id: string | null;
  body: string;
  created_at: string;
}

const TICKET_COLS = `id, tenant_id, site_id, created_by, subject, category, status,
  merchant_unread, admin_unread, last_message_at, created_at, updated_at`;

/** Create a ticket with its first (merchant) message. Marks it unread for admins. */
export async function createTicket(input: {
  tenantId: string;
  siteId?: string | null;
  userId: string;
  subject: string;
  category?: string;
  body: string;
}): Promise<{ ticket: SupportTicket; message: SupportMessage }> {
  const ticket = (
    await query<SupportTicket>(
      `INSERT INTO support_ticket (tenant_id, site_id, created_by, subject, category, status, admin_unread, last_message_at)
         VALUES ($1, $2, $3, $4, $5, 'open', 1, now())
       RETURNING ${TICKET_COLS}`,
      [input.tenantId, input.siteId ?? null, input.userId, input.subject, input.category ?? 'general'],
    )
  )[0];
  const message = (
    await query<SupportMessage>(
      `INSERT INTO support_message (ticket_id, sender_role, sender_user_id, body)
         VALUES ($1, 'merchant', $2, $3)
       RETURNING id, ticket_id, sender_role, sender_user_id, body, created_at`,
      [ticket.id, input.userId, input.body],
    )
  )[0];
  return { ticket, message };
}

/** List tickets. Merchants pass their tenantId (own tickets only); admins omit it (all tickets). */
export async function listTickets(opts: {
  tenantId?: string;
  status?: SupportStatus;
  limit?: number;
  offset?: number;
}): Promise<SupportTicket[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.tenantId) {
    params.push(opts.tenantId);
    where.push(`tenant_id = $${params.length}`);
  }
  if (opts.status) {
    params.push(opts.status);
    where.push(`status = $${params.length}`);
  }
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const offset = Math.max(0, opts.offset ?? 0);
  params.push(limit, offset);
  return query<SupportTicket>(
    `SELECT ${TICKET_COLS} FROM support_ticket
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY last_message_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
}

/** Fetch a single ticket. When `tenantId` is given (merchant), enforces ownership. */
export async function getTicket(
  ticketId: string,
  opts: { tenantId?: string } = {},
): Promise<SupportTicket> {
  const ticket = await queryOne<SupportTicket>(
    `SELECT ${TICKET_COLS} FROM support_ticket WHERE id = $1`,
    [ticketId],
  );
  if (!ticket || (opts.tenantId && ticket.tenant_id !== opts.tenantId)) {
    throw notFound('تیکت پشتیبانی یافت نشد.');
  }
  return ticket;
}

export async function getMessages(ticketId: string): Promise<SupportMessage[]> {
  return query<SupportMessage>(
    `SELECT id, ticket_id, sender_role, sender_user_id, body, created_at
       FROM support_message WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [ticketId],
  );
}

/**
 * Append a message. Bumps `last_message_at`, increments the OTHER side's unread counter, and (for
 * an admin reply) moves an 'open' ticket to 'in_progress'. Ownership is enforced via getTicket.
 */
export async function addMessage(
  ticketId: string,
  input: { senderRole: SupportSenderRole; userId: string | null; body: string },
  opts: { tenantId?: string } = {},
): Promise<SupportMessage> {
  const ticket = await getTicket(ticketId, opts);
  const message = (
    await query<SupportMessage>(
      `INSERT INTO support_message (ticket_id, sender_role, sender_user_id, body)
         VALUES ($1, $2, $3, $4)
       RETURNING id, ticket_id, sender_role, sender_user_id, body, created_at`,
      [ticket.id, input.senderRole, input.userId, input.body],
    )
  )[0];
  if (input.senderRole === 'merchant') {
    await query(
      `UPDATE support_ticket SET admin_unread = admin_unread + 1, last_message_at = now(), updated_at = now()
         WHERE id = $1`,
      [ticket.id],
    );
  } else {
    // admin/system reply → unread for the merchant; an open ticket becomes in_progress.
    await query(
      `UPDATE support_ticket
          SET merchant_unread = merchant_unread + 1, last_message_at = now(), updated_at = now(),
              status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
         WHERE id = $1`,
      [ticket.id],
    );
  }
  return message;
}

/** Reset a side's unread counter when that side opens the thread. */
export async function markRead(
  ticketId: string,
  role: 'merchant' | 'admin',
  opts: { tenantId?: string } = {},
): Promise<void> {
  await getTicket(ticketId, opts); // ownership guard
  const col = role === 'merchant' ? 'merchant_unread' : 'admin_unread';
  await query(`UPDATE support_ticket SET ${col} = 0, updated_at = now() WHERE id = $1`, [ticketId]);
}

export async function setStatus(ticketId: string, status: SupportStatus): Promise<SupportTicket> {
  const ticket = await queryOne<SupportTicket>(
    `UPDATE support_ticket SET status = $2, updated_at = now() WHERE id = $1 RETURNING ${TICKET_COLS}`,
    [ticketId, status],
  );
  if (!ticket) throw notFound('تیکت پشتیبانی یافت نشد.');
  return ticket;
}

/**
 * Truthful unread badge source. Merchant: total unseen admin/system replies across their tenant's
 * tickets. Admin: number of tickets with at least one unseen merchant message.
 */
export async function unreadCount(opts: { tenantId?: string }): Promise<number> {
  if (opts.tenantId) {
    const row = await queryOne<{ n: string }>(
      `SELECT COALESCE(sum(merchant_unread), 0)::text AS n FROM support_ticket WHERE tenant_id = $1`,
      [opts.tenantId],
    );
    return Number(row?.n ?? 0);
  }
  const row = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM support_ticket WHERE admin_unread > 0`,
  );
  return Number(row?.n ?? 0);
}
