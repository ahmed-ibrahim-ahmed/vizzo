/**
 * @vizzo/dashboard — Dashboard Layout Shell
 * Mobile-first layout wrapping all authenticated routes.
 * Top bar + content area + bottom navigation.
 */

import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { DASHBOARD_STRINGS } from '@vizzo/shared';
import type { Store } from '@vizzo/shared';
import { useStore } from './AuthGate';
import BottomNav from './BottomNav';
import '../styles/layout.css';

export default function DashboardLayout() {
  const { store } = useStore();

  const storeName = store?.name ?? 'متجر';
  const isPro = store?.is_pro ?? false;

  return (
    <div className="dashboard-layout">
      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <header className="dashboard-topbar" role="banner">
        <div className="topbar-right">
          <span className="topbar-store-name">{storeName}</span>
        </div>
        <div className="topbar-left">
          <span className={`topbar-badge ${isPro ? 'badge-pro' : 'badge-free'}`}>
            {isPro ? DASHBOARD_STRINGS.proBadge : DASHBOARD_STRINGS.freeBadge}
          </span>
          {!isPro && (
            <Link to="/settings/billing" className="topbar-upgrade-link">
              {DASHBOARD_STRINGS.upgradeCta}
            </Link>
          )}
        </div>
      </header>

      {/* ─── Content Area (scrolls independently) ────────────── */}
      <main className="dashboard-content">
        <Outlet />
      </main>

      {/* ─── Bottom Navigation ───────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
