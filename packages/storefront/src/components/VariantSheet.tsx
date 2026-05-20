import { useState, useMemo } from 'react';
import type { Product } from '@vizzo/shared';
import { getEffectivePrice } from '@vizzo/shared';
import '../styles/variant.css';

interface VariantSheetProps {
  product: Product;
  onClose: () => void;
  onConfirm: (variant: string) => void;
}

export function VariantSheet({ product, onClose, onConfirm }: VariantSheetProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Parse color string into clean flat array
  const variants = useMemo(() => {
    if (!product.color) return [];
    return product.color
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }, [product.color]);

  const effectivePrice = getEffectivePrice(product);

  const handleConfirm = () => {
    if (selectedVariant) {
      onConfirm(selectedVariant);
    }
  };

  return (
    <div className="variant-backdrop" onClick={onClose}>
      <div className="variant-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="variant-sheet-header">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="variant-sheet-thumb"
            />
          ) : (
            <div className="variant-sheet-thumb" style={{ background: '#1c1c3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24, color: '#555' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )}
          <div className="variant-sheet-title-info">
            <h3 className="variant-sheet-name">{product.name}</h3>
            <span className="variant-sheet-price">
              {effectivePrice.toLocaleString('ar-SD')} ج.س
            </span>
          </div>
          <button className="variant-close-btn" onClick={onClose} aria-label="إغلاق">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              style={{ width: 24, height: 24 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="variant-selector-section">
          <h4 className="variant-label">اختر خياراً (اللون/الموديل):</h4>
          <div className="variant-options-group">
            {variants.map((v) => (
              <button
                key={v}
                className={`variant-chip ${selectedVariant === v ? 'selected' : ''}`}
                onClick={() => setSelectedVariant(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          className="variant-confirm-btn"
          disabled={!selectedVariant}
          onClick={handleConfirm}
        >
          أضف إلى السلة
        </button>
      </div>
    </div>
  );
}
