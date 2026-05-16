/**
 * @vizzo/dashboard — Product Actions Dropdown
 * Dropdown menu with edit, discount, clone, and soft-delete actions.
 * Click-outside-to-close pattern. Confirmation dialog for delete.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupabaseClient, DASHBOARD_STRINGS } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';
import '../styles/productactions.css';

interface ProductActionsProps {
  product: Product;
  onClose: () => void;
  onRefetch: () => void;
  onOpenDiscount: () => void;
  onClone: () => void;
}

export default function ProductActions({
  product,
  onClose,
  onRefetch,
  onOpenDiscount,
  onClone,
}: ProductActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Click-outside-to-close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, [onClose]);

  // Escape key to close
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleEdit = useCallback(() => {
    navigate(`/products/${product.id}/edit`);
    onClose();
  }, [navigate, product.id, onClose]);

  const handleDiscount = useCallback(() => {
    onOpenDiscount();
    onClose();
  }, [onOpenDiscount, onClose]);

  const handleClone = useCallback(() => {
    onClone();
    onClose();
  }, [onClone, onClose]);

  const handleDeleteClick = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setDeleting(true);
    const supabase = createSupabaseClient();

    if (!supabase) {
      setDeleting(false);
      onClose();
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('id', product.id);

      if (error) {
        console.error('[ProductActions] Soft-delete error:', error.message);
        setDeleting(false);
        return;
      }

      onRefetch();
      onClose();
    } catch (err) {
      console.error('[ProductActions] Unexpected delete error:', err);
      setDeleting(false);
    }
  }, [product.id, onRefetch, onClose]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return (
    <>
      {/* Invisible backdrop to catch clicks outside */}
      <div className="product-actions-backdrop" />

      <div className="product-actions-dropdown" ref={dropdownRef} role="menu">
        {!showConfirm ? (
          <>
            {/* Edit */}
            <button
              className="product-actions-item action-edit"
              onClick={handleEdit}
              role="menuitem"
              type="button"
            >
              <span className="product-actions-item-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </span>
              <span className="product-actions-item-text">
                {DASHBOARD_STRINGS.actionEdit}
              </span>
            </button>

            {/* Discount */}
            <button
              className="product-actions-item action-discount"
              onClick={handleDiscount}
              role="menuitem"
              type="button"
            >
              <span className="product-actions-item-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <span className="product-actions-item-text">
                {DASHBOARD_STRINGS.actionDiscount}
              </span>
            </button>

            {/* Clone */}
            <button
              className="product-actions-item action-clone"
              onClick={handleClone}
              role="menuitem"
              type="button"
            >
              <span className="product-actions-item-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </span>
              <span className="product-actions-item-text">
                {DASHBOARD_STRINGS.cloneLabel}
              </span>
            </button>

            {/* Delete (soft) */}
            <button
              className="product-actions-item action-delete"
              onClick={handleDeleteClick}
              role="menuitem"
              type="button"
            >
              <span className="product-actions-item-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </span>
              <span className="product-actions-item-text">
                {DASHBOARD_STRINGS.actionDelete}
              </span>
            </button>
          </>
        ) : (
          /* Confirmation Dialog */
          <div className="product-actions-confirm">
            <p className="product-actions-confirm-text">
              {DASHBOARD_STRINGS.deleteConfirm}
            </p>
            <div className="product-actions-confirm-actions">
              <button
                className="confirm-btn confirm-btn-cancel"
                onClick={handleCancelDelete}
                disabled={deleting}
                type="button"
              >
                إلغاء
              </button>
              <button
                className="confirm-btn confirm-btn-delete"
                onClick={handleConfirmDelete}
                disabled={deleting}
                type="button"
              >
                {deleting ? 'جارٍ الحذف...' : DASHBOARD_STRINGS.actionDelete}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
