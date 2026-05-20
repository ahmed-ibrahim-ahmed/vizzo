import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { createSupabaseClient } from '@vizzo/shared';
import type { Store, Product } from '@vizzo/shared';

// Components
import { StickyHeader } from './components/StickyHeader';
import { SearchBar } from './components/SearchBar';
import { FloatingFilterBar } from './components/FloatingFilterBar';
import { BannerCarousel } from './components/BannerCarousel';
import { ProductGrid } from './components/ProductGrid';
import { BuyerProductCard } from './components/BuyerProductCard';
import { VariantSheet } from './components/VariantSheet';
import { CartModal } from './components/CartModal';
import { WatermarkBanner } from './components/WatermarkBanner';
import { EmptySearchState, EmptyStoreState } from './components/ZeroStates';

// Pages
import ProductDetailPage from './pages/ProductDetailPage';

// Hooks
import { useCart } from './hooks/useCart';
import { useBanners } from './hooks/useBanners';
import { useInfiniteProducts } from './hooks/useInfiniteProducts';
import { useAnalyticsEmitter } from './hooks/useAnalyticsEmitter';

function StorefrontContainer() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!slug) return;
      
      const supabase = createSupabaseClient();
      if (!supabase) {
        setStoreError('فشل الاتصال بقاعدة البيانات');
        setStoreLoading(false);
        return;
      }

      try {
        setStoreLoading(true);
        setStoreError(null);

        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setStoreError('هذا المتجر غير موجود');
          setStoreLoading(false);
          return;
        }

        setStore(data as Store);
      } catch (err: any) {
        console.error('[StorefrontContainer] Store fetch failed:', err);
        setStoreError('حدث خطأ أثناء تحميل بيانات المتجر');
      } finally {
        setStoreLoading(false);
      }
    };

    fetchStore();
  }, [slug]);

  if (storeLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
          fontFamily: "'Noto Sans Arabic', sans-serif",
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '90%', maxWidth: '400px' }}>
          <div style={{ height: '80px', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '240px', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '120px', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
          fontFamily: "'Noto Sans Arabic', sans-serif",
          color: '#fff',
          direction: 'rtl',
          padding: '1rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '3rem 2rem',
            borderRadius: '1.5rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', color: '#ef4444' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>هذا المتجر غير موجود</h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '2rem' }}>
            يرجى التأكد من الرابط الذي قمت بزيارته، أو تواصل مع صاحب المتجر للاستفسار.
          </p>
          <a
            href="https://vizzotrade.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '44px',
              background: '#7c3aed',
              color: '#fff',
              textDecoration: 'none',
              padding: '0 2rem',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
              transition: 'transform 0.2s ease',
            }}
          >
            الذهاب إلى Vizzotrade
          </a>
        </div>
      </div>
    );
  }

  return <StorefrontActiveStore store={store} />;
}

interface StorefrontActiveStoreProps {
  store: Store;
}

function StorefrontActiveStore({ store }: StorefrontActiveStoreProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();

  // Analytics Emitter
  const { trackPageView, trackAddToCart, trackOrderSent } = useAnalyticsEmitter();

  // Cart Management
  const {
    items,
    hydratedItems,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isHydrating,
  } = useCart();

  // Navigation / Filters / Search State
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Variant intercept state
  const [intersectingProduct, setIntersectingProduct] = useState<Product | null>(null);

  // Telemetry event pageview trigger
  useEffect(() => {
    if (productId) {
      trackPageView(store.id, productId);
    } else {
      trackPageView(store.id, null);
    }
  }, [productId, store.id, trackPageView]);

  // Infinite Grid loading
  const {
    products,
    totalCount,
    hasMore,
    loadMore,
    loading: productsLoading,
  } = useInfiniteProducts({
    storeId: store.id,
    category: activeCategory,
    sortBy,
    searchQuery,
  });

  const { banners } = useBanners(store.id);

  // Get total count of store items to detect Empty Store state
  const { products: allStoreProducts, loading: allStoreProductsLoading } = useInfiniteProducts({
    storeId: store.id,
    category: 'all',
    sortBy: 'newest',
    searchQuery: '',
  });

  const handleAddToCartAttempt = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (product.color) {
      setIntersectingProduct(product);
    } else {
      addItem(product.id);
      trackAddToCart(store.id, product.id);
    }
  };

  const handleVariantSelect = (variant: string) => {
    if (intersectingProduct) {
      addItem(intersectingProduct.id, variant);
      trackAddToCart(store.id, intersectingProduct.id);
      setIntersectingProduct(null);
    }
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const isStoreEmpty = !allStoreProductsLoading && allStoreProducts.length === 0;

  if (isStoreEmpty) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)', color: '#fff' }}>
        <EmptyStoreState store={store} />
        <WatermarkBanner store={store} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dense Sticky Header */}
      <StickyHeader
        store={store}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, paddingBottom: '120px' }}>
        {productId ? (
          <ProductDetailPage
            onAddToCart={(prod, variant) => {
              if (variant) {
                addItem(prod.id, variant);
                trackAddToCart(store.id, prod.id);
              } else {
                handleAddToCartAttempt(prod);
              }
            }}
          />
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
            {/* Search Module */}
            <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />

            {/* Horizontal Banner Carousels (only if not searching) */}
            {!searchQuery.trim() && (
              <BannerCarousel
                banners={banners}
                onProductClick={(id) => navigate(`/${store.slug}/p/${id}`)}
                onAddToCart={handleAddToCartAttempt}
              />
            )}

            {/* Floating Filter and Sort Bar */}
            <FloatingFilterBar
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Product Feed Grid / Zero states */}
            {products.length === 0 && !productsLoading ? (
              searchQuery.trim() ? (
                <EmptySearchState keyword={searchQuery} whatsappNumber={store.whatsapp_number} />
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.6, fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                  لا توجد منتجات في هذه الفئة حالياً.
                </div>
              )
            ) : (
              <ProductGrid
                products={products}
                loading={productsLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                renderCard={(product) => (
                  <BuyerProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => navigate(`/${store.slug}/p/${id}`)}
                    onAddToCart={handleAddToCartAttempt}
                  />
                )}
              />
            )}
          </div>
        )}
      </main>

      {/* Free-Tier Watermark Banner */}
      <WatermarkBanner store={store} />

      {/* Cart Modal & Pre-flight Concurrency Check */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        hydratedItems={hydratedItems}
        total={total}
        isHydrating={isHydrating}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        storeName={store.name}
        whatsappNumber={store.whatsapp_number}
        onOrderSent={() => trackOrderSent(store.id)}
      />

      {/* Variant Interception Sheet */}
      {intersectingProduct && (
        <VariantSheet
          product={intersectingProduct}
          onClose={() => setIntersectingProduct(null)}
          onConfirm={handleVariantSelect}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug" element={<StorefrontContainer />} />
        <Route path="/:slug/p/:productId" element={<StorefrontContainer />} />
        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                color: '#fff',
                fontFamily: "'Noto Sans Arabic', sans-serif",
                padding: '1rem',
                direction: 'rtl',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '3rem 2rem',
                  borderRadius: '1.5rem',
                  maxWidth: '450px',
                  width: '100%',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              >
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Vizzotrade</h1>
                <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '2rem' }}>
                  واجهة المتجر الإلكتروني. الرجاء استخدام رابط المتجر المخصص لك.
                </p>
                <a
                  href="https://vizzotrade.com"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '44px',
                    background: '#7c3aed',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '0 2rem',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  الذهاب للرئيسية
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
