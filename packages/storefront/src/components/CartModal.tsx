import { useState } from 'react';
import { createSupabaseClient, buildWhatsAppPayload, MAX_NOTES_LENGTH } from '@vizzo/shared';
import type { HydratedCartItem } from '../hooks/useCart';
import '../styles/cart.css';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  hydratedItems: HydratedCartItem[];
  total: number;
  isHydrating: boolean;
  onUpdateQuantity: (productId: string, qty: number, variant?: string) => void;
  onRemoveItem: (productId: string, variant?: string) => void;
  onClearCart: () => void;
  storeName: string;
  whatsappNumber: string;
  onOrderSent: () => void; // hook to trigger analytics order_sent
}

export function CartModal({
  isOpen,
  onClose,
  hydratedItems,
  total,
  isHydrating,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  storeName,
  whatsappNumber,
  onOrderSent,
}: CartModalProps) {
  const [notes, setNotes] = useState('');
  const [isPreflightChecking, setIsPreflightChecking] = useState(false);
  const [concurrencyError, setConcurrencyError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (hydratedItems.length === 0) return;

    const supabase = createSupabaseClient();
    if (!supabase) return;

    try {
      setIsPreflightChecking(true);
      setConcurrencyError(null);

      // Pre-flight Concurrency Check: Query latest state for all items
      const productIds = hydratedItems.map((item) => item.product_id);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, is_available, is_archived')
        .in('id', productIds);

      if (error) throw error;

      // Map dynamic server values
      const serverMap = new Map(data?.map((p) => [p.id, p]));

      // Identify conflicting out of stock/archived items
      const conflicts: string[] = [];
      hydratedItems.forEach((item) => {
        const prod = serverMap.get(item.product_id);
        if (!prod || prod.is_archived || !prod.is_available) {
          conflicts.push(item.product?.name || 'منتج غير معروف');
        }
      });

      if (conflicts.length > 0) {
        setConcurrencyError(
          `عذراً، بعض المنتجات في سلتك لم تعد متوفرة حالياً: (${conflicts.join(
            '، '
          )}). الرجاء إزالتها لإتمام الطلب.`
        );
        setIsPreflightChecking(false);
        return;
      }

      // Build items array for WhatsApp payload
      const payloadItems = hydratedItems.map((item) => ({
        name: item.product?.name || 'منتج',
        price: item.effectivePrice,
        variant: item.variant,
        quantity: item.quantity,
      }));

      // Generate WhatsApp link
      const storeUrl = window.location.origin + window.location.pathname;
      const waLink = buildWhatsAppPayload(
        payloadItems,
        total,
        notes,
        storeUrl,
        whatsappNumber
      );

      // Dispatch order analytics event (INV-08 async)
      onOrderSent();

      // Open WhatsApp in new tab
      window.open(waLink, '_blank');

      // Clear local cart state
      onClearCart();
      onClose();
    } catch (e: any) {
      console.error('[CartModal Checkout Error] Check failed:', e);
      setConcurrencyError('حدث خطأ أثناء معالجة الطلب، الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsPreflightChecking(false);
    }
  };

  const handleEmptyCartRedirect = () => {
    onClose();
    // Smooth scroll to product catalog feed grid
    const feed = document.getElementById('product-grid');
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="cart-modal-backdrop" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <h2 className="cart-title">سلة التسوق</h2>
          <button className="cart-close-btn" onClick={onClose} aria-label="إغلاق السلة">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              style={{ width: 24, height: 24 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content list */}
        <div className="cart-items-container">
          {concurrencyError && (
            <div className="cart-concurrency-error">{concurrencyError}</div>
          )}

          {hydratedItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '1.5rem', opacity: 0.8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 64, height: 64 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>سلة التسوق فارغة</span>
              <button
                className="detail-add-cart-cta"
                style={{ height: '40px', padding: '0 24px' }}
                onClick={handleEmptyCartRedirect}
              >
                العودة للتصفح
              </button>
            </div>
          ) : (
            hydratedItems.map((item) => {
              const isItemAvailable = item.isAvailable;
              return (
                <div
                  key={`${item.product_id}-${item.variant || ''}`}
                  className={`cart-item-row ${!isItemAvailable ? 'unavailable' : ''}`}
                >
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="cart-item-thumb"
                    />
                  ) : (
                    <div className="cart-item-thumb" style={{ background: '#1c1c3c' }} />
                  )}

                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.product?.name || 'تحميل...'}</h4>
                    {item.variant && (
                      <span className="cart-item-variant">{item.variant}</span>
                    )}
                    <span className="cart-item-price">
                      {isItemAvailable
                        ? `${item.effectivePrice.toLocaleString('ar-SD')} ج.س`
                        : 'غير متوفر'}
                    </span>
                    {!isItemAvailable && (
                      <span className="cart-item-warning">المنتج نفد من المخزون، يرجى حذفه</span>
                    )}
                  </div>

                  {isItemAvailable && (
                    <div className="cart-stepper">
                      <button
                        className="stepper-btn"
                        onClick={() =>
                          onUpdateQuantity(item.product_id, item.quantity - 1, item.variant)
                        }
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="stepper-value">{item.quantity}</span>
                      <button
                        className="stepper-btn"
                        onClick={() =>
                          onUpdateQuantity(item.product_id, item.quantity + 1, item.variant)
                        }
                        disabled={item.quantity >= 15}
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    className="cart-item-remove-btn"
                    onClick={() => onRemoveItem(item.product_id, item.variant)}
                    aria-label="حذف"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      style={{ width: 20, height: 20 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Notes & Checkout */}
        {hydratedItems.length > 0 && (
          <>
            <div className="cart-notes-wrapper">
              <label htmlFor="cart-notes" className="cart-notes-label">الملاحظات (الاسم، العنوان، إلخ):</label>
              <textarea
                id="cart-notes"
                className="cart-notes-input"
                maxLength={MAX_NOTES_LENGTH}
                placeholder="مثلاً: الاسم، رقم الاتصال البديل، وموقع التوصيل بالتفصيل..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="cart-footer-summary">
              <div className="cart-summary-row">
                <span>الإجمالي:</span>
                <span>{total.toLocaleString('ar-SD')} ج.س</span>
              </div>
              <button
                className="cart-dispatch-btn"
                disabled={
                  isHydrating ||
                  isPreflightChecking ||
                  hydratedItems.some((i) => !i.isAvailable)
                }
                onClick={handleCheckout}
              >
                {isPreflightChecking ? 'جاري التحقق...' : 'إرسال الطلب عبر الواتساب'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
