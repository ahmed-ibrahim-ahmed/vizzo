-- Vizzo Platform — Database Indexing & Query Tuning Migration
-- Deploys advanced composite indices to optimize storefront catalog fetches,
-- accelerate RLS junction queries, and resolve billing search pipelines.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Accelerate Merchant Subscriptions Queries (P4-05 Critical Missing FK Index)
-- ═══════════════════════════════════════════════════════════════════════
-- Crucial for dashboard billing tab loading and RLS joins on stores.
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id 
  ON subscriptions (store_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Optimize Product Sorting & Pagination (Composite catalog index)
-- ═══════════════════════════════════════════════════════════════════════
-- Accelerates the infinite grid fetches:
--   SELECT * FROM products WHERE store_id = $1 AND is_archived = false 
--   ORDER BY sort_order ASC, created_at DESC;
CREATE INDEX IF NOT EXISTS idx_products_store_catalog
  ON products (store_id, is_archived, sort_order, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Audit & Enforce Primary Table Indexes
-- ═══════════════════════════════════════════════════════════════════════
-- Ensure these indexes are registered (re-declaring with IF NOT EXISTS for safety)

-- Stores slug search (storefront routing)
CREATE INDEX IF NOT EXISTS idx_stores_slug 
  ON stores (slug);

-- Stores merchant lookup (dashboard layout & auth gates)
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id 
  ON stores (merchant_id);

-- Products availability state index
CREATE INDEX IF NOT EXISTS idx_products_store_available 
  ON products (store_id, is_archived, is_available);

-- Analytics events aggregation index
CREATE INDEX IF NOT EXISTS idx_analytics_store_event 
  ON analytics (store_id, event_type);

-- Analytics time-range index
CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
  ON analytics (created_at);

-- Banner slots sorting index
CREATE INDEX IF NOT EXISTS idx_banner_slots_store_sort 
  ON banner_slots (store_id, sort_order) WHERE is_visible = true;
