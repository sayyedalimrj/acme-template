/**
 * Merchant routes (role: merchant). Scoped to the signed-in store owner.
 */
import { Router, type Response } from 'express';

import { query, queryOne } from '../../db';
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';

export const merchantRouter = Router();
merchantRouter.use(authenticate, requireRole('merchant'));

merchantRouter.get(
  '/overview',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchant = await queryOne(
      `SELECT id, store_name, url, plan, status, currency, mrr_amount, store_sales_amount
         FROM merchant WHERE user_id = $1`,
      [userId],
    );
    const merchantId = (merchant as { id?: string } | null)?.id;
    const recentOrders = merchantId
      ? await query(
          `SELECT id, number, customer_name, status, total_amount, created_at
             FROM platform_order WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 20`,
          [merchantId],
        )
      : [];
    res.json({ merchant, recentOrders });
  }),
);
