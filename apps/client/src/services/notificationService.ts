/**
 * Platform notifications for merchants (admin status updates, connection alerts, …).
 */
import { http } from '@/services/httpClient';
import type { PlatformNotification } from '@/domain/types';

interface BackendNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  payload?: Record<string, unknown>;
}

function mapNotification(row: BackendNotification): PlatformNotification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    read: Boolean(row.read_at),
    createdAt: row.created_at,
    payload: row.payload,
  };
}

export const notificationService = {
  async list(): Promise<{ items: PlatformNotification[]; unreadCount: number }> {
    const res = await http.get<{ items: BackendNotification[]; unreadCount: number }>(
      '/merchant/notifications',
    );
    return {
      items: res.items.map(mapNotification),
      unreadCount: res.unreadCount,
    };
  },
  async markRead(id: string): Promise<void> {
    await http.patch(`/merchant/notifications/${id}/read`);
  },
};
