/**
 * @vizzo/dashboard — StorefrontEditorPage
 * Route: /editor (via bottom nav المتجر tab).
 * Desktop (≥ 1024px): Split screen — right: EditorControls, left: LivePreview.
 * Mobile (< 1024px): Full-screen EditorControls + floating preview toggle.
 */

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@vizzo/shared';
import type { Product, Store, BannerSlot } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';
import EditorControls from '../components/EditorControls';
import LivePreview from '../components/LivePreview';
import '../styles/editor.css';
import '../styles/bannerslot.css';

export default function StorefrontEditorPage() {
  const { store, setStore } = useStore();
  const [bannerSlots, setBannerSlots] = useState<BannerSlot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [localStore, setLocalStore] = useState<Store>(store);
  const [dataLoading, setDataLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setLocalStore(store);
  }, [store]);

  const fetchData = useCallback(async () => {
    if (!store.id) {
      setDataLoading(false);
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      const [slotsResult, productsResult, discountedResult] = await Promise.all([
        supabase
          .from('banner_slots')
          .select('*')
          .eq('store_id', store.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_archived', false)
          .order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_discounted', true)
          .eq('is_archived', false)
          .eq('is_available', true),
      ]);

      if (slotsResult.data) {
        setBannerSlots(slotsResult.data as BannerSlot[]);
      }
      if (productsResult.data) {
        setProducts(productsResult.data as Product[]);
      }
      if (discountedResult.data) {
        setDiscountedProducts(discountedResult.data as Product[]);
      }
    } catch (err) {
      console.error('[StorefrontEditorPage] Error fetching data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [store.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateSlots = (newSlots: BannerSlot[]) => {
    setBannerSlots(newSlots);
  };

  const handleUpdateStore = (updated: Store) => {
    setLocalStore(updated);
    setStore(updated);
  };

  const handlePreviewToggle = () => {
    setPreviewOpen((prev) => !prev);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  if (dataLoading) {
    return (
      <div className="editor-page">
        <div className="editor-controls-panel">
          <div className="editor-section">
            <div className="skeleton-rect skeleton-logo" style={{ marginBottom: '12px' }} />
            <div className="skeleton-rect" style={{ height: '16px', width: '120px', marginBottom: '8px' }} />
            <div className="skeleton-rect" style={{ height: '12px', width: '180px' }} />
          </div>
          <div className="editor-section">
            <div className="skeleton-rect" style={{ height: '16px', width: '100px', marginBottom: '16px' }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="skeleton-rect skeleton-banner-row" key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <EditorControls
        store={localStore}
        bannerSlots={bannerSlots}
        products={products}
        discountedProducts={discountedProducts}
        onUpdateSlots={handleUpdateSlots}
        onUpdateStore={handleUpdateStore}
        onPreviewToggle={handlePreviewToggle}
      />

      <LivePreview
        store={localStore}
        bannerSlots={bannerSlots}
        products={products}
        discountedProducts={discountedProducts}
        isOverlay={false}
      />

      {previewOpen && (
        <LivePreview
          store={localStore}
          bannerSlots={bannerSlots}
          products={products}
          discountedProducts={discountedProducts}
          isOverlay={true}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
