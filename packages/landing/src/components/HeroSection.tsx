/**
 * @vizzo/landing — Hero Section Component (P1-02)
 * Full viewport height. RTL two-column grid.
 * Text column: h1 + h2 + Google OAuth CTA button.
 * Visual column: Split-screen mobile device mockups (dashboard + storefront).
 * fadeUp animations with staggered 0.2s delays.
 * No email input, no password field, no registration form (AP-02).
 */

import { LANDING_STRINGS } from '@vizzo/shared/constants';

const STRINGS = LANDING_STRINGS;

interface HeroSectionProps {
  onLogin: () => void;
}

function HeroSection({ onLogin }: HeroSectionProps) {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__text">
          <h1 className="hero__title">{STRINGS.heroTitle}</h1>
          <h2 className="hero__subtitle">{STRINGS.heroSubtitle}</h2>
          <button className="hero__cta" onClick={onLogin} type="button">
            <svg className="hero__cta-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {STRINGS.ctaGoogle}
          </button>
        </div>

        <div className="hero__visual">
          {/* Dashboard phone mockup */}
          <div className="hero__phone hero__phone--dashboard">
            <div className="hero__phone-content">
              <div className="hero__phone-header">لوحة التحكم</div>
              <div className="hero__phone-item">
                <div className="hero__phone-thumb" />
                <div className="hero__phone-info">
                  <div className="hero__phone-name">iPhone 15 Pro</div>
                  <div className="hero__phone-price">45,000 جنيه</div>
                </div>
                <div className="hero__phone-toggle hero__phone-toggle--on" />
              </div>
              <div className="hero__phone-item">
                <div className="hero__phone-thumb" style={{ background: '#3b82f6' }} />
                <div className="hero__phone-info">
                  <div className="hero__phone-name">Samsung Galaxy S24</div>
                  <div className="hero__phone-price">38,000 جنيه</div>
                </div>
                <div className="hero__phone-toggle hero__phone-toggle--on" />
              </div>
              <div className="hero__phone-item">
                <div className="hero__phone-thumb" style={{ background: '#f59e0b' }} />
                <div className="hero__phone-info">
                  <div className="hero__phone-name">AirPods Pro 2</div>
                  <div className="hero__phone-price">12,000 جنيه</div>
                </div>
                <div className="hero__phone-toggle hero__phone-toggle--off" />
              </div>
            </div>
          </div>

          {/* Storefront phone mockup */}
          <div className="hero__phone hero__phone--storefront">
            <div className="hero__phone-content">
              <div className="hero__phone-header" style={{ color: 'var(--color-success)' }}>المتجر</div>
              <div className="hero__phone-item">
                <div className="hero__phone-store-img" />
                <div className="hero__phone-store-name">iPhone 15 Pro</div>
                <div className="hero__phone-store-price">45,000 جنيه</div>
              </div>
              <div className="hero__phone-item">
                <div className="hero__phone-store-img" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.15))' }} />
                <div className="hero__phone-store-name">Samsung Galaxy S24</div>
                <div className="hero__phone-store-price">38,000 جنيه</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
