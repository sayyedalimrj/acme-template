-- Optional DEV seed (frontend-safe; no secrets). Apply with: `npm run migrate -- --seed`.
-- BLOCKED in production by the migrate runner. Uses fixed UUIDs for stable references.

-- Admin user (also add this mobile to ADMIN_MOBILE_ALLOWLIST to allow admin login).
INSERT INTO app_user (id, mobile, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', '09120000000', 'مدیر پلتفرم', 'platform_admin')
ON CONFLICT (mobile) DO NOTHING;

-- A marketer (affiliate) user + marketer row.
INSERT INTO app_user (id, mobile, name, role)
VALUES ('00000000-0000-0000-0000-000000000002', '09121111111', 'رضا کریمی', 'affiliate')
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO marketer (id, user_id, code, status, commission_rate_bps, tier)
VALUES ('10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002', 'REZA20', 'active', 2000, 'gold')
ON CONFLICT (code) DO NOTHING;

-- A merchant user + tenant + membership + platform billing record (referred by the marketer).
INSERT INTO app_user (id, mobile, name, role)
VALUES ('00000000-0000-0000-0000-000000000003', '09122222222', 'سارا محمدی', 'merchant_owner')
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO tenant (id, name, owner_user_id, status)
VALUES ('a0000000-0000-0000-0000-000000000001', 'فروشگاه بادبان',
        '00000000-0000-0000-0000-000000000003', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_member (id, tenant_id, user_id, role)
VALUES ('b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000003', 'merchant_owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

INSERT INTO merchant (id, tenant_id, user_id, store_name, url, plan, status, mrr_amount, store_sales_amount, referred_by_marketer_id)
VALUES ('20000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000003', 'فروشگاه بادبان', 'badban-shop.example',
        'growth', 'active', 4900000, 824000000, '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- A connected site read-model (no real credentials in seed).
INSERT INTO site (id, tenant_id, name, url, connection_mode, status, currency, woo_version, wp_version)
VALUES ('c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001', 'فروشگاه بادبان',
        'https://badban-shop.example', 'woo_rest', 'connected', 'IRT', '9.2.3', '6.6.1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO synced_product (site_id, tenant_id, external_id, name, sku, status, price_minor, stock_status, stock_qty)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '101', 'کفش اسپرت', 'SH-101', 'publish', 1850000, 'instock', 24),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '102', 'کوله‌پشتی چرم', 'BG-102', 'publish', 3200000, 'instock', 9)
ON CONFLICT (site_id, external_id) DO NOTHING;

INSERT INTO synced_order (site_id, tenant_id, external_id, number, status, total_minor, customer_name, external_created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '10420', '#10420', 'completed', 920000, 'نیلوفر کاظمی', now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '10421', '#10421', 'processing', 4150000, 'مهدی رستمی', now() - interval '6 hours')
ON CONFLICT (site_id, external_id) DO NOTHING;

INSERT INTO referral (id, marketer_id, merchant_id, tenant_id, status)
VALUES ('30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO commission (id, marketer_id, referral_id, tenant_id, amount, currency, rate_bps, status, period)
VALUES ('40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001', 9800000, 'IRT', 2000, 'pending', '1404-03')
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform_order (id, merchant_id, number, customer_name, status, total_amount)
VALUES ('50000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', '#10420', 'نیلوفر کاظمی', 'completed', 920000)
ON CONFLICT (id) DO NOTHING;

-- Platform plans.
INSERT INTO plan (id, code, name, price_minor, currency, interval, features, active)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'starter', 'استارتر', 0, 'IRT', 'month', '["۱ فروشگاه","گزارش پایه"]', true),
  ('d0000000-0000-0000-0000-000000000002', 'growth', 'رشد', 4900000, 'IRT', 'month', '["۳ فروشگاه","گزارش پیشرفته","پشتیبانی"]', true),
  ('d0000000-0000-0000-0000-000000000003', 'pro', 'حرفه‌ای', 12900000, 'IRT', 'month', '["فروشگاه نامحدود","API","پشتیبانی اولویت‌دار"]', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO subscription (id, tenant_id, plan_id, status, current_period_end)
VALUES ('e0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
        'active', now() + interval '21 days')
ON CONFLICT (id) DO NOTHING;
