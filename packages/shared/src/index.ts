/**
 * @vizzo/shared — Main Entry Point
 * Re-exports everything from types, constants, utils, and supabase.
 */

// Types
export type {
  CartItem,
  Product,
  Merchant,
  Store,
  Subscription,
  BannerSlot,
  AnalyticsEvent,
  Category,
  SubscriptionTier,
  SubscriptionStatus,
  StoreSubscriptionStatus,
  ProductCondition,
  GpuType,
  StorageType,
  BannerSlotType,
  AnalyticsEventType,
} from './types/index.js';

// Constants
export {
  SUDAN_COUNTRY_CODE,
  MAX_CART_ITEMS,
  MAX_NOTES_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  FREE_TIER_PRODUCT_LIMIT,
  FREE_TIER_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
  DEFAULT_DISCOUNT_DAYS,
  PRODUCT_BATCH_SIZE,
  SEARCH_LATENCY_BUDGET_MS,
  WEBP_QUALITY,
  WATERMARK_TEXT,
  CATEGORIES,
  AVAILABILITY_LABELS,
  PRICING,
  BANK_DETAILS,
  LANDING_STRINGS,
  DASHBOARD_STRINGS,
  STOREFRONT_STRINGS,
  PRODUCT_FORM_STRINGS,
} from './constants/index.js';

// Utils
export { generateSlug } from './utils/slug.js';
export { getEffectivePrice, computeCartTotal } from './utils/price.js';
export { buildWhatsAppPayload } from './utils/whatsapp.js';
export { compressImage } from './utils/compression.js';

// Supabase
export { createSupabaseClient, createSupabaseServerClient } from './supabase/client.js';
