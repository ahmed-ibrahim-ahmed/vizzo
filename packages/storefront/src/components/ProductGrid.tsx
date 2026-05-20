import { useEffect, useRef } from 'react';
import type { Product } from '@vizzo/shared';
import '../styles/grid.css';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  renderCard: (product: Product) => React.ReactNode;
}

export function ProductGrid({
  products,
  loading,
  hasMore,
  onLoadMore,
  renderCard,
}: ProductGridProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="grid-container" id="product-grid">
      <div className="product-feed-grid">
        {products.map((product) => renderCard(product))}

        {/* Pulsing Skeleton screen blocks during loading (AP-05) */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="skeleton-card">
              <div className="skeleton-thumbnail" />
              <div className="skeleton-info">
                <div className="skeleton-text title" />
                <div className="skeleton-text price" />
                <div className="skeleton-btn" />
              </div>
            </div>
          ))}
      </div>

      {/* Intersection Observer Sentinel Element */}
      {hasMore && !loading && <div ref={sentinelRef} className="grid-sentinel" />}
    </div>
  );
}
