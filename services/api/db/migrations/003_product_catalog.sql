-- Migration 003 — full product catalog sync read-models.
--
-- Extends the WooCommerce sync from a flat product list to the real catalog: categories, the
-- product↔category relationship, variations, and product images. Every row is tenant + site
-- scoped (default-deny isolation) and carries the raw WooCommerce payload (`raw` JSONB) for
-- forward compatibility. Sync is idempotent: products/categories/variants upsert on
-- (site_id, external_id); per-product images and category links are replaced atomically on each
-- product upsert, so repeated syncs never duplicate rows.
--
-- Rollback: drop the four tables added here and the `raw` column on synced_product (additive,
-- safe). See db/migrations/ROLLBACK.md.

-- Preserve the raw WooCommerce product payload for forward compatibility (server-side only).
ALTER TABLE synced_product ADD COLUMN IF NOT EXISTS raw JSONB;
ALTER TABLE synced_product ADD COLUMN IF NOT EXISTS type TEXT;

-- ---------------------------------------------------------------------------
-- Categories (per site). parent_external_id models the WooCommerce category tree.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS synced_category (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id            UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  external_id        TEXT NOT NULL,
  parent_external_id TEXT,
  name               TEXT NOT NULL,
  slug               TEXT,
  raw                JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_scategory_site ON synced_category (site_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Product ↔ category relationship (many-to-many). Replaced per product on each sync.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS synced_product_category (
  product_id  UUID NOT NULL REFERENCES synced_product (id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES synced_category (id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_sprodcat_category ON synced_product_category (category_id);
CREATE INDEX IF NOT EXISTS idx_sprodcat_site ON synced_product_category (site_id);

-- ---------------------------------------------------------------------------
-- Product variations (for variable products). Money in minor units.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS synced_product_variant (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id       UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES synced_product (id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL,
  sku           TEXT,
  price_minor   BIGINT NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'IRT',
  stock_qty     INTEGER,
  stock_status  TEXT,
  attributes    JSONB,
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_svariant_product ON synced_product_variant (product_id);
CREATE INDEX IF NOT EXISTS idx_svariant_site ON synced_product_variant (site_id);

-- ---------------------------------------------------------------------------
-- Product images. Replaced per product on each sync (position-ordered).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS synced_product_image (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id      UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES synced_product (id) ON DELETE CASCADE,
  external_id  TEXT,
  src          TEXT NOT NULL,
  alt          TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  raw          JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_simage_product ON synced_product_image (product_id, position);
CREATE INDEX IF NOT EXISTS idx_simage_site ON synced_product_image (site_id);
