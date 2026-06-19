-- Optional demo seed (frontend-safe; no secrets). Apply with: `npm run seed`.
-- Idempotent-ish: safe to run on a fresh DB. Uses fixed UUIDs for stable references.

-- Admin user (also add this mobile to ADMIN_MOBILE_ALLOWLIST to allow admin login).
INSERT INTO app_user (id, mobile, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', '09120000000', 'مدیر پلتفرم', 'admin')
ON CONFLICT (mobile) DO NOTHING;

-- A marketer user + marketer row.
INSERT INTO app_user (id, mobile, name, role)
VALUES ('00000000-0000-0000-0000-000000000002', '09121111111', 'رضا کریمی', 'affiliate')
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO marketer (id, user_id, code, status, commission_rate_bps, tier)
VALUES ('10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002', 'REZA20', 'active', 2000, 'gold')
ON CONFLICT (code) DO NOTHING;

-- A merchant user + store (referred by the marketer above).
INSERT INTO app_user (id, mobile, name, role)
VALUES ('00000000-0000-0000-0000-000000000003', '09122222222', 'سارا محمدی', 'merchant')
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO merchant (id, user_id, store_name, url, plan, status, mrr_amount, store_sales_amount, referred_by_marketer_id)
VALUES ('20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000003', 'فروشگاه بادبان', 'badban-shop.example',
        'growth', 'active', 4900000, 824000000, '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO referral (id, marketer_id, merchant_id, status)
VALUES ('30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO commission (id, marketer_id, referral_id, amount, currency, rate_bps, status, period)
VALUES ('40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
        9800000, 'IRT', 2000, 'pending', '1404-03')
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform_order (id, merchant_id, number, customer_name, status, total_amount)
VALUES ('50000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', '#10420', 'نیلوفر کاظمی', 'completed', 920000)
ON CONFLICT (id) DO NOTHING;
