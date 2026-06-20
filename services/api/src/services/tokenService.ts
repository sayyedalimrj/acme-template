/**
 * Tokens & sessions.
 *
 * - Access token: short-lived JWT carrying non-secret identity claims (user id, role, portal,
 *   tenant scope). Used as the Bearer token on every API call.
 * - Refresh token: opaque random string; only its HASH is stored in `user_session`. Used to mint
 *   a new access token without re-doing OTP. Rotated on use; revoked on logout.
 */
import { createHash, randomBytes } from 'node:crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../env';
import { query, queryOne } from '../db';
import type { Portal, Role } from '../auth/rbac';

export interface TokenClaims {
  sub: string; // user id
  role: Role;
  portal: Portal;
  tenantId?: string | null; // merchant scope (owner's tenant), when applicable
}

export function signToken(claims: TokenClaims): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(claims, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return {
    sub: String(decoded.sub),
    role: decoded.role as Role,
    portal: decoded.portal as Portal,
    tenantId: (decoded.tenantId as string | undefined) ?? null,
  };
}

function hashRefresh(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/** Create an access token + a persisted refresh session. */
export async function issueSession(
  claims: TokenClaims,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<IssuedSession> {
  const refreshToken = randomBytes(48).toString('base64url');
  const refreshExpiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  );
  await query(
    `INSERT INTO user_session (user_id, portal, refresh_token_hash, user_agent, request_ip, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      claims.sub,
      claims.portal,
      hashRefresh(refreshToken),
      meta.userAgent ?? null,
      meta.ip ?? null,
      refreshExpiresAt,
    ],
  );
  return { accessToken: signToken(claims), refreshToken, refreshExpiresAt };
}

export interface RefreshRow {
  id: string;
  user_id: string;
  portal: Portal;
  expires_at: string;
  revoked_at: string | null;
}

/** Look up a live (non-revoked, non-expired) session by its refresh token. */
export async function findLiveSession(refreshToken: string): Promise<RefreshRow | null> {
  return queryOne<RefreshRow>(
    `SELECT id, user_id, portal, expires_at, revoked_at FROM user_session
       WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [hashRefresh(refreshToken)],
  );
}

/** Rotate a refresh token: revoke the old session and issue a new one. */
export async function rotateSession(
  oldSessionId: string,
  claims: TokenClaims,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<IssuedSession> {
  await query(`UPDATE user_session SET revoked_at = now() WHERE id = $1`, [oldSessionId]);
  return issueSession(claims, meta);
}

/** Revoke a single refresh session (logout). Returns true if a live session was revoked. */
export async function revokeSession(refreshToken: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE user_session SET revoked_at = now()
       WHERE refresh_token_hash = $1 AND revoked_at IS NULL
       RETURNING id`,
    [hashRefresh(refreshToken)],
  );
  return rows.length > 0;
}

/** Revoke all sessions for a user (e.g. account suspension). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await query(`UPDATE user_session SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [
    userId,
  ]);
}
