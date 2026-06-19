/**
 * Auth middleware: verify the Bearer JWT and enforce role / portal / permission access.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  isAdminRole,
  roleCanUsePortal,
  roleHasPermission,
  type Permission,
  type Portal,
  type Role,
} from '../../auth/rbac';
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

/** Allow only the listed roles. platform_admin is a superuser and always allowed. */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role) {
      next(unauthorized());
      return;
    }
    if (role === 'platform_admin' || roles.includes(role)) {
      next();
      return;
    }
    next(forbidden());
  };
}

/** Ensure the token was issued for the given portal (defense in depth alongside role checks). */
export function requirePortal(portal: Portal) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const auth = req.auth;
    if (!auth) {
      next(unauthorized());
      return;
    }
    if (auth.portal === portal && roleCanUsePortal(auth.role, portal)) {
      next();
      return;
    }
    next(forbidden('این توکن برای این پنل معتبر نیست.'));
  };
}

/** Require a specific permission (granular RBAC for writes/sensitive reads). */
export function requirePermission(permission: Permission) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role) {
      next(unauthorized());
      return;
    }
    if (roleHasPermission(role, permission)) {
      next();
      return;
    }
    next(forbidden());
  };
}

/** Convenience guard for admin routes (platform_admin or support_admin). */
export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const role = req.auth?.role;
  if (!role) {
    next(unauthorized());
    return;
  }
  if (isAdminRole(role)) {
    next();
    return;
  }
  next(forbidden());
}
