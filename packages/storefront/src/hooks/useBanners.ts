import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@vizzo/shared';
import type { BannerSlot, Product } from '@vizzo/shared';

export interface HydratedBannerSlot extends BannerSlot {
  products: Product[];
}

export function useBanners(storeId: string) {
  const [banners, setBanners] = useState<HydratedBannerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch visible banner slots ordered by sort_order
      const { data: slots, error: slotsError } = await supabase
        .from('banner_slots')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (slotsError) throw slotsError;
      if (!slots || slots.length === 0) {
        setBanners([]);
        setLoading(false);
        return;
      }

      // 2. Hydrate each banner slot based on its type
      const hydratedSlots: HydratedBannerSlot[] = [];

      for (const slot of (slots as BannerSlot[])) {
        let slotProducts: Product[] = [];

        if (slot.slot_type === 'auto_discount') {
          // Query products that are discounted, available, and not archived
          const { data: discountProducts, error: dpError } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .eq('is_discounted', true)
            .eq('is_available', true)
            .eq('is_archived', false)
            .order('sort_order', { ascending: true });

          if (!dpError && discountProducts) {
            slotProducts = discountProducts as Product[];
          }
        } else if (slot.slot_type === 'manual' && slot.product_ids?.length > 0) {
          // Fetch specific products by ID array
          const { data: manualProducts, error: mpError } = await supabase
            .from('products')
            .select('*')
            .in('id', slot.product_ids)
            .eq('is_available', true)
            .eq('is_archived', false);

          if (!mpError && manualProducts) {
            // Re-order manual products to match the slot's product_ids order if possible
            const idMap = new Map(manualProducts.map((p) => [p.id, p]));
            slotProducts = slot.product_ids
              .map((id) => idMap.get(id))
              .filter((p): p is Product => !!p);
          }
        }

        // Only include slots that have products (or display:none handles it)
        // If auto_discount slot has 0 items, we will enforce display: none
        hydratedSlots.push({
          ...slot,
          products: slotProducts,
        });
      }

      setBanners(hydratedSlots);
    } catch (err: any) {
      console.error('[Vizzo useBanners] Error:', err.message || err);
      setError('فشل تحميل بنرات المتجر');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchBanners();
    }
  }, [storeId, fetchBanners]);

  return { banners, loading, error, refetch: fetchBanners };
}
