/**
 * @vizzo/dashboard — BannerSlotEditor Component
 * Editor for individual banner slots.
 * Auto-Discount: queries is_discounted=true products automatically, cannot be manually populated.
 * Manual Banners: lets merchant pick products via ProductSelectorModal.
 */

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient, STOREFRONT_STRINGS } from '@vizzo/shared';
import type { BannerSlot, Product } from '@vizzo/shared';
import ProductSelectorModal from './ProductSelectorModal';

interface BannerSlotEditorProps {
  slot: BannerSlot;
  storeId: string;
  onBack: () => void;
  onUpdateSlot: (updated: BannerSlot) => void;
}

export default function BannerSlotEditor({
  slot,
  storeId,
  onBack,
  onUpdateSlot,
}: BannerSlotEditorProps) {
  const [title, setTitle] = useState(slot.title);
  const [isVisible, setIsVisible] = useState(slot.is_visible);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [manualProducts, setManualProducts] = useState<Product[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAutoDiscount = slot.slot_type === 'auto_discount';

  const fetchDiscountedProducts = useCallback(async () => {
    if (!isAutoDiscount) return;
    const supabase = createSupabaseClient();
    if (!supabase || !storeId) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_discounted', true)
        .eq('is_archived', false)
        .eq('is_available', true);

      if (!error && data) {
        setDiscountedProducts(data as Product[]);
      }
    } catch (err) {
      console.error('[BannerSlotEditor] Error fetching discounted products:', err);
    }
  }, [isAutoDiscount, storeId]);

  const fetchManualProducts = useCallback(async () => {
    if (isAutoDiscount) return;
    if (slot.product_ids.length === 0) {
      setManualProducts([]);
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase || !storeId) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', slot.product_ids)
        .eq('is_archived', false);

      if (!error && data) {
        setManualProducts(data as Product[]);
      }
    } catch (err) {
      console.error('[BannerSlotEditor] Error fetching manual products:', err);
    }
  }, [isAutoDiscount, slot.product_ids, storeId]);

  useEffect(() => {
    fetchDiscountedProducts();
    fetchManualProducts();
  }, [fetchDiscountedProducts, fetchManualProducts]);

  const updateSlot = async (updates: Partial<BannerSlot>) => {
    const supabase = createSupabaseClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('banner_slots')
        .update(updates)
        .eq('id', slot.id);

      if (!error) {
        onUpdateSlot({ ...slot, ...updates });
      } else {
        console.error('[BannerSlotEditor] Error updating slot:', error);
      }
    } catch (err) {
      console.error('[BannerSlotEditor] Error updating slot:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== slot.title) {
      updateSlot({ title: title.trim() });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleVisibilityToggle = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    updateSlot({ is_visible: newVisible });
  };

  const handleProductSelect = async (ids: string[]) => {
    const supabase = createSupabaseClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('banner_slots')
        .update({ product_ids: ids })
        .eq('id', slot.id);

      if (!error) {
        onUpdateSlot({ ...slot, product_ids: ids });

        if (ids.length > 0) {
          const { data } = await supabase
            .from('products')
            .select('*')
            .in('id', ids)
            .eq('is_archived', false);

          if (data) {
            setManualProducts(data as Product[]);
          }
        } else {
          setManualProducts([]);
        }
      }
    } catch (err) {
      console.error('[BannerSlotEditor] Error saving product selection:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="banner-slot-editor">
      <div className="banner-slot-header">
        <div className="banner-slot-header-right">
          <button
            className="banner-slot-back-btn"
            onClick={onBack}
            aria-label="رجوع"
          >
            →
          </button>
          <input
            className="banner-slot-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            aria-label="عنوان البنر"
          />
        </div>
        <label className="toggle-switch">
          <input
            className="toggle-switch-input"
            type="checkbox"
            checked={isVisible}
            onChange={handleVisibilityToggle}
            disabled={saving}
          />
          <span className="toggle-switch-track" />
          <span className="toggle-switch-thumb" />
        </label>
      </div>

      {isAutoDiscount ? (
        <div className="auto-discount-section">
          {discountedProducts.length === 0 ? (
            <div className="auto-discount-note">
              <span className="auto-discount-note-icon">⚠️</span>
              <span>{STOREFRONT_STRINGS.noDiscounts}</span>
            </div>
          ) : (
            <>
              <div className="auto-discount-product-count">
                <strong>{discountedProducts.length}</strong> منتج مخفض
              </div>
              <div className="auto-discount-preview-list">
                {discountedProducts.map((p) => (
                  p.images?.[0] ? (
                    <img
                      key={p.id}
                      className="auto-discount-preview-item"
                      src={p.images[0]}
                      alt={p.name}
                      loading="lazy"
                    />
                  ) : (
                    <div key={p.id} className="auto-discount-preview-placeholder">
                      📦
                    </div>
                  )
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="manual-banner-section">
          <div className="manual-banner-products-label">
            المنتجات المختارة ({manualProducts.length})
          </div>
          {manualProducts.length > 0 ? (
            <div className="manual-banner-products">
              {manualProducts.map((p) => (
                p.images?.[0] ? (
                  <img
                    key={p.id}
                    className="manual-banner-product-thumb"
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                  />
                ) : (
                  <div key={p.id} className="manual-banner-product-placeholder">
                    📦
                  </div>
                )
              ))}
              <button
                className="manual-banner-add-btn"
                onClick={() => setSelectorOpen(true)}
                aria-label="إضافة منتجات"
              >
                +
              </button>
            </div>
          ) : (
            <div className="manual-banner-empty">
              لم يتم اختيار منتجات بعد
              <button
                className="manual-banner-add-btn"
                style={{ margin: '12px auto 0', width: 48, height: 48 }}
                onClick={() => setSelectorOpen(true)}
                aria-label="إضافة منتجات"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      <ProductSelectorModal
        storeId={storeId}
        selectedIds={slot.product_ids}
        onSave={handleProductSelect}
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
      />
    </div>
  );
}
