# Portals Guide — Merchant / Admin / Affiliate

This project ships **three separate apps ("portals")** from **one shared codebase**. Each portal
is a **standalone deployment on its own subdomain with its own login**, all sharing the same
design system, RTL handling, theming, and PWA packaging:

| Portal        | Persian name   | For whom                    | Subdomain (example) | `EXPO_PUBLIC_PORTAL` |
| ------------- | -------------- | --------------------------- | ------------------- | -------------------- |
| **Merchant**  | پنل فروشنده     | A store owner               | `app.example`       | `merchant`           |
| **Admin**     | پنل مدیریت      | The platform owner (you)    | `admin.example`     | `admin`              |
| **Affiliate** | پنل بازاریاب    | Marketers who refer sellers | `partner.example`   | `affiliate`          |

Each subdomain is built with `EXPO_PUBLIC_PORTAL` set to that portal, so it boots straight into
**its own login** and only its own UI — there is **no portal selector and no in-app switching**.
Cross-portal access is prevented at two layers: the build only exposes one portal's login, and
the backend enforces **server-side RBAC** (a merchant token can never read admin/affiliate data).

> The portal **UI** runs on realistic mock data; **authentication is real** (phone OTP via the
> `services/api` backend + ippanel) once you set `EXPO_PUBLIC_API_BASE_URL`. No secrets live in
> the frontend or git.

---

## راهنمای فارسی (خلاصه)

سه پنل جدا، هرکدام روی **ساب‌دامین خودش** و با **لاگین مستقل**، از یک کدبیس مشترک (UI یکسان):

- **پنل فروشنده** (`app.example`): اپ مدیریت فروشگاه.
- **پنل مدیریت** (`admin.example`): مخصوص خودِ شما برای مدیریت فروشندگان، سفارش‌ها، بازاریاب‌ها و
  تسویه‌ی پورسانت‌ها.
- **پنل بازاریاب** (`partner.example`): برای بازاریاب‌هایی که فروشنده معرفی می‌کنند و پورسانت
  می‌گیرند (کد و لینک معرفی، فروشنده‌های معرفی‌شده، درآمد، درخواست تسویه).

هر ساب‌دامین جدا بیلد و دیپلوی می‌شود (با `EXPO_PUBLIC_PORTAL`) و فقط لاگین و UI خودش را دارد —
**انتخاب‌گر یا جابجایی داخل اپ وجود ندارد**. کنترل دسترسی هم سمت سرور (RBAC) اعمال می‌شود.

**ورود واقعی با پیامک:** بک‌اند (`services/api`) کد ورود را با **ippanel** پیامک می‌کند. کافی است
`EXPO_PUBLIC_API_BASE_URL` هر ساب‌دامین را به آدرس بک‌اند تنظیم کنید. برای تست بدون پیامک واقعی،
`SMS_DRY_RUN=true` بگذارید تا کد در پاسخ/لاگ نمایش داده شود.

---

## How to access each portal

Each portal is its **own subdomain build** with its **own login**. Open the subdomain, enter a
mobile number, and submit the OTP:

- **Real OTP (production):** with `EXPO_PUBLIC_API_BASE_URL` set, the backend sends the code via
  ippanel SMS; enter it to sign in. The backend assigns the right role and a JWT.
- **Local/dev without a backend:** the app falls back to mock auth (demo OTP **`1234`**).

There is no in-app portal switcher — that is by design (separate apps, separate security
boundaries).

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

- **One codebase, three deploy targets:** the active portal is fixed at build time by
  `EXPO_PUBLIC_PORTAL` (`src/config/portal.config.ts`). Route groups: `app/(app)` (merchant),
  `app/(admin)`, `app/(affiliate)`. The authenticated root dispatches to the build's portal;
  each group `_layout` guards its own portal.
- **Shared design system:** portals reuse the merchant mobile tokens, shadows, and components
  via `PortalScaffold`, `PortalTopBar`, `PortalBottomNav`, and `PortalUI`.
- **Real auth:** `src/services/authApi.ts` calls the backend (`services/api`) for phone OTP when
  `EXPO_PUBLIC_API_BASE_URL` is set; otherwise mock auth is used.
- **Server-side RBAC:** the backend issues a JWT carrying the user's role; each portal's API
  routes require the matching role (admin is a superuser). See `services/api/src/auth/rbac.ts`.
- **Portal UI data:** currently realistic mock data
  (`src/features/admin/adminMockData.ts`, `src/features/affiliate/affiliateMockData.ts`). The
  backend already exposes matching read endpoints (`/admin/*`, `/affiliate/*`, `/merchant/*`) to
  switch these to live data next.

## Deployment (three subdomains)

Build and deploy each portal separately (see `DEPLOYMENT.md` for the full runbook):

```bash
cd apps/client
npm run export:web:merchant    # → dist-merchant   → deploy to app.example
npm run export:web:admin       # → dist-admin      → deploy to admin.example
npm run export:web:affiliate   # → dist-affiliate  → deploy to partner.example
# or: npm run export:web:all
```

Set per-subdomain env at build time: `EXPO_PUBLIC_PORTAL` (done by the scripts) and
`EXPO_PUBLIC_API_BASE_URL` (your backend origin). One backend (`services/api`) serves all three
and enforces RBAC + CORS for the three origins.
