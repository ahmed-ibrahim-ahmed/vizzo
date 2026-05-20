import { useCallback } from 'react';
import { createSupabaseClient } from '@vizzo/shared';

export function useAnalyticsEmitter() {
  const emitEvent = useCallback(
    (
      storeId: string,
      eventType: 'page_view' | 'add_to_cart' | 'order_sent',
      productId: string | null = null
    ) => {
      // Use queueMicrotask if available, fallback to setTimeout for non-blocking execution
      const runAsync = typeof queueMicrotask === 'function' ? queueMicrotask : (fn: () => void) => setTimeout(fn, 0);

      runAsync(async () => {
        try {
          const supabase = createSupabaseClient();
          if (!supabase) return;

          // Dispatch fire-and-forget analytic write
          await supabase.from('analytics').insert({
            store_id: storeId,
            event_type: eventType,
            product_id: productId,
          });
        } catch (error) {
          // Catch errors silently to guarantee zero customer-facing disruption (INV-08)
          console.warn('[Analytics] Silent error dispatching telemetry:', error);
        }
      });
    },
    []
  );

  const trackPageView = useCallback(
    (storeId: string, productId: string | null = null) => {
      emitEvent(storeId, 'page_view', productId);
    },
    [emitEvent]
  );

  const trackAddToCart = useCallback(
    (storeId: string, productId: string) => {
      emitEvent(storeId, 'add_to_cart', productId);
    },
    [emitEvent]
  );

  const trackOrderSent = useCallback(
    (storeId: string) => {
      emitEvent(storeId, 'order_sent', null);
    },
    [emitEvent]
  );

  return {
    trackPageView,
    trackAddToCart,
    trackOrderSent,
  };
}
