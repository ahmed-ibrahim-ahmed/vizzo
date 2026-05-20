import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseClient, getEffectivePrice } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';

interface UseInfiniteProductsProps {
  storeId: string;
  category: string; // 'all', 'phones', 'laptops', 'accessories'
  sortBy: string;   // 'newest', 'lowest_price', 'highest_price'
  searchQuery: string;
}

export function useInfiniteProducts({
  storeId,
  category,
  sortBy,
  searchQuery,
}: UseInfiniteProductsProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query products belonging to the store, not archived
      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setAllProducts((data || []) as Product[]);
    } catch (err: any) {
      console.error('[useInfiniteProducts] Error:', err.message || err);
      setError('فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId, fetchProducts]);

  // Reset pagination when category, sort, or search changes
  useEffect(() => {
    setVisibleCount(20);
  }, [category, sortBy, searchQuery]);

  // Filter and Sort in JS
  const processedProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Filter by category
    if (category && category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    // 2. Filter by search query
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      try {
        const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        result = result.filter((p) => regex.test(p.name));
      } catch (e) {
        const lower = trimmedQuery.toLowerCase();
        result = result.filter((p) => p.name.toLowerCase().includes(lower));
      }
    }

    // 3. Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'lowest_price') {
      // Critical sort constraint: Lowest Price must use discount_price (getEffectivePrice)
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'highest_price') {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    }

    return result;
  }, [allProducts, category, sortBy, searchQuery]);

  const paginatedProducts = useMemo(() => {
    return processedProducts.slice(0, visibleCount);
  }, [processedProducts, visibleCount]);

  const hasMore = visibleCount < processedProducts.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => prev + 20);
    }
  }, [hasMore]);

  return {
    allProducts, // pre-loaded raw array for search modules
    products: paginatedProducts,
    totalCount: processedProducts.length,
    hasMore,
    loadMore,
    loading,
    error,
    refetch: fetchProducts,
  };
}
