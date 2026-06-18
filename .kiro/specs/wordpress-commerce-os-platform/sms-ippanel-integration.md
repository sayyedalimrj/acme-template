# SMS Provider Integration — IPPanel (آی‌پی‌پنل)

Spec: `wordpress-commerce-os-platform` · provider for Phase 3 (OTP) and Phase 13 (marketing SMS)

Chosen SMS provider: **IPPanel** (`ippanel.com`). This document is the integration plan and
the security/architecture contract. It supersedes the generic "Kavenegar/Twilio later" note in
`roadmap.md` Phase 6/13 — **IPPanel is the selected provider**, behind the same adapter seam.

Sources reviewed: IPPanel REST API key guide (`apikey.pdf`), official SDKs
(`github.com/ippanel` — `php-rest-sdk`, `python-rest-sdk`, `go-rest-sdk`), and
`docs.ippanel.com`. (The docs host returned 502 at authoring time; the SDK READMEs were used to
ground the method surface and confirmed against the published API.)

---

## Golden rule (non-negotiable)
The **IPPanel API key is a secret** and **must never** appear in the client or admin frontend
bundle, in git, or in any client request. All SMS sending happens **server-side** in `apps/api`,
which reads the key from the **environment** (`IPPANEL_API_KEY`) and calls IPPanel. The
frontend only triggers an intent (e.g. "send OTP", "queue back-in-stock campaign") through OUR
backend; the backend enforces auth, tenant scope, consent, and rate limits before sending.

## IPPanel REST surface (what we use)
Authenticated with the panel API key. Relevant operations (confirmed via the SDKs):

- **Credit** — `getCredit()` → remaining credit (surface in Admin as a health metric).
- **Send (one-to-many)** — `send(originator, recipients[], message, description)` → returns a
  **tracking/message id** (`bulk_id`). Used for marketing/automation sends.
- **Pattern send** — `sendPattern(patternCode, originator, recipient, values{})` → message id.
  **This is the OTP path:** define a pattern in the panel with a `code` variable (e.g.
  `کد ورود شما به {company}: %code%`), then send the verification code as a pattern value.
  Patterns avoid per-message content approval and are the correct channel for transactional/OTP.
- **Message status** — `get_message(id)` / `fetchStatuses(id, page, limit)` → delivery state +
  cost; we persist these against the originating record (OTP attempt / campaign run).
- **Inbox** — `fetchInbox(page, limit)` → inbound replies (future two-way / STOP handling).

Base URL + auth header are configured server-side from env; the SDKs default to the IPPanel REST
endpoint and pass the API key on construction (`new Client(apiKey)`).

## Environment contract (names only — values come from the env/secret manager)
```
IPPANEL_API_KEY=            # secret — server only, never in frontend/git
IPPANEL_ORIGINATOR=         # sender line number (e.g. +98xxxxxxxxxx or a service line)
IPPANEL_OTP_PATTERN_CODE=   # pattern code created in the panel, with a `code` variable
IPPANEL_BASE_URL=           # optional override; defaults to the IPPanel REST endpoint
SMS_PROVIDER=ippanel        # provider switch (keeps the adapter seam pluggable)
```

## Architecture — fits the existing adapter seam
SMS lives behind a backend `SmsProvider` interface so the provider is swappable and the rest of
the system is provider-agnostic:

```
SmsProvider (backend interface)
  ├─ sendOtp(recipient, code, ctx)         // -> sendPattern(OTP_PATTERN_CODE, ...)
  ├─ sendTransactional(recipient, body)    // -> send(...)         (e.g. order/account notices)
  ├─ sendCampaign(recipients[], body, ctx) // -> send(...) bulk    (consent-gated)
  ├─ getMessageStatus(messageId)           // -> get_message / fetchStatuses
  └─ getCredit()                            // -> getCredit         (Admin health)

Implementations:  MockSmsProvider (now)  →  IppanelSmsProvider (env-keyed)  →  (future others)
```

- The client/admin keep using the existing **`NotificationAutomationAdapter`** seam; the new
  backend `SmsProvider` is what actually talks to IPPanel. The mock automation UI (consent,
  drafts, previews) maps 1:1 onto these calls when flipped to `http`.
- **OTP wiring (Phase 3 / PR 5):** auth `requestCode` → backend generates a code, stores a
  hashed code + attempt record (TTL, max attempts, per-number rate limit), calls
  `SmsProvider.sendOtp` via `sendPattern`. `verifyCode` checks the hash/TTL/attempts. The
  existing entry/verify/auto-submit UI is unchanged.

## Consent, opt-out, and safety (binding)
- **Transactional vs marketing** are separated. OTP/account/order notices are transactional.
  **Marketing/automation SMS requires explicit opt-in** and an **opt-out (STOP/لغو)** footer,
  per the consent model already stubbed in `NotificationAutomationAdapter`.
- Store consent + opt-out state per recipient/tenant; never send marketing without opt-in.
- **Rate limiting + abuse protection** on OTP (per number, per IP, per tenant) to prevent
  credit drain and SMS-bombing.
- **Privacy:** phone numbers are tenant-scoped PII. Logs store **masked** numbers
  (`09xx***1234`); raw numbers live only in the tenant-scoped store. Delivery receipts/costs are
  recorded for support + billing/usage limits.
- No SMS code path ever runs in the frontend; the frontend cannot read the API key or send.

## Rollout
1. **Backend `SmsProvider` interface + `MockSmsProvider`** (no network) — unblocks tests.
2. **`IppanelSmsProvider`** keyed by env; create the OTP **pattern** in the panel.
3. **OTP via SMS** wired into real auth (Phase 3 / PR 5) — pattern send + verify + rate limit.
4. **Marketing/automation sends** (Phase 13) — consent-gated, opt-out, usage-limited; surfaces
   credit + delivery status in Admin.

> Until step 2 ships and a security review passes, `SMS_PROVIDER=mock`: nothing is sent, no key
> is required, and the UI stays in its current mock/preview mode.
