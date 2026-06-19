/**
 * Auth middleware: verify the Bearer JWT and enforce role-based access.
 */
import type { NextFunction, Request, Response } from 'express';

import type { Role } from '../../auth/rbac';
import { verifyToken, type TokenClaims } from '../../services/tokenService';
import { forbidden, unauthorized } from '../../util/errors';

export interface AuthedRequest extends Request {
  auth?: TokenClaims;
}

export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized());
    return;
  }
  try {
    req.auth = verifyToken(header.slice('Bearer '.length));
    next();
  } catch {
    next(unauthorized('توکن نامعتبر یا منقضی است.'));
  }
}

/** Allow the listed roles (admin is a superuser and always allowed). */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role) {
      next(unauthorized());
      return;
    }
    if (role === 'admin' || roles.includes(role)) {
      next();
      return;
    }
    next(forbidden());
  };
}
