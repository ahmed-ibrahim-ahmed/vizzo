/**
 * @vizzo/admin — SubscriptionLedger Page
 * Manages manual Bankak transfers, parses receipt image attachments, and coordinates tier activations.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../components/AdminGate';
import { ReceiptViewer } from '../components/ReceiptViewer';

interface StoreData {
  name: string;
  slug: string;
  is_pro: boolean;
}

interface SubscriptionData {
  id: string;
  store_id: string;
  tier: 'monthly' | 'quarterly' | 'annual';
  amount_usd: number;
  receipt_image_url: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  created_at: string;
  approved_at: string | null;
  expires_at: string | null;
  stores: StoreData | null;
}

type TabType = 'pending' | 'history';

export function SubscriptionLedger() {
  const { supabase } = useAdmin();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedSub, setSelectedSub] = useState<SubscriptionData | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          store_id,
          tier,
          amount_usd,
          receipt_image_url,
          status,
          created_at,
          approved_at,
          expires_at,
          stores (
            name,
            slug,
            is_pro
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data as any) || []);
    } catch (err: any) {
      console.error('[SubscriptionLedger] Error loading subscriptions:', err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Filters
  const pendingSubs = subscriptions.filter(s => s.status === 'pending');
  const historySubs = subscriptions.filter(s => s.status !== 'pending');

  const activeList = activeTab === 'pending' ? pendingSubs : historySubs;

  const handleApprove = async (sub: SubscriptionData) => {
    const confirmApprove = window.confirm(`هل أنت متأكد من تفعيل الباقة ${getTierText(sub.tier)} لمتجر "${sub.stores?.name}"؟`);
    if (!confirmApprove) return;

    try {
      // Expiration Calculation
      const expiresAt = new Date();
      if (sub.tier === 'monthly') {
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else if (sub.tier === 'quarterly') {
        expiresAt.setDate(expiresAt.getDate() + 90);
      } else if (sub.tier === 'annual') {
        expiresAt.setDate(expiresAt.getDate() + 365);
      }

      // Step 1: Update Subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', sub.id);

      if (subError) throw subError;

      // Step 2: Update Store
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          is_pro: true,
          subscription_status: 'active',
        })
        .eq('id', sub.store_id);

      if (storeError) throw storeError;

      alert('تم تفعيل اشتراك المتجر بنجاح وترقية الباقة إلى Pro.');
      setSelectedSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      console.error('[SubscriptionLedger] Approval failed:', err.message);
      alert(`فشل التفعيل: ${err.message}`);
    }
  };

  const handleReject = async (sub: SubscriptionData) => {
    const confirmReject = window.confirm(`هل أنت متأكد من رفض إيصال متجر "${sub.stores?.name}"؟ سيتم إلغاء التفعيل وإعادته للباقة المجانية.`);
    if (!confirmReject) return;

    try {
      // Step 1: Update Subscription status to rejected
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'rejected',
          approved_at: null,
          expires_at: null,
        })
        .eq('id', sub.id);

      if (subError) throw subError;

      // Step 2: Roll store status back to free
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          is_pro: false,
          subscription_status: 'free',
        })
        .eq('id', sub.store_id);

      if (storeError) throw storeError;

      alert('تم رفض إيصال التحويل وإعادة حساب المتجر للباقة العادية.');
      setSelectedSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      console.error('[SubscriptionLedger] Rejection failed:', err.message);
      alert(`فشل الرفض: ${err.message}`);
    }
  };

  const getTierText = (t: string) => {
    switch (t) {
      case 'annual': return 'سنوي';
      case 'quarterly': return 'ربع سنوي';
      default: return 'شهري';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'rejected': return 'مرفوض';
      case 'expired': return 'منتهي';
      default: return 'قيد الانتظار';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'badge-active';
      case 'rejected': return 'badge-rejected';
      case 'expired': return 'badge-expired';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="ledger-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">دفتر الحسابات والاشتراكات</h1>
          <p className="page-description">مراجعة وتحليل المعاملات المالية المرفوعة يدوياً للاشتراك في خدمات الباقة المميزة.</p>
        </div>
        <button className="refresh-btn" onClick={fetchSubscriptions} disabled={loading} type="button">
          🔄 تحديث البيانات
        </button>
      </div>

      {/* Tabs */}
      <div className="ledger-tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
          type="button"
        >
          قيد المراجعة ({pendingSubs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          أرشيف التحويلات ({historySubs.length})
        </button>
      </div>

      {loading ? (
        <div className="directory-skeleton">
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
        </div>
      ) : activeList.length === 0 ? (
        <div className="empty-ledger">
          <div className="empty-icon">📂</div>
          <h3>السجل فارغ</h3>
          <p>{activeTab === 'pending' ? 'لا يوجد طلبات ترقية قيد الانتظار حالياً.' : 'لا يوجد سجل معاملات سابقة في هذا التصنيف.'}</p>
        </div>
      ) : (
        <div className="ledger-table-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>اسم المتجر</th>
                <th>الباقة المطلوبة</th>
                <th>المبلغ المحسوب</th>
                <th>تاريخ الطلب</th>
                <th>الحالة</th>
                <th>تاريخ انتهاء الصلاحية</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {activeList.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="ledger-store-name">{sub.stores?.name || 'متجر غير معروف'}</div>
                    <div className="ledger-store-slug">{sub.stores?.slug}.vizzotrade.com</div>
                  </td>
                  <td><span className="tier-badge">{getTierText(sub.tier)}</span></td>
                  <td><strong className="amount-usd">${sub.amount_usd}</strong></td>
                  <td>{new Date(sub.created_at).toLocaleString('ar-SD')}</td>
                  <td><span className={`status-badge ${getStatusClass(sub.status)}`}>{getStatusText(sub.status)}</span></td>
                  <td>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('ar-SD') : '—'}</td>
                  <td>
                    {sub.status === 'pending' ? (
                      <button 
                        className="review-receipt-btn"
                        onClick={() => setSelectedSub(sub)}
                        type="button"
                      >
                        👁️ فحص الإيصال
                      </button>
                    ) : (
                      <button 
                        className="review-receipt-btn history-view-btn"
                        onClick={() => setSelectedSub(sub)}
                        type="button"
                      >
                        🔍 عرض الإيصال
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Canvas Modal */}
      {selectedSub && (
        <ReceiptViewer
          imageUrl={selectedSub.receipt_image_url}
          storeName={selectedSub.stores?.name || 'متجر'}
          tier={selectedSub.tier}
          amountUsd={selectedSub.amount_usd}
          onApprove={() => handleApprove(selectedSub)}
          onReject={() => handleReject(selectedSub)}
          onClose={() => setSelectedSub(null)}
        />
      )}
    </div>
  );
}
