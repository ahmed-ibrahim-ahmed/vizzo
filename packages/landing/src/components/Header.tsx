/**
 * @vizzo/landing — Header Component (P1-01)
 * Fixed-position glassmorphism header with RTL layout.
 * Exactly 3 navigation items: المميزات → #features, الأسعار → #pricing, تسجيل الدخول → Google OAuth.
 * No hamburger menu on mobile — SRS prohibits navigation leakage.
 * No external URLs permitted.
 */

import { LANDING_STRINGS } from '@vizzo/shared/constants';

const STRINGS = LANDING_STRINGS;

interface HeaderProps {
  onLogin: () => void;
}

function Header({ onLogin }: HeaderProps) {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="landing-header">
      <span className="landing-header__logo">Vizzo</span>
      <nav className="landing-header__nav">
        <a
          className="landing-header__nav-link"
          href="#features"
          onClick={scrollTo('features')}
        >
          {STRINGS.navFeatures}
        </a>
        <a
          className="landing-header__nav-link"
          href="#pricing"
          onClick={scrollTo('pricing')}
        >
          {STRINGS.navPricing}
        </a>
        <a
          className="landing-header__nav-link landing-header__nav-link--login"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onLogin();
          }}
        >
          {STRINGS.navLogin}
        </a>
      </nav>
    </header>
  );
}

export default Header;
