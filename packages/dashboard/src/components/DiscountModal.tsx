/**
 * @vizzo/dashboard — DiscountModal Component
 * Modal overlay for managing product discounts.
 * Validates discount_price < base_price strictly.
 * Temporal trigger: N days duration with computed discount_expires_at.
 * Save → auto-syndicates to buyer storefront banner.
 * Remove → clears all discount fields.
 */

import { useEffect, useRef } from 'react';
import { DASHBOARD_STRINGS } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';
import { useDiscount } from '../hooks/useDiscount';
import '../styles/discount.css';

interface DiscountModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function DiscountModal({
  product,
  isOpen,
  onClose,
  onSaved,
}: DiscountModalProps) {
  const {
    discountPrice,
    setDiscountPrice,
    durationDays,
    setDurationDays,
    isSubmitting,
    error,
    setError,
    isDiscountValid,
    isDurationValid,
    saveDiscount,
    removeDiscount,
  } = useDiscount({ product, onSaved });

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleSave = async () => {
    const success = await saveDiscount();
    if (success) {
      onClose();
    }
  };

  const handleRemove = async () => {
    const success = await removeDiscount();
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const showDiscountError =
    discountPrice.trim() !== '' &&
    !isNaN(parseFloat(discountPrice)) &&
    (parseFloat(discountPrice) <= 0 ||
      parseFloat(discountPrice) >= product.base_price);

  return (
    <div
      ref={overlayRef}
      className="discount-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="إدارة التخفيض"
    >
      <div className="discount-modal">
        <h2 className="discount-modal-title">
          {DASHBOARD_STRINGS.actionDiscount}
        </h2>

        {product.is_discounted && (
          <div className="discount-active-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            تخفيض نشط
          </div>
        )}

        {/* Current Price — read-only */}
        <div className="discount-current-price">
          <span className="discount-current-price-label">
            {DASHBOARD_STRINGS.discountOriginal}
          </span>
          <span className="discount-current-price-value">
            {product.base_price}
          </span>
        </div>

        {/* Discount Price Input */}
        <div className="discount-input-group">
          <label className="discount-input-label" htmlFor="discount-price">
            {DASHBOARD_STRINGS.discountNew}
          </label>
          <input
            id="discount-price"
            type="number"
            className={`discount-input ${showDiscountError ? 'discount-input-error' : ''}`}
            value={discountPrice}
            onChange={(e) => {
              setDiscountPrice(e.target.value);
              setError(null);
            }}
            placeholder="0"
            min="1"
            dir="ltr"
          />
        </div>

        {/* Duration Group */}
        <div className="discount-duration-group">
          <span className="discount-duration-text">
            {DASHBOARD_STRINGS.discountDuration}
          </span>
          <input
            type="number"
            className="discount-duration-input"
            value={durationDays}
            onChange={(e) => {
              setDurationDays(e.target.value);
              setError(null);
            }}
            min="1"
            dir="ltr"
          />
          <span className="discount-duration-label">
            {DASHBOARD_STRINGS.discountDays}
          </span>
        </div>

        {/* Error Messages */}
        <div className="discount-error">
          {showDiscountError && DASHBOARD_STRINGS.discountError}
          {!showDiscountError && error}
        </div>

        {/* Actions */}
        <div className="discount-actions">
          <button
            className="discount-save-btn"
            onClick={handleSave}
            disabled={isSubmitting || !isDiscountValid || !isDurationValid}
            type="button"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التخفيض'}
          </button>
          {product.is_discounted && (
            <button
              className="discount-remove-btn"
              onClick={handleRemove}
              disabled={isSubmitting}
              type="button"
            >
              إزالة التخفيض
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
