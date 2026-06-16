# Onboarding Paths

Spec: `wordpress-commerce-os-platform`

Two front doors lead into the same operating dashboard. Both are **mock-first**: forms,
status timelines, and request records are real UI/data; **no real credentials are ever
collected or stored in the frontend**, and **no real provisioning happens** until the
backend/proxy and support tooling exist (see `security-model.md`).

The entry chooser asks the merchant:
- **"I already have a WordPress/WooCommerce site"** → Path A.
- **"I want you to launch a new store for me"** → Path B.

---

## Path A — Existing Site Onboarding

Connect a live store, or request our team's help.

### Fields / concepts
- **Existing site URL** (public domain; non-secret).
- **Business name.**
- **Current platform confirmation** — is it WordPress + WooCommerce? (yes / not sure / no).
- **Request type:**
  - **Dashboard connection only** — connect and operate.
  - **Managed handover / support** — our team reviews and helps connect/operate.
  - **Migration / rebuild consultation** — *(documented for later; not in the first mock)*.
- **Contact / notes** (frontend-safe; no credentials).

### Status flow
`draft → submitted → under review → needs customer action → connection scheduled →
connected` with terminal branches `unsupported/rejected` and `archived`.

| Status | Meaning |
| --- | --- |
| draft | Started, not submitted. |
| submitted | Sent to our team. |
| under review | Support assessing the request/site. |
| needs customer action | Waiting on the customer (info/access arrangements — never in-app secrets). |
| connection scheduled | Connection planned (via backend/proxy or companion plugin). |
| connected | Store linked; dashboard active. |
| unsupported / rejected | Not a fit (e.g., not WooCommerce). |
| archived | Closed/inactive. |

### Security (Path A)
- **No WordPress/WooCommerce credentials in the frontend.** No consumer keys/secrets, no
  application passwords, no admin logins entered or stored in the app.
- **Managed handover must not collect insecure credential sharing inside the app.** Support
  arranges secure connection out-of-band (backend/proxy issuing keys, or the companion
  plugin performing a server-side handshake) — never a chat/form field for secrets.
- The app stores only **frontend-safe** request metadata + a future opaque connection
  reference issued by the backend.

---

## Path B — New Store Launch

We provision a WordPress/WooCommerce store, then connect it.

### Fields / concepts
- **Domain** (desired or owned).
- **Business type / category.**
- **Template selection** (from our prepared WordPress/WooCommerce template catalog).
- **Package / subscription selection** (Starter / Growth / Pro / Managed — placeholder).
- **Brand assets checklist:** logo, colors, content, initial products readiness.
- **Asset readiness flags** (have/need for each checklist item).
- **Support provisioning status** (see flow).
- **Contact / notes.**

### Status flow
`draft → submitted → under review → awaiting assets → provisioning → ready for review →
connected → delivered` with terminal `archived`.

| Status | Meaning |
| --- | --- |
| draft | Started, not submitted. |
| submitted | Launch request sent. |
| under review | Support validating domain/package/template. |
| awaiting assets | Waiting on brand assets/content/products from the customer. |
| provisioning | Our team is setting up the WordPress/WooCommerce store. |
| ready for review | Store built; pending customer/support review. |
| connected | Store linked to the dashboard. |
| delivered | Handed over; merchant operating it. |
| archived | Closed/inactive. |

### Security (Path B)
- Brand assets and business info are frontend-safe; **no store credentials** are created or
  stored client-side. Provisioning credentials live only in backend/support tooling.
- The connection step reuses the same secure backend/proxy or companion-plugin handshake.

---

## Shared concepts
- **Request record**: typed `OnboardingRequest` (Path A or B), with `id`, `type`, fields,
  `status`, timestamps, and a **status timeline** (status + date + note).
- **Template catalog**: mock list of templates (name, category, preview image placeholder,
  highlights) used by Path B.
- **Adapter boundary**: an `OnboardingService` / `OnboardingAdapter` (mock now; backend
  later) so the support queue (`apps/admin`) and backend can take over without UI rework.
- **No backend, no provisioning, no credentials** in the first implementation — UI + mock
  state + status timelines only.
