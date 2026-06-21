/**
 * Support inbox API (http) — real merchant <-> admin tickets, backed by OUR backend.
 *
 * Merchant endpoints are tenant-scoped (own tickets); admin endpoints see all tenants. Both sides
 * read/append messages and the truthful unread count. No mock data: support is a live feature, so
 * when no API is configured the screens show an honest "available in the live app" state.
 */
import { http } from '@/services/httpClient';

export type SupportStatus = 'open' | 'in_progress' | 'closed';
export type SupportSenderRole = 'merchant' | 'admin' | 'system';

export interface SupportTicketDTO {
  id: string;
  tenant_id: string;
  subject: string;
  category: string;
  status: SupportStatus;
  merchant_unread: number;
  admin_unread: number;
  last_message_at: string;
  created_at: string;
}

export interface SupportMessageDTO {
  id: string;
  ticket_id: string;
  sender_role: SupportSenderRole;
  body: string;
  created_at: string;
}

// ---- merchant ----
export function createSupportTicket(input: {
  subject: string;
  body: string;
  category?: string;
  siteId?: string;
}): Promise<{ ticket: SupportTicketDTO; message: SupportMessageDTO }> {
  return http.post('/merchant/support/tickets', input);
}
export function listMerchantTickets(): Promise<{ tickets: SupportTicketDTO[] }> {
  return http.get('/merchant/support/tickets');
}
export function getMerchantTicket(
  id: string,
): Promise<{ ticket: SupportTicketDTO; messages: SupportMessageDTO[] }> {
  return http.get(`/merchant/support/tickets/${encodeURIComponent(id)}`);
}
export function replyMerchantTicket(id: string, body: string): Promise<{ message: SupportMessageDTO }> {
  return http.post(`/merchant/support/tickets/${encodeURIComponent(id)}/messages`, { body });
}
export function merchantSupportUnread(): Promise<{ count: number }> {
  return http.get('/merchant/support/unread-count');
}

// ---- admin ----
export function listAdminTickets(status?: SupportStatus): Promise<{ tickets: SupportTicketDTO[] }> {
  return http.get(`/admin/support/tickets${status ? `?status=${encodeURIComponent(status)}` : ''}`);
}
export function getAdminTicket(
  id: string,
): Promise<{ ticket: SupportTicketDTO; messages: SupportMessageDTO[] }> {
  return http.get(`/admin/support/tickets/${encodeURIComponent(id)}`);
}
export function replyAdminTicket(id: string, body: string): Promise<{ message: SupportMessageDTO }> {
  return http.post(`/admin/support/tickets/${encodeURIComponent(id)}/messages`, { body });
}
export function setAdminTicketStatus(
  id: string,
  status: SupportStatus,
): Promise<{ ticket: SupportTicketDTO }> {
  return http.patch(`/admin/support/tickets/${encodeURIComponent(id)}`, { status });
}
export function adminSupportUnread(): Promise<{ count: number }> {
  return http.get('/admin/support/unread-count');
}
