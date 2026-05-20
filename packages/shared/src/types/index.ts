/**
 * @vizzo/shared — Type Definitions
 * Canonical type definitions for the Vizzo Platform.
 * No type may contradict the System Architecture or Project Map.
 */

/** CartItem — the ONLY shape allowed in localStorage (AP-01) */
export interface CartItem {
  product_id: string;   // UUID
  quantity: number;      // integer, 1–15
  variant?: string;      // cosmetic variant label (e.g., color string)
}

/** Product — maps to the `products` table in Supabase */
export interface Product {
  id: string;
  store_id: string;
  name: string;
  base_price: number;
  discount_price: number | null;
  is_discounted: boolean;
  discount_expires_at: string | null;
  is_available: boolean;
  is_archived: boolean;
  category: 'phones' | 'laptops' | 'accessories';
  images: string[];
  sort_order: number;
  brand: string | null;
  storage_capacity: string | null;
  ram: string | null;
  color: string | null;
  condition: 'new' | 'used' | null;
  processor: string | null;
  gpu_type: 'internal' | 'external' | 'none' | null;
  gpu_name: string | null;
  storage_type: 'hdd' | 'ssd' | null;
  notes: string | null;
  custom_attributes: Record<string, string>;
  created_at: string;
}

/** Merchant — maps to the `merchants` table */
export interface Merchant {
  id: string;
  google_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

/** Store — maps to the `stores` table */
export interface Store {
  id: string;
  merchant_id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  location: string | null;
  logo_url: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  is_pro: boolean;
  subscription_status: 'free' | 'pending' | 'active' | 'expired';
  created_at: string;
}

/** Subscription — maps to the `subscriptions` table */
export interface Subscription {
  id: string;
  store_id: string;
  tier: 'monthly' | 'quarterly' | 'annual';
  amount_usd: number;
  receipt_image_url: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  created_at: string;
  approved_at: string | null;
  expires_at: string | null;
}

/** BannerSlot — maps to the `banner_slots` table */
export interface BannerSlot {
  id: string;
  store_id: string;
  title: string;
  slot_type: 'auto_discount' | 'manual';
  sort_order: number;
  product_ids: string[];
  is_visible: boolean;
}

/** AnalyticsEvent — maps to the `analytics` table */
export interface AnalyticsEvent {
  id: string;
  store_id: string;
  event_type: 'page_view' | 'add_to_cart' | 'favorite' | 'order_sent';
  product_id: string | null;
  created_at: string;
}

/** Category type union */
export type Category = 'phones' | 'laptops' | 'accessories';

/** Subscription tier type */
export type SubscriptionTier = 'monthly' | 'quarterly' | 'annual';

/** Subscription status type */
export type SubscriptionStatus = 'pending' | 'active' | 'rejected' | 'expired';

/** Store subscription status type */
export type StoreSubscriptionStatus = 'free' | 'pending' | 'active' | 'expired';

/** Product condition type */
export type ProductCondition = 'new' | 'used';

/** GPU type */
export type GpuType = 'internal' | 'external' | 'none';

/** Storage type */
export type StorageType = 'hdd' | 'ssd';

/** Banner slot type */
export type BannerSlotType = 'auto_discount' | 'manual';

/** Analytics event type */
export type AnalyticsEventType = 'page_view' | 'add_to_cart' | 'favorite' | 'order_sent';
