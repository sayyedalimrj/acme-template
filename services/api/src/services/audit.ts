/**
 * AuditLogService — append-only audit trail for privileged actions.
 *
 * Every login, site connection, credential change, sync, admin action, billing/payout action,
 * and webhook state change is recorded here. Metadata is redacted before insert so secrets/PII
 * can never leak into the audit log. Writes are best-effort: an audit failure must never break
 * the underlying request, but it is logged.
 */
import { query } from '../db';
import { redactDeep } from './security/redaction';

export interface AuditEntry {
  actorUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  requestIp?: string | null;
  meta?: Record<string, unknown> | null;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (actor_user_id, action, target_type, target_id, request_ip, meta)
         VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.actorUserId ?? null,
        entry.action,
        entry.targetType ?? null,
        entry.targetId ?? null,
        entry.requestIp ?? null,
        entry.meta ? JSON.stringify(redactDeep(entry.meta)) : null,
      ],
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write entry:', (err as Error).message);
  }
}
