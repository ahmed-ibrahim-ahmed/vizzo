/**
 * @vizzo/dashboard — useAnalytics Hook
 * Fetches aggregated analytics counts for the merchant's store.
 * Groups analytics events by type and returns counts.
 */

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@vizzo/shared';
import type { AnalyticsEventType } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';

interface AnalyticsData {
  pageViews: number;
  interestCount: number;
  conversionCount: number;
  loading: boolean;
}

export function useAnalytics(): AnalyticsData {
  const { store } = useStore();
  const [pageViews, setPageViews] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [conversionCount, setConversionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const supabase = createSupabaseClient();

    if (!supabase || !store) {
      setPageViews(0);
      setInterestCount(0);
      setConversionCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('event_type')
        .eq('store_id', store.id);

      if (error) {
        console.error('[useAnalytics] Failed to fetch analytics:', error.message);
        setPageViews(0);
        setInterestCount(0);
        setConversionCount(0);
        return;
      }

      if (!data || data.length === 0) {
        setPageViews(0);
        setInterestCount(0);
        setConversionCount(0);
        return;
      }

      let pv = 0;
      let ic = 0;
      let cc = 0;

      for (const row of data) {
        const eventType = row.event_type as AnalyticsEventType;
        switch (eventType) {
          case 'page_view':
            pv++;
            break;
          case 'add_to_cart':
          case 'favorite':
            ic++;
            break;
          case 'order_sent':
            cc++;
            break;
        }
      }

      setPageViews(pv);
      setInterestCount(ic);
      setConversionCount(cc);
    } catch (err) {
      console.error('[useAnalytics] Unexpected error:', err);
      setPageViews(0);
      setInterestCount(0);
      setConversionCount(0);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { pageViews, interestCount, conversionCount, loading };
}
