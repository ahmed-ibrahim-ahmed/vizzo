/**
 * @vizzo/dashboard — FloatingAddButton Component
 * Fixed FAB (+ button) that navigates to /products/new.
 * Positioned bottom-left (RTL) above bottom nav.
 */

import { useNavigate } from 'react-router-dom';
import '../styles/productform.css';

export default function FloatingAddButton() {
  const navigate = useNavigate();

  return (
    <button
      className="fab"
      onClick={() => navigate('/products/new')}
      aria-label="إضافة منتج جديد"
      type="button"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
