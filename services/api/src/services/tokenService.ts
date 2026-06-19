/**
 * JWT issue/verify. The token carries only non-secret identity claims (user id, role, portal).
 */
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../env';
import type { Portal, Role } from '../auth/rbac';

export interface TokenClaims {
  sub: string; // user id
  role: Role;
  portal: Portal;
}

export function signToken(claims: TokenClaims): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(claims, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return { sub: String(decoded.sub), role: decoded.role as Role, portal: decoded.portal as Portal };
}
