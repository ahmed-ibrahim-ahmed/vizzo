import type { Store } from '@vizzo/shared';
import { SUDAN_COUNTRY_CODE, STOREFRONT_STRINGS } from '@vizzo/shared';
import '../styles/zerostates.css';

// 1. Empty Search Zero State
interface EmptySearchProps {
  keyword: string;
  whatsappNumber: string;
}

export function EmptySearchState({ keyword, whatsappNumber }: EmptySearchProps) {
  const normalizedNumber = whatsappNumber.startsWith('+')
    ? whatsappNumber
    : `${SUDAN_COUNTRY_CODE}${whatsappNumber}`;

  const message = `مرحباً، أود الاستفسار عن توفر هذا المنتج في متجرك: ${keyword}`;
  const waLink = `https://wa.me/${normalizedNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;

  return (
    <div className="zero-state empty-search">
      <div className="zero-state-icon-wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="zero-state-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z"
          />
        </svg>
      </div>
      <h3 className="zero-state-title">
        {STOREFRONT_STRINGS.noSearchResults} "{keyword}"
      </h3>
      <p className="zero-state-description">
        لم نتمكن من العثور على أي منتج يطابق بحثك. يمكنك طلب الاستفسار عنه مباشرة من التاجر.
      </p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="zero-state-cta"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="cta-icon"
          style={{ width: '20px', height: '20px' }}
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.884-6.963C16.59 2.026 14.121 1 11.488 1c-5.44 0-9.866 4.372-9.87 9.802 0 1.96.52 3.877 1.505 5.568L2.094 20.8l4.553-1.646zM18.667 15.11c-.381-.191-2.257-1.114-2.607-1.241-.35-.127-.606-.191-.859.191-.254.383-.984 1.241-1.207 1.495-.223.254-.446.286-.827.095-.382-.19-1.612-.594-3.072-1.897-1.137-1.013-1.905-2.264-2.128-2.646-.223-.383-.024-.59.167-.78.172-.17.382-.446.573-.67.19-.222.254-.381.382-.636.127-.255.064-.477-.032-.669-.096-.191-.859-2.07-1.178-2.834-.311-.745-.626-.644-.859-.656-.223-.012-.477-.014-.731-.014-.254 0-.669.095-1.018.477-.35.383-1.337 1.306-1.337 3.183 0 1.877 1.367 3.693 1.558 3.948.19.255 2.69 4.108 6.518 5.759.91.393 1.62.628 2.17.803.914.29 1.747.249 2.405.15.733-.11 2.257-.922 2.576-1.815.318-.892.318-1.656.223-1.814-.096-.16-.35-.255-.731-.446z" />
        </svg>
        {STOREFRONT_STRINGS.askMerchant}
      </a>
    </div>
  );
}

// 2. Empty Cart Zero State
interface EmptyCartProps {
  onBrowse: () => void;
}

export function EmptyCartState({ onBrowse }: EmptyCartProps) {
  return (
    <div className="zero-state empty-cart">
      <div className="zero-state-icon-wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="zero-state-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      </div>
      <h3 className="zero-state-title">سلة التسوق فارغة</h3>
      <p className="zero-state-description">
        لم تقم بإضافة أي منتجات إلى سلتك بعد. تصفح المنتجات المتوفرة وابدأ بالتسوق.
      </p>
      <button onClick={onBrowse} className="zero-state-cta">
        {STOREFRONT_STRINGS.backToBrowse}
      </button>
    </div>
  );
}

// 3. Empty Store Zero State (Catastrophic Fallback)
interface EmptyStoreProps {
  store: Store;
}

export function EmptyStoreState({ store }: EmptyStoreProps) {
  const normalizedNumber = store.whatsapp_number.startsWith('+')
    ? store.whatsapp_number
    : `${SUDAN_COUNTRY_CODE}${store.whatsapp_number}`;

  const welcomeMessage = `مرحباً، أود الاستفسار عن المنتجات المتوفرة في متجر ${store.name}`;
  const waContactLink = `https://wa.me/${normalizedNumber.replace('+', '')}?text=${encodeURIComponent(welcomeMessage)}`;

  // Deterministic avatar fallback background
  let hash = 0;
  for (let i = 0; i < store.name.length; i++) {
    hash = store.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const fallbackBg = `hsl(${h}, 60%, 40%)`;
  const firstLetter = store.name.trim().charAt(0).toUpperCase();

  return (
    <div className="empty-store-page">
      <div className="empty-store-card">
        {/* Brand Logo / Identity */}
        <div className="empty-store-brand">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="empty-store-logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              className="empty-store-logo-fallback"
              style={{ backgroundColor: fallbackBg }}
            >
              {firstLetter}
            </div>
          )}
          <h1 className="empty-store-name">{store.name}</h1>
          {store.location && (
            <span className="empty-store-location">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                style={{ width: '16px', height: '16px' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              {store.location}
            </span>
          )}
        </div>

        {/* Dynamic Fallback Notice */}
        <div className="empty-store-notice">
          <div className="notice-pulse-dot" />
          <h2 className="notice-title">{STOREFRONT_STRINGS.emptyStore}</h2>
          <p className="notice-description">
            المنتجات قيد التحديث والصيانة حالياً. يمكنك التواصل معنا مباشرة عبر وسائل الاتصال المتاحة بالأسفل لمعرفة أحدث المنتجات المتوفرة.
          </p>
        </div>

        {/* Merchant Social/Contact Actions */}
        <div className="empty-store-actions">
          <a
            href={waContactLink}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn whatsapp-direct"
          >
            تواصل معنا عبر الواتساب
          </a>

          {(store.facebook_url || store.instagram_url || store.tiktok_url) && (
            <div className="empty-store-socials">
              <span className="socials-label">أو تابعنا على شبكات التواصل:</span>
              <div className="socials-row">
                {store.facebook_url && (
                  <a
                    href={store.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn facebook"
                    aria-label="فيسبوك"
                  >
                    FB
                  </a>
                )}
                {store.instagram_url && (
                  <a
                    href={store.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn instagram"
                    aria-label="إنستغرام"
                  >
                    IG
                  </a>
                )}
                {store.tiktok_url && (
                  <a
                    href={store.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn tiktok"
                    aria-label="تيك توك"
                  >
                    TT
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
