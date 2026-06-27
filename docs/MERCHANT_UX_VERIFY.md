# Merchant UX improvements — verification

## Automated tests

### Client (`apps/client`)
```bash
cd apps/client && npm test -- --testPathPattern="pagination|pendingSite|ProductScreens|connectSite"
```

### API (`services/api`)
```bash
cd services/api && npm test -- --testPathPattern="socialProvider|productSync"
```

## Manual checklist

1. Login as merchant.
2. Submit a site creation request → pending card **در حال ساخت** appears on home carousel.
3. Login as admin → approve/complete onboarding request with site URL.
4. Merchant refreshes home → card status updates; notification appears when API connected.
5. Open **اتصال فروشگاه** → compare plugin (recommended) vs WooCommerce REST cards.
6. Start plugin pairing → copy credentials, complete handshake.
7. Products list → search/filter, **نمایش بیشتر** appends rows without scroll jump.
8. Product detail → rich fields, image gallery on tap, aspect ratio preserved.
9. **بیشتر → انتشار خودکار محصولات** → add/test social channel (API mode).
10. Notifications screen shows live admin updates when `EXPO_PUBLIC_API_URL` is set.

## Deployment

1. Run migration: `cd services/api && npm run migrate` (applies `009_social_channels.sql`).
2. Deploy API + client builds.
3. No Theme/ changes; Woo REST connections remain supported.

## Rollback

- Revert client/API deploy.
- Roll back migration per `services/api/db/migrations/ROLLBACK.md` (drop social_* tables if needed).

## Known limitations

- Social providers use manual/assisted adapters until per-network OAuth/API integrations ship.
- Product image upload/edit still routes through product edit (no binary upload in gallery).
- Low-stock filter on products applies client-side on loaded pages when using infinite scroll.
