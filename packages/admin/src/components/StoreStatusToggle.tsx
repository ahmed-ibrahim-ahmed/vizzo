/**
 * @vizzo/admin — StoreStatusToggle Component
 * Allows administrative personnel to suspend or restore storefront rendering.
 * Updates 'stores.subscription_status' securely.
 */

import { useState } from 'react';
import { useAdmin } from './AdminGate';

interface StoreStatusToggleProps {
  storeId: string;
  currentStatus: 'free' | 'pending' | 'active' | 'expired';
  isPro: boolean;
  onUpdate: () => void;
}

export function StoreStatusToggle({ storeId, currentStatus, isPro, onUpdate }: StoreStatusToggleProps) {
  const { supabase } = useAdmin();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      // Determine new status:
      // If currently suspended (expired), restore to 'active' if previously pro, otherwise 'free'
      // If currently active/free/pending, suspend by setting to 'expired'
      const isSuspended = currentStatus === 'expired';
      const newStatus = isSuspended 
        ? (isPro ? 'active' : 'free') 
        : 'expired';

      const { error } = await supabase
        .from('stores')
        .update({ 
          subscription_status: newStatus,
          // If suspending, we can optionally toggle is_pro to false, but let's keep isPro flag intact
          // so we know they were pro once restored.
        })
        .eq('id', storeId);

      if (error) {
        throw error;
      }

      onUpdate();
    } catch (err: any) {
      console.error('[StoreStatusToggle] Error toggling store status:', err.message);
      alert(`حدث خطأ أثناء تعديل حالة المتجر: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isSuspended = currentStatus === 'expired';

  return (
    <div className="status-toggle-container">
      {isSuspended ? (
        <button
          className="toggle-action-btn restore-btn"
          onClick={handleToggle}
          disabled={loading}
          type="button"
        >
          {loading ? <span className="btn-spinner"></span> : 'إلغاء الإيقاف'}
        </button>
      ) : (
        <button
          className="toggle-action-btn suspend-btn"
          onClick={handleToggle}
          disabled={loading}
          type="button"
        >
          {loading ? <span className="btn-spinner"></span> : 'إيقاف مؤقت'}
        </button>
      )}
    </div>
  );
}
