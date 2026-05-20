import type { Store } from '@vizzo/shared';
import '../styles/watermark.css';

interface WatermarkBannerProps {
  store: Store;
}

export function WatermarkBanner({ store }: WatermarkBannerProps) {
  if (store.is_pro) {
    return null;
  }

  return (
    <div className="watermark-banner" role="complementary" aria-label="شعار Vizzotrade">
      <a
        href="https://vizzotrade.com"
        target="_blank"
        rel="noopener noreferrer"
        className="watermark-link"
      >
        <span className="watermark-text">تم إنشاء هذا المتجر مجاناً عبر</span>
        <span className="watermark-brand">Vizzotrade</span>
        <svg
          className="watermark-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
