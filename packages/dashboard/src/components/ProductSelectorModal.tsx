/**
 * @vizzo/dashboard — ProductSelectorModal Component
 * Modal for selecting products to add to a manual banner.
 * Vertical scrollable list of all non-archived products with checkboxes.
 * Search input at top to filter products.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';
import { getEffectivePrice } from '@vizzo/shared';

interface ProductSelectorModalProps {
  storeId: string;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductSelectorModal({
  storeId,
  selectedIds,
  onSave,
  isOpen,
  onClose,
}: ProductSelectorModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selectedIds));

  useEffect(() => {
    setLocalSelected(new Set(selectedIds));
  }, [selectedIds, isOpen]);

  const fetchProducts = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase || !storeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setProducts(data as Product[]);
      }
    } catch (err) {
      console.error('[ProductSelectorModal] Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const lower = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.brand && p.brand.toLowerCase().includes(lower))
    );
  }, [products, search]);

  const toggleProduct = (id: string) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onSave(Array.from(localSelected));
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = localSelected.size;

  return (
    <div className="product-selector-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="product-selector-modal">
        <div className="product-selector-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="product-selector-title">اختيار المنتجات</span>
            {selectedCount > 0 && (
              <span className="product-selector-count">{selectedCount}</span>
            )}
          </div>
          <button
            className="product-selector-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="product-selector-search">
          <input
            className="product-selector-search-input"
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="product-selector-list">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-product-item" key={i}>
                <div className="skeleton-rect skeleton-product-thumb" />
                <div>
                  <div className="skeleton-rect skeleton-product-text" />
                  <div className="skeleton-rect skeleton-product-text-short" />
                </div>
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="product-selector-empty">
              {search.trim() ? 'لا توجد نتائج' : 'لا توجد منتجات متاحة'}
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = localSelected.has(product.id);
              const thumb = product.images?.[0];
              const price = getEffectivePrice(product);
              const isDiscounted = product.is_discounted && product.discount_price !== null;

              return (
                <div
                  key={product.id}
                  className={`product-selector-item${isSelected ? ' selected' : ''}`}
                  onClick={() => toggleProduct(product.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleProduct(product.id);
                    }
                  }}
                >
                  <div className="product-selector-checkbox">
                    <span className="product-selector-checkbox-icon">✓</span>
                  </div>
                  {thumb ? (
                    <img
                      className="product-selector-thumb"
                      src={thumb}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="product-selector-thumb-placeholder">📦</div>
                  )}
                  <div className="product-selector-item-info">
                    <div className="product-selector-item-name">{product.name}</div>
                    <div className="product-selector-item-price">
                      {isDiscounted && (
                        <span className="product-selector-item-price-original">
                          {product.base_price.toLocaleString('ar-SD')} ج.س
                        </span>
                      )}
                      <span className="product-selector-item-price-current">
                        {price.toLocaleString('ar-SD')} ج.س
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="product-selector-actions">
          <button className="product-selector-cancel-btn" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="product-selector-confirm-btn"
            onClick={handleConfirm}
          >
            تأكيد الاختيار{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
