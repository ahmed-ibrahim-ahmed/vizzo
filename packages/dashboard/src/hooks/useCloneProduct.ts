/**
 * @vizzo/dashboard — useCloneProduct Hook
 * Rapid Clone Engine: fetches a product by ID and navigates
 * to /products/new with pre-filled data via React Router state.
 * Shares the same image URLs — no re-upload needed.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupabaseClient } from '@vizzo/shared';
import type { Product, Store } from '@vizzo/shared';

interface UseCloneProductOptions {
  store: Store | null;
}

export function useCloneProduct({ store }: UseCloneProductOptions) {
  const navigate = useNavigate();

  const cloneProduct = useCallback(
    async (productId: string) => {
      const supabase = createSupabaseClient();
      if (!supabase || !store) {
        console.error('[useCloneProduct] Supabase client or store not available');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('store_id', store.id)
          .single();

        if (error) throw error;
        if (!data) return;

        const product = data as Product;

        navigate('/products/new', {
          state: { clonedProduct: product },
        });
      } catch (err) {
        console.error('[useCloneProduct] Failed to fetch product:', err);
      }
    },
    [navigate, store]
  );

  return { cloneProduct };
}
