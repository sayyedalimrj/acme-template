# Environment Contract (NAMES only — no values, no secrets)

> **Status: design record only.** This lists the future environment variable **names** the
> backend will read once a real database + vault land. It contains **no values**, **no
> sample/token-looking placeholders**, **no `.env` file**, and **no secrets**. Nothing in this
> repo reads `process.env` for these — they are documented here so the adapter-boundary phase
> has an agreed contract.

## Rules

- **Names only.** Never commit a value, sample value, or secret-looking placeholder.
- **No `.env` file** is added to the repo, ever.
- All real values are supplied at deploy time via the platform's secret manager — never git,
  never the frontend bundle.
- Secret material itself (signing keys, DB passwords) lives in a vault/KMS; the backend reads
  only **references**, never raw secrets, where noted.

## Variable names (future)

| Name                          | Phase      | Purpose (no value here)                                                      |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`                | DB adapter | Primary connection reference for the platform database.                      |
| `DATABASE_READONLY_URL`       | later      | Optional read-replica connection reference for read-heavy queries.           |
| `DATABASE_MIGRATION_URL`      | later      | Optional elevated connection reference used only by the migration runner.    |
| `ENCRYPTION_KEY_REF`          | later      | Opaque **reference** to the encryption key in the vault/KMS (not the key).   |
| `SIGNING_SECRET_PROVIDER_REF` | later      | Opaque **reference** to the plugin signing-secret provider (not the secret). |

## Notes

- `*_URL` entries are connection **references** resolved from the secret manager at runtime;
  they are documented as names only.
- `*_REF` entries are deliberately **references to** secret material, never the material
  itself — consistent with the credential/vault design (`schemaDesign.ts`,
  `../database/README.md`).
- Additional provider keys (SMS/AI/billing) are **out of scope** here and will be documented
  in their own integration phases, also as names only.
