/**
 * @vizzo/dashboard — Account Actions Component
 * P2-16: Logout and Delete Account with double-confirmation flow.
 * Rendered at the bottom of SettingsPage.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createSupabaseClient,
  DASHBOARD_STRINGS,
} from '@vizzo/shared';
import { useStore } from '../components/AuthGate';

const DS = DASHBOARD_STRINGS;

type DeleteStep = 'idle' | 'confirm1' | 'confirm2' | 'deleting';

export function AccountActions() {
  const { store } = useStore();
  const supabase = createSupabaseClient();
  const navigate = useNavigate();

  const [deleteStep, setDeleteStep] = useState<DeleteStep>('idle');
  const [storeNameInput, setStoreNameInput] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!supabase) {
      navigate('/login');
      return;
    }

    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('[AccountActions] Logout failed:', err);
      navigate('/login');
    }
  };

  // ─── Delete Account Flow ───────────────────────────────────────
  const handleDeleteClick = () => {
    setDeleteStep('confirm1');
  };

  const handleDeleteCancel = () => {
    setDeleteStep('idle');
    setStoreNameInput('');
  };

  const handleDeleteProceed = () => {
    setDeleteStep('confirm2');
  };

  const handleDeleteFinal = async () => {
    if (!supabase || !store) return;
    if (storeNameInput !== store.name) return;

    setDeleteStep('deleting');

    try {
      // Soft-archive all products (set is_archived = true)
      const { error: archiveError } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('store_id', store.id);

      if (archiveError) {
        console.error('[AccountActions] Failed to archive products:', archiveError);
      }

      // Mark store with deletion indicator (soft-delete approach)
      // We use a special naming convention to mark the store as deleted
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          name: `[deleted] ${store.name}`,
          slug: `deleted-${store.id.slice(0, 8)}-${Date.now()}`,
          subscription_status: 'expired',
        })
        .eq('id', store.id);

      if (storeError) {
        console.error('[AccountActions] Failed to mark store as deleted:', storeError);
      }

      // Sign out
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('[AccountActions] Delete account failed:', err);
      setDeleteStep('idle');
      setStoreNameInput('');
    }
  };

  const isStoreNameMatch = storeNameInput === store?.name;

  return (
    <div className="account-actions">
      {/* ─── Logout Button ──────────────────────────────────────── */}
      <button
        className="account-action-btn logout"
        onClick={handleLogout}
        disabled={loggingOut}
        type="button"
      >
        {loggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
      </button>

      {/* ─── Delete Account Button ──────────────────────────────── */}
      <button
        className="account-action-btn delete"
        onClick={handleDeleteClick}
        disabled={deleteStep !== 'idle'}
        type="button"
      >
        حذف الحساب
      </button>

      {/* ─── First Confirmation Dialog ──────────────────────────── */}
      {deleteStep === 'confirm1' && (
        <div className="delete-dialog-overlay" onClick={handleDeleteCancel}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-title">حذف الحساب</div>
            <div className="delete-dialog-message">
              {DS.deleteAccountConfirm1}
            </div>
            <div className="delete-dialog-actions">
              <button
                className="delete-dialog-cancel"
                onClick={handleDeleteCancel}
                type="button"
              >
                إلغاء
              </button>
              <button
                className="delete-dialog-confirm"
                onClick={handleDeleteProceed}
                type="button"
              >
                متابعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Second Confirmation (Type store name) ──────────────── */}
      {deleteStep === 'confirm2' && (
        <div className="delete-dialog-overlay" onClick={handleDeleteCancel}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-title">تأكيد نهائي</div>
            <div className="delete-dialog-message">
              لإتمام حذف حسابك، اكتب اسم متجرك بالضبط كما يلي: <strong>{store?.name}</strong>
            </div>
            <input
              className="delete-dialog-input"
              type="text"
              value={storeNameInput}
              onChange={(e) => setStoreNameInput(e.target.value)}
              placeholder={store?.name}
              autoFocus
              dir="rtl"
            />
            <div className="delete-dialog-hint">
              يجب أن يتطابق الاسم تماماً مع اسم المتجر لتأكيد الحذف
            </div>
            <div className="delete-dialog-actions">
              <button
                className="delete-dialog-cancel"
                onClick={handleDeleteCancel}
                type="button"
              >
                إلغاء
              </button>
              <button
                className="delete-dialog-confirm"
                onClick={handleDeleteFinal}
                disabled={!isStoreNameMatch}
                type="button"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deleting state ─────────────────────────────────────── */}
      {deleteStep === 'deleting' && (
        <div className="delete-dialog-overlay">
          <div className="delete-dialog" style={{ textAlign: 'center' }}>
            <div className="delete-dialog-title" style={{ color: 'var(--color-text-primary)' }}>
              جاري حذف الحساب...
            </div>
            <div className="delete-dialog-message">
              يرجى الانتظار بينما نقوم بحذف حسابك وجميع البيانات المرتبطة به.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
