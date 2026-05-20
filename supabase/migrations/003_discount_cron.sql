-- Vizzo Platform — Automated Discount Expiration Cron Migration
-- This migration schedules a database job that executes hourly
-- to purge expired discounts from products.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Enable pg_cron Extension
-- ═══════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Define Expiration Stored Function
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION expire_discounts()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Perform atomic update to revert products to base pricing
  UPDATE products
  SET is_discounted = false,
      discount_price = NULL,
      discount_expires_at = NULL
  WHERE is_discounted = true
    AND discount_expires_at IS NOT NULL
    AND discount_expires_at < NOW();
    
  -- Grab the number of affected rows
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log inside the PostgreSQL server logs for auditability
  IF updated_count > 0 THEN
    RAISE NOTICE '[Discount Expiry Cron] Successfully purged % expired product discounts.', updated_count;
  END IF;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to public (handled securely via SECURITY DEFINER)
REVOKE ALL ON FUNCTION expire_discounts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION expire_discounts() TO postgres, service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Schedule the Cron Job
-- ═══════════════════════════════════════════════════════════════════════

-- Safe unscheduling to prevent duplicate job records on multiple migrations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-discounts-hourly') THEN
    PERFORM cron.unschedule('expire-discounts-hourly');
  END IF;
END $$;

-- Register the job: runs at minute 0 of every hour (e.g. 1:00, 2:00...)
SELECT cron.schedule('expire-discounts-hourly', '0 * * * *', 'SELECT expire_discounts()');
