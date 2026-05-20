-- Vizzo Platform — Admin Authorization RLS Policies
-- Grants administrative accounts capabilities to manage merchant stores, verify subscriptions, and view analytics.

-- Define is_admin() helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- Administrative Policies for merchants
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Admins can select all merchants" ON merchants
  FOR SELECT TO authenticated
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- Administrative Policies for stores
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Admins can update all stores" ON stores
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- Administrative Policies for subscriptions
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Admins can select all subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all subscriptions" ON subscriptions
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- Administrative Policies for analytics
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Admins can select all analytics" ON analytics
  FOR SELECT TO authenticated
  USING (is_admin());
