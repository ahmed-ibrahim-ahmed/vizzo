import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSupabaseClient, getEffectivePrice } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';
import { BuyerProductCard } from '../components/BuyerProductCard';
import '../styles/productdetail.css';
import '../styles/tombstone.css';

interface ProductDetailPageProps {
  onAddToCart: (product: Product, variant?: string) => void;
}

export default function ProductDetailPage({ onAddToCart }: ProductDetailPageProps) {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery scroll tracking
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const fetchProductDetails = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase || !productId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch main product details
      const { data, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (productError) throw productError;
      if (!data) {
        setError('المنتج غير موجود');
        setLoading(false);
        return;
      }

      const prod = data as Product;
      setProduct(prod);

      // 2. Fetch recommended products from the same category (excluding current)
      const { data: recs, error: recsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', prod.store_id)
        .eq('category', prod.category)
        .eq('is_available', true)
        .eq('is_archived', false)
        .neq('id', prod.id)
        .limit(6);

      if (!recsError && recs) {
        setRecommendedProducts(recs as Product[]);
      }
    } catch (err: any) {
      console.error('[ProductDetailPage] Error:', err.message || err);
      setError('فشل تحميل تفاصيل المنتج');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [productId, fetchProductDetails]);

  // Reset variant selection on product changes
  useEffect(() => {
    setSelectedVariant(null);
    setActiveImageIndex(0);
    if (galleryRef.current) {
      galleryRef.current.scrollLeft = 0;
    }
  }, [productId]);

  // Handle gallery scroll event to update dot indicators
  const handleGalleryScroll = () => {
    if (!galleryRef.current) return;
    const width = galleryRef.current.offsetWidth;
    const scrollPos = galleryRef.current.scrollLeft;
    // In RTL, scrollLeft is negative or positive depending on browser, let's normalize
    const index = Math.round(Math.abs(scrollPos) / width);
    setActiveImageIndex(index);
  };

  // Color variants parser
  const variants = useMemo(() => {
    if (!product || !product.color) return [];
    return product.color
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }, [product]);

  const hasVariants = variants.length > 0;
  const isAvailable = product && !product.is_archived && product.is_available;

  if (loading) {
    return (
      <div className="detail-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>جاري تحميل تفاصيل المنتج...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="detail-page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{ color: 'var(--color-error)' }}>{error || 'المنتج غير موجود'}</div>
        <button className="detail-back-btn" onClick={() => navigate(`/${slug}`)}>
          العودة للمتجر
        </button>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = product.is_discounted && product.discount_price !== null;

  return (
    <div className="detail-page-container">
      {/* Back trigger header */}
      <div className="detail-nav-header">
        <button className="detail-back-btn" onClick={() => navigate(`/${slug}`)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="detail-back-icon"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          العودة للمتجر
        </button>
      </div>

      <div className={!isAvailable ? 'tombstone-wrapper' : ''}>
        {!isAvailable && <div className="tombstone-badge-overlay">نفد من المخزون</div>}

        <div className={!isAvailable ? 'tombstone-grayscale-filter' : ''}>
          {/* Gallery Section */}
          <section className="detail-gallery-section">
            <div
              className="detail-gallery-viewport"
              ref={galleryRef}
              onScroll={handleGalleryScroll}
            >
              {product.images && product.images.length > 0 ? (
                product.images.map((img, i) => (
                  <div key={i} className="detail-gallery-slide">
                    <img src={img} alt={`${product.name} - ${i + 1}`} className="detail-gallery-image" />
                  </div>
                ))
              ) : (
                <div className="detail-gallery-slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c3c' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 80, height: 80, color: '#555' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="detail-gallery-dots">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    className={`gallery-dot ${activeImageIndex === i ? 'active' : ''}`}
                    onClick={() => {
                      if (galleryRef.current) {
                        const width = galleryRef.current.offsetWidth;
                        galleryRef.current.scrollLeft = -i * width; // Support standard RTL scroll layout
                      }
                    }}
                    aria-label={`عرض الصورة ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Product info block */}
          <section className="detail-info-block">
            {product.brand && <span className="detail-brand-badge">{product.brand}</span>}
            <h2 className="detail-product-name">{product.name}</h2>
            <div className="detail-price-box">
              <span className={`detail-price-effective ${hasDiscount ? 'is-discounted' : ''}`}>
                {effectivePrice.toLocaleString('ar-SD')} ج.س
              </span>
              {hasDiscount && (
                <span className="detail-price-base">
                  {product.base_price.toLocaleString('ar-SD')} ج.س
                </span>
              )}
            </div>
          </section>

          {/* Specifications Table */}
          <section className="detail-specs-section">
            <h3 className="specs-title">المواصفات الفنية</h3>
            <table className="specs-table">
              <tbody>
                {product.brand && (
                  <tr className="specs-row">
                    <td className="specs-label">الماركة</td>
                    <td className="specs-value">{product.brand}</td>
                  </tr>
                )}
                {product.condition && (
                  <tr className="specs-row">
                    <td className="specs-label">الحالة</td>
                    <td className="specs-value">{product.condition === 'new' ? 'جديد' : 'مستعمل'}</td>
                  </tr>
                )}
                {product.storage_capacity && (
                  <tr className="specs-row">
                    <td className="specs-label">سعة التخزين</td>
                    <td className="specs-value">
                      {product.storage_capacity} {product.storage_type ? product.storage_type.toUpperCase() : ''}
                    </td>
                  </tr>
                )}
                {product.ram && (
                  <tr className="specs-row">
                    <td className="specs-label">الذاكرة العشوائية (RAM)</td>
                    <td className="specs-value">{product.ram}</td>
                  </tr>
                )}
                {product.processor && (
                  <tr className="specs-row">
                    <td className="specs-label">المعالج</td>
                    <td className="specs-value">{product.processor}</td>
                  </tr>
                )}
                {product.gpu_name && (
                  <tr className="specs-row">
                    <td className="specs-label">كرت الشاشة</td>
                    <td className="specs-value">{product.gpu_name}</td>
                  </tr>
                )}
                {/* Dynamic/Custom attributes */}
                {product.custom_attributes &&
                  Object.entries(product.custom_attributes).map(([key, value]) => (
                    <tr className="specs-row" key={key}>
                      <td className="specs-label">{key}</td>
                      <td className="specs-value">{value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>

          {/* Color variants selector (if applicable and available) */}
          {hasVariants && isAvailable && (
            <section className="detail-specs-section" style={{ paddingTop: 0 }}>
              <h3 className="specs-title">الخيارات المتاحة (اللون/الموديل)</h3>
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
            </section>
          )}

          {/* Notes field */}
          {product.notes && (
            <section className="detail-notes-section">
              <h4 className="detail-notes-title">ملاحظات إضافية</h4>
              <p className="detail-notes-content">{product.notes}</p>
            </section>
          )}
        </div>
      </div>

      {/* Recommendation grid for out-of-stock items OR general engagement */}
      {recommendedProducts.length > 0 && (
        <section className="tombstone-recommendations">
          <h3 className="tombstone-recommendations-title">
            {!isAvailable ? 'منتجات مشابهة متوفرة حالياً' : 'منتجات مشابهة قد تعجبك'}
          </h3>
          <div className="product-feed-grid" style={{ padding: '0 var(--space-4)' }}>
            {recommendedProducts.map((p) => (
              <BuyerProductCard
                key={p.id}
                product={p}
                onProductClick={(id) => navigate(`/${slug}/p/${id}`)}
                onAddToCart={(prod, e) => {
                  e.stopPropagation();
                  onAddToCart(prod);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky footer action button (hide if out of stock / archived) */}
      {isAvailable && (
        <div className="detail-action-footer">
          <button
            className="detail-add-cart-cta"
            onClick={() => {
              if (hasVariants && !selectedVariant) {
                // If variant not selected, alert or focus
                alert('الرجاء اختيار اللون/الموديل المفضل أولاً');
                return;
              }
              onAddToCart(product, selectedVariant || undefined);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              style={{ width: 22, height: 22 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            أضف إلى السلة
          </button>
        </div>
      )}
    </div>
  );
}
