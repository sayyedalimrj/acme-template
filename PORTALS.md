# Portals Guide — Merchant / Admin / Affiliate

This project ships **three role-based experiences ("portals") from a single Expo build**, all
sharing the same design system, RTL handling, theming, and PWA packaging:

| Portal        | Persian name   | For whom                    | Home route   |
| ------------- | -------------- | --------------------------- | ------------ |
| **Merchant**  | پنل فروشنده     | A store owner               | `/`          |
| **Admin**     | پنل مدیریت      | The platform owner (you)    | `/admin`     |
| **Affiliate** | پنل بازاریاب    | Marketers who refer sellers | `/affiliate` |

> Everything is **mock-only and frontend-safe** today (no backend, no secrets, no card data),
> exactly like the merchant app. Real access control is enforced server-side later (see
> `apps/api` RBAC + tenant isolation and `DEPLOYMENT.md`).

---

## راهنمای فارسی (خلاصه)

سه «نسخه» در یک بیلد ساخته شده‌اند و همگی از همان UI و دیزاین فعلی استفاده می‌کنند:

- **پنل فروشنده** (`/`): همان اپ مدیریت فروشگاه.
- **پنل مدیریت** (`/admin`): مخصوص خودِ شما برای مدیریت فروشندگان، سفارش‌ها، بازاریاب‌ها و
  تسویه‌ی پورسانت‌ها.
- **پنل بازاریاب** (`/affiliate`): برای بازاریاب‌هایی که فروشنده معرفی می‌کنند و پورسانت می‌گیرند
  (کد و لینک معرفی، لیست فروشنده‌های معرفی‌شده، درآمد و پورسانت، درخواست تسویه).

**ورود:** در صفحه‌ی ورود، بالای کادر شماره‌موبایل یک انتخاب‌گر هست: «فروشنده / مدیریت / بازاریاب».
نسخه‌ی موردنظر را انتخاب کنید، شماره را بزنید و کد آزمایشی `1234` را وارد کنید.

**جابجایی بین نسخه‌ها:** داخل هر پنل، از «بیشتر ← تغییر نسخه» می‌توانید به نسخه‌ی دیگر بروید.

---

## How to access each portal

### At sign-in (recommended for the demo)
On the sign-in screen there is a **portal selector** (فروشنده / مدیریت / بازاریاب) above the
phone field. Pick one, enter any valid mobile number, and use the demo OTP **`1234`**. New
numbers go through the short profile step; known demo accounts sign in directly.

### Switching in-app
Each portal's **"More" (بیشتر)** screen has a **"تغییر نسخه"** section to jump between the
merchant, admin, and affiliate experiences without signing out.

### By URL
Once signed into a portal you can also deep-link within it (e.g. `/admin/merchants`,
`/affiliate/earnings`). The route guards redirect you to the correct portal for your session.

---

## What each portal contains

### Merchant (`/`)
The existing store-owner dashboard (home, products, orders, customers, reports, support, …).

### Admin (`/admin`)
- **Overview** — platform KPIs (MRR, GMV, active merchants, open support, pending payouts) +
  recent activity.
- **Merchants** (`/admin/merchants`) — searchable, status-filterable list; **detail**
  (`/admin/merchants/[id]`) with plan, revenue, store metrics, and referral source.
- **Orders** (`/admin/orders`) — platform-wide orders across every store, filterable by status.
- **Marketers** (`/admin/marketers`) — the affiliate network: referral counts, commission
  rate, pending vs. paid commission.
- **Payouts** (`/admin/payouts`) — commission payout requests with a mock approve / mark-paid
  lifecycle.
- **More** (`/admin/more`) — tools, portal switcher, sign out.

### Affiliate (`/affiliate`)
- **Overview** — earnings summary, the shareable **referral code + link**, quick actions, and
  recent commissions.
- **Referrals** (`/affiliate/referrals`) — referred merchants with status (lead / trial /
  active / churned) and commission earned per referral.
- **Earnings** (`/affiliate/earnings`) — the commission ledger, filterable by status.
- **Payouts** (`/affiliate/payouts`) — available balance, **request payout** (mock), and payout
  history.
- **More** (`/affiliate/more`) — marketing tools, portal switcher, sign out.

---

## Architecture notes

- **One build, three Expo Router route groups:** `app/(app)` (merchant), `app/(admin)`,
  `app/(affiliate)`. The authenticated root (`app/(app)/_layout.tsx`) dispatches to the correct
  portal based on `session.portal`; each group's `_layout` guards its own portal.
- **Shared design system:** the portals reuse the merchant mobile tokens, shadows, and
  components via `PortalScaffold`, `PortalTopBar`, `PortalBottomNav`, and `PortalUI` — so they
  look identical to the merchant app and inherit the same RTL fix and theming.
- **Mock data:** `src/features/admin/adminMockData.ts` and
  `src/features/affiliate/affiliateMockData.ts` (frontend-safe Persian data; money as display
  labels only).
- **Going live:** these portals call no backend yet. When the `apps/api` proxy is implemented
  (see `DEPLOYMENT.md`), wire each portal's data to it and enforce **server-side RBAC** so a
  merchant token can never reach `/admin` data. Marketer payouts run through the platform
  **payment gateway** (`apps/api/src/adapters/paymentGateway.ts`).

## Deployment

Nothing changes operationally: it is the **same single web build** as the merchant app
(`npm run export:web`) — see `DEPLOYMENT.md` Part A. The three portals are served from one
deployment and selected by role. If you later want them on separate domains, the same build can
be deployed multiple times with a per-deploy default portal, or split behind your reverse proxy.
