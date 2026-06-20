/**
 * Auth routes: phone-OTP login (request + verify), token refresh, logout, current user.
 */
import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { allowedPortalsForRole, canonicalizePortal, isMerchantRole, type Portal } from '../../auth/rbac';
import { env } from '../../env';
import { audit } from '../../services/audit';
import {
  findLiveSession,
  issueSession,
  revokeSession,
  rotateSession,
} from '../../services/tokenService';
import { primaryTenantId } from '../../services/accessControl';
import { requestOtp, verifyOtp } from '../../services/otpService';
import { findOrCreateUser, getUserById } from '../../services/userService';
import { badRequest, unauthorized } from '../../util/errors';
import { normalizeMobile } from '../../util/mobile';
import { authenticate, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';

const portalField = z.preprocess(
  (v) => (typeof v === 'string' ? (canonicalizePortal(v) ?? v) : v),
  z.enum(['merchant', 'admin', 'affiliate']),
);

const requestSchema = z.object({ mobile: z.string().min(1), portal: portalField });
const verifySchema = z.object({
  mobile: z.string().min(1),
  code: z.string().min(3),
  portal: portalField,
  name: z.string().trim().min(1).max(120).optional(),
  referralCode: z.string().trim().min(1).max(40).optional(),
});
const refreshSchema = z.object({ refreshToken: z.string().min(10) });
const logoutSchema = z.object({ refreshToken: z.string().min(10) });

// Defense-in-depth on top of the per-mobile limiter inside otpService.
const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

export const authRouter = Router();

authRouter.post(
  '/otp/request',
  otpRequestLimiter,
  asyncHandler(async (req, res: Response) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('شماره موبایل را درست وارد کنید.');
    const mobile = normalizeMobile(parsed.data.mobile);
    if (!mobile) throw badRequest('شماره موبایل نامعتبر است.');
    const result = await requestOtp(mobile, parsed.data.portal as Portal, req.ip);
    res.json({ ok: true, ...result });
  }),
);

/** Safe public config for the frontend (no secrets). */
authRouter.get('/public-config', (_req, res: Response) => {
  res.json({
    smsDryRun: env.SMS_DRY_RUN,
    otpLength: env.OTP_LENGTH,
    otpResendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
  });
});

authRouter.post(
  '/otp/verify',
  verifyLimiter,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات ورود ناقص است.');
    const mobile = normalizeMobile(parsed.data.mobile);
    if (!mobile) throw badRequest('شماره موبایل نامعتبر است.');

    const portal = parsed.data.portal as Portal;
    await verifyOtp(mobile, parsed.data.code, portal);
    const user = await findOrCreateUser(mobile, portal, {
      name: parsed.data.name,
      referralCode: parsed.data.referralCode,
    });

    const tenantId = isMerchantRole(user.role) ? await primaryTenantId(user.id) : null;
    const session = await issueSession(
      { sub: user.id, role: user.role, portal, tenantId },
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    await audit({
      actorUserId: user.id,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      requestIp: req.ip,
      meta: { portal, role: user.role },
    });

    res.json({
      token: session.accessToken,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
      roles: [user.role],
      portal,
      allowedPortals: allowedPortalsForRole(user.role),
      tenantId,
    });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('درخواست نامعتبر است.');
    const live = await findLiveSession(parsed.data.refreshToken);
    if (!live) throw unauthorized('نشست منقضی شده است. دوباره وارد شوید.');
    const user = await getUserById(live.user_id);
    if (!user || user.status !== 'active') throw unauthorized();
    const tenantId = isMerchantRole(user.role) ? await primaryTenantId(user.id) : null;
    const rotated = await rotateSession(
      live.id,
      { sub: user.id, role: user.role, portal: live.portal, tenantId },
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    res.json({
      token: rotated.accessToken,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
      roles: [user.role],
      portal: live.portal,
      allowedPortals: allowedPortalsForRole(user.role),
      tenantId,
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = logoutSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('درخواست نامعتبر است.');
    const revoked = await revokeSession(parsed.data.refreshToken);
    res.json({ ok: true, revoked });
  }),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const user = req.auth ? await getUserById(req.auth.sub) : null;
    if (!user) throw badRequest('کاربر یافت نشد.', 'not_found');
    res.json({
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
      portal: req.auth?.portal,
      tenantId: req.auth?.tenantId ?? null,
    });
  }),
);
