import type { Product } from '@vizzo/shared';
import { getEffectivePrice } from '@vizzo/shared';
import '../styles/buyercard.css';
import '../styles/tombstone.css';

interface TombstoneCardProps {
  product: Product;
  onProductClick: (productId: string) => void;
}

export function TombstoneCard({ product, onProductClick }: TombstoneCardProps) {
  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = product.is_discounted && product.discount_price !== null;

  return (
    <div
      className="buyer-product-card tombstone-wrapper"
      onClick={() => onProductClick(product.id)}
    >
      <div className="tombstone-badge-overlay">نفد من المخزون</div>
      <div className="tombstone-grayscale-filter" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div className="card-thumbnail-container">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="card-thumbnail"
            />
          ) : (
            <div className="card-thumbnail" style={{ background: '#1c1c3c' }} />
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
          </div>
          <div className="card-action-row">
            <button className="card-add-btn" disabled style={{ background: '#4b5563', cursor: 'not-allowed' }}>
              غير متوفر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
