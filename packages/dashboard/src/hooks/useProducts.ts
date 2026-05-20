/**
 * @vizzo/dashboard — useProducts Hook
 * Fetches products for the merchant's store from Supabase.
 * Client-side filtering by search query and category.
 */

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@vizzo/shared';
import type { Product, Category } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  refetch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: Category | null;
  setCategoryFilter: (category: Category | null) => void;
}

export function useProducts(): UseProductsReturn {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);

  const fetchProducts = useCallback(async () => {
    const supabase = createSupabaseClient();

    if (!supabase || !store) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useProducts] Failed to fetch products:', error.message);
        setProducts([]);
        return;
      }

      setProducts((data as Product[]) ?? []);
    } catch (err) {
      console.error('[useProducts] Unexpected error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.trim().toLowerCase());

    const matchesCategory =
      categoryFilter === null || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return {
    products: filteredProducts,
    loading,
    refetch: fetchProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  };
}
