import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseClient, getEffectivePrice, computeCartTotal, MAX_CART_ITEMS } from '@vizzo/shared';
import type { CartItem, Product } from '@vizzo/shared';

export interface HydratedCartItem extends CartItem {
  product: Product | null;
  isAvailable: boolean;
  effectivePrice: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydratedItems, setHydratedItems] = useState<HydratedCartItem[]>([]);
  const [isHydrating, setIsHydrating] = useState(false);

  // 1. Initial load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vizzo_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[useCart] LocalStorage parse error:', e);
    }
  }, []);

  // Save to LocalStorage helper
  const saveCart = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('vizzo_cart', JSON.stringify(newItems));
  }, []);

  // 2. Hydrate details from Supabase when local items array updates
  const hydrateCart = useCallback(async (currentItems: CartItem[]) => {
    if (currentItems.length === 0) {
      setHydratedItems([]);
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase) return;

    try {
      setIsHydrating(true);
      const productIds = currentItems.map((item) => item.product_id);

      // Fetch latest available columns
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) throw error;

      const productMap = new Map<string, Product>((data || []).map((p) => [p.id, p]));

      const hydrated: HydratedCartItem[] = currentItems.map((item) => {
        const product = productMap.get(item.product_id) || null;
        const isAvailable = product ? (!product.is_archived && product.is_available) : false;
        const effectivePrice = product ? getEffectivePrice(product) : 0;

        return {
          ...item,
          product,
          isAvailable,
          effectivePrice,
        };
      });

      setHydratedItems(hydrated);
    } catch (e) {
      console.error('[useCart] Hydration failed:', e);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    hydrateCart(items);
  }, [items, hydrateCart]);

  // 3. Cart mutation helpers
  const addItem = useCallback(
    (productId: string, variant?: string) => {
      // Find matching item in cart
      const existingIndex = items.findIndex(
        (i) => i.product_id === productId && i.variant === variant
      );

      if (existingIndex > -1) {
        // Enforce MAX item quantity limit to 15 per row
        const newItems = [...items];
        const newQty = Math.min(newItems[existingIndex].quantity + 1, 15);
        newItems[existingIndex].quantity = newQty;
        saveCart(newItems);
      } else {
        // Enforce AP-10: Max 15 unique items in total
        if (items.length >= MAX_CART_ITEMS) {
          alert('سلة التسوق ممتلئة! يمكنك إضافة بحد أقصى 15 منتجاً مختلفاً.');
          return;
        }

        const newItems = [...items, { product_id: productId, quantity: 1, variant }];
        saveCart(newItems);
      }
    },
    [items, saveCart]
  );

  const removeItem = useCallback(
    (productId: string, variant?: string) => {
      const newItems = items.filter(
        (i) => !(i.product_id === productId && i.variant === variant)
      );
      saveCart(newItems);
    },
    [items, saveCart]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variant?: string) => {
      // Quantity bound enforcement 1-15
      const boundedQty = Math.max(1, Math.min(15, Math.round(quantity)));
      const newItems = items.map((item) => {
        if (item.product_id === productId && item.variant === variant) {
          return { ...item, quantity: boundedQty };
        }
        return item;
      });
      saveCart(newItems);
    },
    [items, saveCart]
  );

  const clearCart = useCallback(() => {
    saveCart([]);
  }, [saveCart]);

  // Calculate cart total dynamically from real-time pricing snapshot (AP-01 / INV-03)
  const total = useMemo(() => {
    const rawItems = hydratedItems
      .filter((i) => i.isAvailable)
      .map((item) => ({
        price: item.effectivePrice,
        quantity: item.quantity,
      }));
    return computeCartTotal(rawItems);
  }, [hydratedItems]);

  return {
    items,
    hydratedItems,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isHydrating,
    refetch: () => hydrateCart(items),
  };
}
