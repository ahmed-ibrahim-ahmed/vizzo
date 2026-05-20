/**
 * @vizzo/dashboard — Product Card
 * Horizontal card with thumbnail, info, availability toggle, and actions menu.
 * Optimistic UI updates for availability toggle.
 */

import { useState, useRef, useCallback } from 'react';
import { createSupabaseClient, DASHBOARD_STRINGS, CATEGORIES } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';
import { useStore } from './AuthGate';
import { useCloneProduct } from '../hooks/useCloneProduct';
import ProductActions from './ProductActions';
import DiscountModal from './DiscountModal';
import '../styles/productcard.css';

interface ProductCardProps {
  product: Product;
  onRefetch: () => void;
}

export default function ProductCard({ product, onRefetch }: ProductCardProps) {
  const [isAvailable, setIsAvailable] = useState(product.is_available);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const { store } = useStore();
  const { cloneProduct } = useCloneProduct({ store });

  const handleToggle = useCallback(async () => {
    const newValue = !isAvailable;
    const oldValue = isAvailable;

    // Optimistic update
    setIsAvailable(newValue);
    setToggleError(null);
    setToggling(true);

    const supabase = createSupabaseClient();
    if (!supabase) {
      setIsAvailable(oldValue);
      setToggleError('خطأ في الاتصال');
      setToggling(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: newValue })
        .eq('id', product.id);

      if (error) {
        setIsAvailable(oldValue);
        setToggleError('فشل التحديث');
        console.error('[ProductCard] Toggle error:', error.message);
        return;
      }

      onRefetch();
    } catch (err) {
      setIsAvailable(oldValue);
      setToggleError('خطأ غير متوقع');
      console.error('[ProductCard] Unexpected toggle error:', err);
    } finally {
      setToggling(false);
    }
  }, [isAvailable, product.id, onRefetch]);

  const handleOpenDiscount = useCallback(() => {
    setActionsOpen(false);
    setDiscountOpen(true);
  }, []);

  const handleClone = useCallback(() => {
    setActionsOpen(false);
    cloneProduct(product.id);
  }, [cloneProduct, product.id]);

  const handleCloseActions = useCallback(() => {
    setActionsOpen(false);
  }, []);

  const thumbnail = product.images?.[0] ?? null;
  const categoryLabel = CATEGORIES[product.category] ?? product.category;

  return (
    <article className="product-card">
      {/* Thumbnail */}
      {thumbnail ? (
        <img
          className="product-card-image"
          src={thumbnail}
          alt={product.name}
          loading="lazy"
        />
      ) : (
        <div className="product-card-image-placeholder" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}

      {/* Product Info */}
      <div className="product-card-info">
        <span className="product-card-name">{product.name}</span>
        <span className="product-card-category">{categoryLabel}</span>
        {product.is_discounted && product.discount_price !== null ? (
          <div className="product-card-price">
            <span className="product-card-price-original">
              {product.base_price} $
            </span>
            <span className="product-card-price-discount">
              {product.discount_price} $
            </span>
          </div>
        ) : (
          <span className="product-card-price">
            {product.base_price} $
          </span>
        )}
      </div>

      {/* Actions Column */}
      <div className="product-card-actions">
        {/* Availability Toggle */}
        <div className="availability-toggle-wrapper">
          <input
            type="checkbox"
            className="availability-toggle"
            checked={isAvailable}
            onChange={handleToggle}
            disabled={toggling}
            aria-label={
              isAvailable
                ? DASHBOARD_STRINGS.toggleAvailable
                : DASHBOARD_STRINGS.toggleUnavailable
            }
            role="switch"
          />
          <span
            className={`toggle-label ${
              isAvailable
                ? 'toggle-label-available'
                : 'toggle-label-unavailable'
            }`}
          >
            {isAvailable
              ? DASHBOARD_STRINGS.toggleAvailable
              : DASHBOARD_STRINGS.toggleUnavailable}
          </span>
          {toggleError && <span className="toggle-error">{toggleError}</span>}
        </div>

        {/* Three-dots Menu Button */}
        <button
          ref={menuBtnRef}
          className="card-menu-btn"
          onClick={() => setActionsOpen((prev) => !prev)}
          aria-label="إجراءات المنتج"
          aria-expanded={actionsOpen}
          type="button"
        >
          ⋮
        </button>
      </div>

      {/* Actions Dropdown */}
      {actionsOpen && (
        <ProductActions
          product={product}
          onClose={handleCloseActions}
          onRefetch={onRefetch}
          onOpenDiscount={handleOpenDiscount}
          onClone={handleClone}
        />
      )}

      {/* Discount Modal */}
      <DiscountModal
        product={product}
        isOpen={discountOpen}
        onClose={() => setDiscountOpen(false)}
        onSaved={onRefetch}
      />
    </article>
  );
}
