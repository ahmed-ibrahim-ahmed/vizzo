import type { HydratedBannerSlot } from '../hooks/useBanners';
import type { Product } from '@vizzo/shared';
import { getEffectivePrice } from '@vizzo/shared';
import '../styles/carousel.css';

interface BannerCarouselProps {
  banners: HydratedBannerSlot[];
  onProductClick: (productId: string) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export function BannerCarousel({ banners, onProductClick, onAddToCart }: BannerCarouselProps) {
  if (!banners || banners.length === 0) return null;

  return (
    <>
      {banners.map((slot) => {
        // AP-09: Render auto_discount slot with display: none (or just omit rendering) if no products
        if (slot.slot_type === 'auto_discount' && slot.products.length === 0) {
          return null;
        }

        // If manual slot has 0 products, skip rendering to prevent empty whitespace
        if (slot.products.length === 0) {
          return null;
        }

        return (
          <section key={slot.id} className="carousel-section">
            <h2 className="carousel-title">{slot.title}</h2>
            <div className="carousel-viewport">
              {slot.products.map((product) => {
                const effectivePrice = getEffectivePrice(product);
                const hasDiscount = product.is_discounted && product.discount_price !== null;

                return (
                  <div key={product.id} className="carousel-card-wrapper">
                    <div
                      className="carousel-card"
                      onClick={() => onProductClick(product.id)}
                    >
                      <div className="carousel-image-container">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="carousel-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="carousel-image" style={{ background: '#1c1c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 36, height: 36 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          </div>
                        )}
                        {hasDiscount && (
                          <span className="carousel-discount-badge">خصم %{Math.round(((product.base_price - effectivePrice) / product.base_price) * 100)}</span>
                        )}
                      </div>
                      <div className="carousel-info">
                        <h3 className="carousel-name">{product.name}</h3>
                        <div className="carousel-prices">
                          <span className={`carousel-price-current ${hasDiscount ? 'is-discounted' : ''}`}>
                            {effectivePrice.toLocaleString('ar-SD')} ج.س
                          </span>
                          {hasDiscount && (
                            <span className="carousel-price-original">
                              {product.base_price.toLocaleString('ar-SD')} ج.س
                            </span>
                          )}
                        </div>
                        <button
                          className="carousel-btn"
                          onClick={(e) => onAddToCart(product, e)}
                        >
                          أضف للسلة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
