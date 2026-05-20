-- Vizzo Platform — Supabase RLS Hardening Migration
-- This migration audits, reinforces, and drops/recreates security policies
-- to ensure strict data segregation and protection.

-- ═══════════════════════════════════════════════════════════════════════
-- Audit & Re-enable RLS on all active tables
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- Table: merchants (Segregation by Google OAuth sub claim)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Merchants can view own row" ON merchants;
CREATE POLICY "Merchants can view own row" ON merchants
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = google_id);

DROP POLICY IF EXISTS "Merchants can update own row" ON merchants;
CREATE POLICY "Merchants can update own row" ON merchants
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = google_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: stores (Owner full access, Public read-only)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Store owner full access" ON stores;
CREATE POLICY "Store owner full access" ON stores
  FOR ALL TO authenticated
  USING (
    merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub')
  )
  WITH CHECK (
    merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Public store read" ON stores;
CREATE POLICY "Public store read" ON stores
  FOR SELECT TO anon, authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: products (Owner CRUD, Public read-only for active/non-archived)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Product owner full access" ON products;
CREATE POLICY "Product owner full access" ON products
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Public product read" ON products;
CREATE POLICY "Public product read" ON products
  FOR SELECT TO anon, authenticated
  USING (is_archived = false);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: banner_slots (Owner CRUD, Public read-only for visible slots)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Banner owner full access" ON banner_slots;
CREATE POLICY "Banner owner full access" ON banner_slots
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Public banner read" ON banner_slots;
CREATE POLICY "Public banner read" ON banner_slots
  FOR SELECT TO anon, authenticated
  USING (is_visible = true);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: subscriptions (Owner read/write, updates locked to service_role)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Subscription owner read" ON subscriptions;
CREATE POLICY "Subscription owner read" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Subscription owner insert" ON subscriptions;
CREATE POLICY "Subscription owner insert" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

-- Note: Since no policy allows UPDATE on subscriptions, it is locked down.
-- Only the administrative service_role (which bypasses RLS) can approve/reject.

-- ═══════════════════════════════════════════════════════════════════════
-- Table: analytics (Public anonymous writes, Owner-only reads)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public analytics insert" ON analytics;
CREATE POLICY "Public analytics insert" ON analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Analytics owner read" ON analytics;
CREATE POLICY "Analytics owner read" ON analytics
  FOR SELECT TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );
