/**
 * @vizzo/admin — MerchantDirectory Page
 * Renders lists of platform merchants and their active storefronts.
 * Includes advanced filters, search bars, status badges, and store suspension controls.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../components/AdminGate';
import { StoreStatusToggle } from '../components/StoreStatusToggle';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  is_pro: boolean;
  subscription_status: 'free' | 'pending' | 'active' | 'expired';
}

interface MerchantData {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
  stores: StoreData[];
}

export function MerchantDirectory() {
  const { supabase } = useAdmin();
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select(`
          id,
          display_name,
          email,
          avatar_url,
          created_at,
          stores (
            id,
            name,
            slug,
            whatsapp_number,
            is_pro,
            subscription_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMerchants((data as any) || []);
    } catch (err: any) {
      console.error('[MerchantDirectory] Error loading merchants:', err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // Search Filter
  const filteredMerchants = merchants.filter((merchant) => {
    const query = searchQuery.toLowerCase();
    const matchesMerchant = 
      merchant.display_name?.toLowerCase().includes(query) ||
      merchant.email?.toLowerCase().includes(query);
    
    const matchesStore = merchant.stores?.some(
      (store) => 
        store.name?.toLowerCase().includes(query) || 
        store.slug?.toLowerCase().includes(query)
    );

    return matchesMerchant || matchesStore;
  });

  const getStatusChip = (status: 'free' | 'pending' | 'active' | 'expired', isPro: boolean) => {
    switch (status) {
      case 'active':
        return <span className="status-chip chip-active">نشط {isPro && '★ Pro'}</span>;
      case 'pending':
        return <span className="status-chip chip-pending">قيد الانتظار</span>;
      case 'expired':
        return <span className="status-chip chip-expired">موقوف مؤقتاً</span>;
      default:
        return <span className="status-chip chip-free">مجاني</span>;
    }
  };

  return (
    <div className="directory-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">دليل التجار والمتاجر</h1>
          <p className="page-description">مراقبة الحسابات النشطة، إدارة التراخيص والاشتراكات، والتعليق الفوري للمتاجر المخالفة.</p>
        </div>
        <button className="refresh-btn" onClick={fetchMerchants} disabled={loading} type="button">
          🔄 تحديث البيانات
        </button>
      </div>

      {/* Search Input */}
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="ابحث باسم التاجر، البريد الإلكتروني، اسم المتجر أو الرابط..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')} type="button">
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="directory-skeleton">
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
        </div>
      ) : filteredMerchants.length === 0 ? (
        <div className="empty-directory">
          <div className="empty-icon">🔍</div>
          <h3>لم يتم العثور على نتائج</h3>
          <p>لا يوجد تجار يطابقون استعلام البحث الحالي.</p>
        </div>
      ) : (
        <div className="merchant-grid">
          {filteredMerchants.map((merchant) => (
            <div key={merchant.id} className="merchant-card">
              <div className="merchant-info">
                <img 
                  src={merchant.avatar_url || 'https://via.placeholder.com/40'} 
                  alt={merchant.display_name} 
                  className="merchant-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                  }}
                />
                <div>
                  <h3 className="merchant-name">{merchant.display_name || 'تاجر بدون اسم'}</h3>
                  <p className="merchant-email">{merchant.email}</p>
                </div>
              </div>

              <div className="store-section">
                {merchant.stores && merchant.stores.length > 0 ? (
                  merchant.stores.map((store) => (
                    <div key={store.id} className="store-row">
                      <div className="store-details">
                        <div className="store-name-link">
                          <span className="store-name">{store.name}</span>
                          <a 
                            href={`https://${store.slug}.vizzotrade.com`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="store-slug"
                          >
                            {store.slug}.vizzotrade.com ↗
                          </a>
                        </div>
                        <div className="store-meta">
                          <span className="store-whatsapp">🟢 {store.whatsapp_number}</span>
                        </div>
                      </div>

                      <div className="store-actions">
                        {getStatusChip(store.subscription_status, store.is_pro)}
                        <StoreStatusToggle
                          storeId={store.id}
                          currentStatus={store.subscription_status}
                          isPro={store.is_pro}
                          onUpdate={fetchMerchants}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-store-warning">⚠️ التاجر لم يقم بإنشاء متجر بعد.</div>
                )}
              </div>

              <div className="card-footer">
                <span className="joined-date">تاريخ الانضمام: {new Date(merchant.created_at).toLocaleDateString('ar-SD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
