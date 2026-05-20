/**
 * @vizzo/dashboard — LivePreview Component
 * Simulated mobile phone frame showing live storefront preview.
 * Reads current banner slots and products from state (passed via props).
 * On mobile: full-screen overlay mode.
 */

import { STOREFRONT_STRINGS } from '@vizzo/shared';
import type { Product, Store, BannerSlot } from '@vizzo/shared';
import { getEffectivePrice } from '@vizzo/shared';

interface LivePreviewProps {
  store: Store | null;
  bannerSlots: BannerSlot[];
  products: Product[];
  discountedProducts: Product[];
  isOverlay: boolean;
  onClose?: () => void;
}

export default function LivePreview({
  store,
  bannerSlots,
  products,
  discountedProducts,
  isOverlay,
  onClose,
}: LivePreviewProps) {
  const visibleSlots = bannerSlots
    .filter((slot) => slot.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  const renderProductCard = (product: Product) => {
    const thumb = product.images?.[0];
    const price = getEffectivePrice(product);
    const isDiscounted = product.is_discounted && product.discount_price !== null;

    return (
      <div className="preview-product-card" key={product.id}>
        {thumb ? (
          <img
            className="preview-product-thumb"
            src={thumb}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="preview-product-thumb-placeholder">📦</div>
        )}
        <div className="preview-product-info">
          <div className="preview-product-name">{product.name}</div>
          <div className="preview-product-price">
            {isDiscounted && (
              <span className="preview-product-original-price">
                {product.base_price.toLocaleString('ar-SD')}
              </span>
            )}
            {price.toLocaleString('ar-SD')} ج.س
            {isDiscounted && (
              <span className="preview-discount-badge"> خصم</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBannerSection = (slot: BannerSlot) => {
    let slotProducts: Product[] = [];

    if (slot.slot_type === 'auto_discount') {
      slotProducts = discountedProducts;
      if (slotProducts.length === 0) {
        return null;
      }
    } else {
      slotProducts = products.filter((p) => slot.product_ids.includes(p.id));
      if (slotProducts.length === 0) {
        return null;
      }
    }

    return (
      <div className="preview-banner-section" key={slot.id}>
        <div className="preview-banner-title">{slot.title}</div>
        <div className="preview-banner-scroll">
          {slotProducts.map(renderProductCard)}
        </div>
      </div>
    );
  };

  const phoneContent = (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="preview-store-header">
          {store?.logo_url ? (
            <img
              className="preview-store-logo"
              src={store.logo_url}
              alt={store.name}
            />
          ) : (
            <div className="preview-store-logo-placeholder">
              {store?.name?.charAt(0) || 'V'}
            </div>
          )}
          <div className="preview-store-name">{store?.name || 'المتجر'}</div>
        </div>

        {visibleSlots.length > 0 ? (
          visibleSlots.map(renderBannerSection)
        ) : (
          <div className="preview-empty-banner">
            {STOREFRONT_STRINGS.emptyStore}
          </div>
        )}

        {products.length > 0 && (
          <div className="preview-banner-section">
            <div className="preview-banner-title">جميع المنتجات</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                padding: '0 16px 16px',
              }}
            >
              {products.slice(0, 6).map(renderProductCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="preview-overlay">
        <div className="preview-overlay-header">
          <span className="preview-overlay-title">معاينة المتجر</span>
          <button
            className="preview-overlay-close"
            onClick={onClose}
            aria-label="إغلاق المعاينة"
          >
            ✕
          </button>
        </div>
        {phoneContent}
      </div>
    );
  }

  return (
    <div className="editor-preview-panel">
      {phoneContent}
    </div>
  );
}
