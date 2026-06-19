/**
 * Auth routes: phone-OTP login (request + verify) and the current-user lookup.
 */
import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import type { Portal } from '../../auth/rbac';
import { signToken } from '../../services/tokenService';
import { requestOtp, verifyOtp } from '../../services/otpService';
import { findOrCreateUser, getUserById } from '../../services/userService';
import { badRequest } from '../../util/errors';
import { normalizeMobile } from '../../util/mobile';
import { authenticate, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';

const portalSchema = z.enum(['merchant', 'admin', 'affiliate']).default('merchant');

const requestSchema = z.object({
  mobile: z.string().min(1),
  portal: portalSchema,
});

const verifySchema = z.object({
  mobile: z.string().min(1),
  code: z.string().min(3),
  portal: portalSchema,
  name: z.string().trim().min(1).max(120).optional(),
});

// Defense-in-depth on top of the per-mobile limiter inside otpService.
const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

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

authRouter.post(
  '/otp/verify',
  asyncHandler(async (req, res: Response) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات ورود ناقص است.');
    const mobile = normalizeMobile(parsed.data.mobile);
    if (!mobile) throw badRequest('شماره موبایل نامعتبر است.');

    const portal = parsed.data.portal as Portal;
    await verifyOtp(mobile, parsed.data.code, portal);
    const user = await findOrCreateUser(mobile, portal, parsed.data.name);
    const token = signToken({ sub: user.id, role: user.role, portal });
    res.json({
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
    });
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
    });
  }),
);
