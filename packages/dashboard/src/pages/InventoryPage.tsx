/**
 * @vizzo/dashboard — Inventory Page
 * Main products page: Analytics cards + product list with filters.
 * Rendered inside DashboardLayout as the index route.
 */

import AnalyticsCards from '../components/AnalyticsCards';
import ProductList from '../components/ProductList';
import FloatingAddButton from '../components/FloatingAddButton';

export default function InventoryPage() {
  return (
    <>
      <AnalyticsCards />
      <ProductList />
      <FloatingAddButton />
    </>
  );
}
