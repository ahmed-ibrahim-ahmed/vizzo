import { useMemo } from 'react';
import type { Store } from '@vizzo/shared';
import '../styles/header.css';

interface StickyHeaderProps {
  store: Store;
  cartCount: number;
  onCartClick: () => void;
}

export function StickyHeader({ store, cartCount, onCartClick }: StickyHeaderProps) {
  // Deterministic background color from store name hash
  const fallbackBgColor = useMemo(() => {
    let hash = 0;
    const name = store.name || 'V';
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 60%, 40%)`;
  }, [store.name]);

  const firstLetter = useMemo(() => {
    return (store.name || 'V').trim().charAt(0).toUpperCase();
  }, [store.name]);

  return (
    <header className="sticky-header">
      {/* Right — Identity Node */}
      <div className="header-identity">
        {store.logo_url ? (
          <img
            src={store.logo_url}
            alt={store.name}
            className="store-logo"
            onError={(e) => {
              // Hide broken image and fallback
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="store-logo-fallback"
            style={{ backgroundColor: fallbackBgColor }}
          >
            {firstLetter}
          </div>
        )}
      </div>

      {/* Center — Info Node */}
      <div className="header-info">
        <h1 className="store-name">{store.name}</h1>
        {store.location && (
          <span className="store-location">{store.location}</span>
        )}
      </div>

      {/* Left — Cart Action Node */}
      <button
        className="header-cart-action"
        onClick={onCartClick}
        aria-label="سلة التسوق"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="cart-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
        {cartCount > 0 && (
          <span className="cart-badge">{cartCount}</span>
        )}
      </button>
    </header>
  );
}
