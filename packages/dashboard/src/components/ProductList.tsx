/**
 * @vizzo/dashboard — Product List
 * Vertical list of ProductCards with filter bar, skeleton loading, and empty state.
 */

import { useProducts } from '../hooks/useProducts';
import FilterBar from './FilterBar';
import ProductCard from './ProductCard';
import '../styles/productlist.css';

function SkeletonCards() {
  return (
    <div className="product-list" aria-busy="true" aria-label="جارٍ تحميل المنتجات">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-image" />
          <div className="skeleton-card-text">
            <div className="skeleton-card-line skeleton-card-line-medium" />
            <div className="skeleton-card-line skeleton-card-line-short" />
            <div className="skeleton-card-line skeleton-card-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <svg
        className="empty-state-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <p className="empty-state-text">لا توجد منتجات بعد</p>
    </div>
  );
}

export default function ProductList() {
  const {
    products,
    loading,
    refetch,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  } = useProducts();

  return (
    <section aria-label="قائمة المنتجات">
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      {loading ? (
        <SkeletonCards />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="product-list">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onRefetch={refetch} />
          ))}
        </div>
      )}
    </section>
  );
}
