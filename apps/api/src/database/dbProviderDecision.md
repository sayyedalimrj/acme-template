# Database Provider Decision (design record)

> **Status: design record only.** No provider is integrated, no dependency is added, and no
> connection exists in this PR. This documents the recommended direction and the selection
> criteria so a final choice can be made deliberately, after review.

## Recommendation (direction, not a locked vendor)

Use a **managed, Postgres-compatible relational database** for the platform. The schema is
inherently relational — a `Tenant → Site → Resource` hierarchy with strong foreign keys,
per-tenant isolation, and summary read-model tables — which maps cleanly onto relational
tables, constraints, and indexes. A managed service (rather than self-hosted) is preferred so
backups, point-in-time recovery, and patching are handled by the provider.

A specific vendor is **intentionally not locked** in this PR. Final selection happens in a
later phase with the criteria below and a security review.

## Why relational fits the model

- The platform data is highly relational: tenants own sites; sites own connections,
  credential metadata, sync runs, and synced summaries; subscriptions/usage/billing attach to
  tenants. Foreign keys + constraints express and enforce these relationships.
- **Tenant isolation** is naturally expressed via a mandatory `tenantId` column plus
  row-level security (RLS) and/or a query-layer tenant guard.
- Strong typing, transactions, and indexing support the read-heavy sync/reporting workloads.
- A document/NoSQL store would weaken referential integrity and tenant-isolation guarantees
  the design depends on.

## Why no DB dependency in this PR

- This phase is **plan + scaffold only**. Adding a client/ORM now would imply a connection,
  env values, and a runtime — all explicitly out of scope and gated behind a security review.
- Keeping `apps/api` dependency-free preserves the interface-first posture and lets the
  adapter boundary (next PR) decide the concrete client without rework here.

## Future candidate providers (do NOT integrate now)

Any of the following Postgres-compatible options **may** be evaluated later — listed as
candidates only, with no endorsement and no integration in this PR:

- Neon (serverless Postgres)
- Vercel Postgres
- Supabase (Postgres + RLS)
- Amazon RDS / Aurora (Postgres)

The decision must not add an integration until the adapter-boundary phase and a review.

## Selection criteria

| Criterion                                 | What to verify                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| **Backups**                               | Automated, retained, restorable backups.                                  |
| **Point-in-time recovery**                | PITR window adequate for incident recovery.                               |
| **Regional availability**                 | Regions matching customer/data-residency needs.                           |
| **Row-level security / tenant isolation** | Native RLS or a robust query-layer tenant guard.                          |
| **Connection pooling**                    | Pooler available (e.g. serverless-friendly) for scale.                    |
| **Migration support**                     | Works with a standard migration workflow; safe online DDL.                |
| **Cost**                                  | Predictable pricing at expected scale; no surprise egress.                |
| **Audit / compliance**                    | Encryption at rest, access logs, certifications for our compliance needs. |

## Out of scope (this PR)

No client, no ORM, no connection string, no env values, no Docker, no deployment, no
migrations executed. Implementation begins behind the adapter boundary in a later, reviewed
phase.
