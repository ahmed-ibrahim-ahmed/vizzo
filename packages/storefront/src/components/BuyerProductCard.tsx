import type { Product } from '@vizzo/shared';
import { getEffectivePrice } from '@vizzo/shared';
import '../styles/buyercard.css';

interface BuyerProductCardProps {
  product: Product;
  onProductClick: (productId: string) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export function BuyerProductCard({
  product,
  onProductClick,
  onAddToCart,
}: BuyerProductCardProps) {
  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = product.is_discounted && product.discount_price !== null;

  return (
    <div
      className="buyer-product-card"
      onClick={() => onProductClick(product.id)}
    >
      {/* 60% vertical space allocated to image cover */}
      <div className="card-thumbnail-container">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="card-thumbnail"
            loading="lazy"
          />
        ) : (
          <div className="card-thumbnail" style={{ background: '#1c1c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 44, height: 44 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
        {hasDiscount && (
          <span className="card-discount-badge">خصم %{Math.round(((product.base_price - effectivePrice) / product.base_price) * 100)}</span>
        )}
      </div>

      <div className="card-info">
        <div className="card-name-row">
          <h3 className="card-name">{product.name}</h3>
        </div>
        <div className="card-price-row">
          <span className={`card-price-current ${hasDiscount ? 'is-discounted' : ''}`}>
            {effectivePrice.toLocaleString('ar-SD')} ج.س
          </span>
          {hasDiscount && (
            <span className="card-price-original">
              {product.base_price.toLocaleString('ar-SD')} ج.س
            </span>
          )}
        </div>
        <div className="card-action-row">
          <button
            className="card-add-btn"
            onClick={(e) => onAddToCart(product, e)}
          >
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
