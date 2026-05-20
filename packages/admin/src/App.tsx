/**
 * @vizzo/admin — App Root Routing Component
 * Assembles all protected administrative layouts and public verification routes.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminGate } from './components/AdminGate';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { MerchantDirectory } from './pages/MerchantDirectory';
import { SubscriptionLedger } from './pages/SubscriptionLedger';

import './styles/tokens.css';
import './styles/reset.css';
import './styles/admin.css';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Locked screen */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Administration Routes */}
        <Route
          path="/"
          element={
            <AdminGate>
              <AdminLayout />
            </AdminGate>
          }
        >
          <Route index element={<OperationsDashboard />} />
          <Route path="merchants" element={<MerchantDirectory />} />
          <Route path="subscriptions" element={<SubscriptionLedger />} />
        </Route>

        {/* Catch-all Fallback Redirect */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
