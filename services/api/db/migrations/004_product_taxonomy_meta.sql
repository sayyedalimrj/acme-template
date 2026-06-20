-- Migration 004 — full WooCommerce taxonomy + meta preservation.
--
-- Philosophy: JetWeb's merchant UI stays minimal, but the backend must preserve the FULL
-- WooCommerce product structure so nothing is ever lost. The `raw` JSONB on synced_product /
-- synced_product_variant (migration 003) already keeps the complete payload; this migration adds:
--   • `meta` JSONB on product + variant — the full `meta_data`/postmeta array, queryable, lossless
--     (this is the "synced_product_meta / synced_product_variant_meta" equivalent storage).
--   • `permalink` on synced_product — used only to offer an "Open in WordPress" link.
--   • Normalized taxonomy read-models (tags, brands, attributes, attribute terms) + product link
--     tables, for search / filter / reporting. Unknown plugin/theme fields are never normalized —
--     they live safely in `raw`/`meta`.
--
-- Every table is tenant_id + site_id scoped and idempotent (upsert on (site_id, external_id)).
-- Per-product links (tag/brand/attribute) are replaced per product on each sync (no duplicates).
-- Rollback: db/migrations/ROLLBACK.md.

-- Lossless meta + a small normalized permalink for the WordPress deep-link.
ALTER TABLE synced_product ADD COLUMN IF NOT EXISTS meta JSONB;
ALTER TABLE synced_product ADD COLUMN IF NOT EXISTS permalink TEXT;
ALTER TABLE synced_product_variant ADD COLUMN IF NOT EXISTS meta JSONB;

-- --------------------------------------------------------------------------- Tags
CREATE TABLE IF NOT EXISTS synced_tag (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT,
  raw         JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_stag_site ON synced_tag (site_id);

-- --------------------------------------------------------------------------- Brands (product_brand taxonomy; plugin/theme provided — may be empty)
CREATE TABLE IF NOT EXISTS synced_brand (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT,
  raw         JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sbrand_site ON synced_brand (site_id);

-- --------------------------------------------------------------------------- Global attributes + terms (e.g. pa_size)
CREATE TABLE IF NOT EXISTS synced_attribute (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT,
  type        TEXT,
  raw         JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sattr_site ON synced_attribute (site_id);

CREATE TABLE IF NOT EXISTS synced_attribute_term (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id               UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  attribute_external_id TEXT NOT NULL,
  external_id           TEXT NOT NULL,
  name                  TEXT NOT NULL,
  slug                  TEXT,
  raw                   JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, attribute_external_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sattrterm_site ON synced_attribute_term (site_id, attribute_external_id);

-- --------------------------------------------------------------------------- Product ↔ tag / brand links (replaced per product on sync)
CREATE TABLE IF NOT EXISTS synced_product_tag (
  product_id UUID NOT NULL REFERENCES synced_product (id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES synced_tag (id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id    UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_sprodtag_site ON synced_product_tag (site_id);

CREATE TABLE IF NOT EXISTS synced_product_brand (
  product_id UUID NOT NULL REFERENCES synced_product (id) ON DELETE CASCADE,
  brand_id   UUID NOT NULL REFERENCES synced_brand (id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id    UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, brand_id)
);
CREATE INDEX IF NOT EXISTS idx_sprodbrand_site ON synced_product_brand (site_id);

-- --------------------------------------------------------------------------- Per-product attributes (name + options + variation/visible flags + raw)
CREATE TABLE IF NOT EXISTS synced_product_attribute (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id      UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES synced_product (id) ON DELETE CASCADE,
  external_id  TEXT,
  name         TEXT NOT NULL,
  slug         TEXT,
  options      JSONB,
  is_variation BOOLEAN NOT NULL DEFAULT false,
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  position     INTEGER NOT NULL DEFAULT 0,
  raw          JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sprodattr_product ON synced_product_attribute (product_id, position);
CREATE INDEX IF NOT EXISTS idx_sprodattr_site ON synced_product_attribute (site_id);
