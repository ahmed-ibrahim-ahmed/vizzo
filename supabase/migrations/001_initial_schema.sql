-- Vizzo Platform — Initial Schema Migration
-- All tables use uuid primary keys with gen_random_uuid() default.
-- Timestamps use timestamptz with now() default.

-- ═══════════════════════════════════════════════════════════════════════
-- Table: merchants
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id text UNIQUE NOT NULL,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_merchants_google_id ON merchants (google_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: stores
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  whatsapp_number text NOT NULL CHECK (whatsapp_number ~ '^\+249[0-9]{9,10}$'),
  location text,
  logo_url text,
  tiktok_url text,
  instagram_url text,
  facebook_url text,
  is_pro boolean DEFAULT false,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'pending', 'active', 'expired')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stores_slug ON stores (slug);
CREATE INDEX idx_stores_merchant_id ON stores (merchant_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: products
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_price integer NOT NULL CHECK (base_price > 0),
  discount_price integer CHECK (discount_price IS NULL OR (discount_price > 0 AND discount_price < base_price)),
  is_discounted boolean DEFAULT false,
  discount_expires_at timestamptz,
  is_available boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  category text NOT NULL CHECK (category IN ('phones', 'laptops', 'accessories')),
  images text[] NOT NULL CHECK (array_length(images, 1) >= 1),
  sort_order integer DEFAULT 0,
  brand text,
  storage_capacity text,
  ram text,
  color text,
  condition text CHECK (condition IS NULL OR condition IN ('new', 'used')),
  processor text,
  gpu_type text CHECK (gpu_type IS NULL OR gpu_type IN ('internal', 'external', 'none')),
  gpu_name text,
  storage_type text CHECK (storage_type IS NULL OR storage_type IN ('hdd', 'ssd')),
  notes text,
  custom_attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_products_store_id ON products (store_id);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_is_available ON products (is_available);
CREATE INDEX idx_products_is_archived ON products (is_archived);
CREATE INDEX idx_products_is_discounted ON products (is_discounted);
CREATE INDEX idx_products_store_available ON products (store_id, is_archived, is_available);

-- Constraint: gpu_name must be NULL when gpu_type is not 'external'
ALTER TABLE products ADD CONSTRAINT chk_gpu_name_external
  CHECK (gpu_type != 'external' AND gpu_name IS NULL OR gpu_type = 'external');

-- ═══════════════════════════════════════════════════════════════════════
-- Table: banner_slots
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE banner_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  slot_type text NOT NULL CHECK (slot_type IN ('auto_discount', 'manual')),
  sort_order integer DEFAULT 0,
  product_ids uuid[] DEFAULT '{}',
  is_visible boolean DEFAULT true
);

CREATE INDEX idx_banner_slots_store_id ON banner_slots (store_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: subscriptions
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('monthly', 'quarterly', 'annual')),
  amount_usd integer NOT NULL,
  receipt_image_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  expires_at timestamptz
);

-- ═══════════════════════════════════════════════════════════════════════
-- Table: analytics
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'add_to_cart', 'favorite', 'order_sent')),
  product_id uuid REFERENCES products(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_store_event ON analytics (store_id, event_type);
CREATE INDEX idx_analytics_created_at ON analytics (created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Merchants: Users can SELECT/UPDATE their own row
CREATE POLICY "Merchants can view own row" ON merchants
  FOR SELECT USING (auth.jwt() ->> 'sub' = google_id);

CREATE POLICY "Merchants can update own row" ON merchants
  FOR UPDATE USING (auth.jwt() ->> 'sub' = google_id);

-- Stores: Owner can full CRUD, Public can SELECT
CREATE POLICY "Store owner full access" ON stores
  FOR ALL USING (
    merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Public store read" ON stores
  FOR SELECT USING (true);

-- Products: Owner can full CRUD, Public can SELECT non-archived
CREATE POLICY "Product owner full access" ON products
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

CREATE POLICY "Public product read" ON products
  FOR SELECT USING (is_archived = false);

-- Banner slots: Owner full CRUD, Public can SELECT visible
CREATE POLICY "Banner owner full access" ON banner_slots
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

CREATE POLICY "Public banner read" ON banner_slots
  FOR SELECT USING (is_visible = true);

-- Subscriptions: Owner can SELECT/INSERT, only service_role can UPDATE
CREATE POLICY "Subscription owner read" ON subscriptions
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

CREATE POLICY "Subscription owner insert" ON subscriptions
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

-- Analytics: INSERT open for anon, SELECT restricted to store owner
CREATE POLICY "Public analytics insert" ON analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics owner read" ON analytics
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE merchant_id = (SELECT id FROM merchants WHERE google_id = auth.jwt() ->> 'sub'))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- Trigger: auto_init_banners()
-- After INSERT on stores, creates 4 default banner_slots
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_init_banners()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO banner_slots (store_id, title, slot_type, sort_order) VALUES
    (NEW.id, 'عروض اليوم', 'auto_discount', 0),
    (NEW.id, 'الاكثر طلبا', 'manual', 1),
    (NEW.id, 'الهواتف', 'manual', 2),
    (NEW.id, 'الملحقات', 'manual', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_init_banners
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION auto_init_banners();

-- ═══════════════════════════════════════════════════════════════════════
-- Function: check_product_limit()
-- Before INSERT on products, enforces free/pro tier limits
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  product_count integer;
  store_is_pro boolean;
BEGIN
  SELECT is_pro INTO store_is_pro FROM stores WHERE id = NEW.store_id;

  -- Count existing non-archived products for the store
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE store_id = NEW.store_id AND is_archived = false;

  -- Free tier: max 20 products
  IF store_is_pro = false AND product_count >= 20 THEN
    RAISE EXCEPTION 'Free tier product limit reached (20 products). Upgrade to Pro for unlimited products.';
  END IF;

  -- Free tier: max 2 images per product
  IF store_is_pro = false AND array_length(NEW.images, 1) > 2 THEN
    RAISE EXCEPTION 'Free tier allows a maximum of 2 images per product. Upgrade to Pro for 5 images.';
  END IF;

  -- Pro tier: max 5 images per product
  IF store_is_pro = true AND array_length(NEW.images, 1) > 5 THEN
    RAISE EXCEPTION 'Pro tier allows a maximum of 5 images per product.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_product_limit
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_limit();
