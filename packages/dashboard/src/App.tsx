/**
 * @vizzo/dashboard — App Entry (P2-17 Route Assembly)
 * Merchant Dashboard SPA for app.vizzotrade.com
 *
 * Route map per PROJECT_MAP.md:
 *   /                 → InventoryPage (AnalyticsCards + FilterBar + ProductList + FAB)
 *   /onboarding       → OnboardingPage (outside DashboardLayout)
 *   /products/new     → ProductFormPage (create mode)
 *   /products/:id/edit → ProductFormPage (edit mode)
 *   /editor           → StorefrontEditorPage
 *   /settings         → SettingsPage
 *   /settings/billing → BillingPage
 *
 * All routes except /login and /onboarding are wrapped in AuthGate + DashboardLayout.
 * Supabase client provided via AuthGate's StoreContext.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import DashboardLayout from './components/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import InventoryPage from './pages/InventoryPage';
import StorefrontEditorPage from './pages/StorefrontEditorPage';
import ProductFormPage from './pages/ProductFormPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public Routes (no layout shell) ──────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* ─── Protected Routes (AuthGate + DashboardLayout) ────── */}
        <Route
          element={
            <AuthGate>
              <DashboardLayout />
            </AuthGate>
          }
        >
          <Route path="/" element={<InventoryPage />} />
          <Route path="/products/new" element={<ProductFormPage />} />
          <Route path="/products/:id/edit" element={<ProductFormPage />} />
          <Route path="/editor" element={<StorefrontEditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
        </Route>

        {/* ─── Catch-all ────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
