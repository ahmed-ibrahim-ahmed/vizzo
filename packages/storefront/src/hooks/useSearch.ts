import { useState, useEffect, useMemo, useRef } from 'react';
import type { Product } from '@vizzo/shared';

export function useSearch(products: Product[]) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce query string modifications by 100ms
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 100);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  // Performs regex-based case-insensitive matching
  const filteredProducts = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      return products;
    }

    const t0 = performance.now();
    try {
      // Escape regex special chars to prevent syntax errors from user input
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const results = products.filter((product) => regex.test(product.name));

      const t1 = performance.now();
      const duration = t1 - t0;
      if (duration > 50) {
        console.warn(`[Vizzo Search] Search latency of ${duration.toFixed(2)}ms exceeded budget of 50ms.`);
      }

      return results;
    } catch (e) {
      // Fallback in case regex construction fails
      const lowerQuery = trimmed.toLowerCase();
      return products.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery)
      );
    }
  }, [products, debouncedQuery]);

  return {
    query,
    setQuery,
    filteredProducts,
    isSearching: query.trim().length > 0,
  };
}
