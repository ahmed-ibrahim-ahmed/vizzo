/**
 * @vizzo/dashboard — Plan Dashboard Component
 * P2-15: Resource consumption dashboard for free-tier accounts.
 * Shows visual resource bars, current plan status, and upgrade CTA.
 * For pro stores, shows current plan details with expiration date.
 */

import { useState, useEffect } from 'react';
import {
  createSupabaseClient,
  DASHBOARD_STRINGS,
  FREE_TIER_PRODUCT_LIMIT,
  FREE_TIER_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
} from '@vizzo/shared';
import type { Store, Subscription } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';

const DS = DASHBOARD_STRINGS;

interface PlanDashboardProps {
  onUpgradeClick: () => void;
}

export function PlanDashboard({ onUpgradeClick }: PlanDashboardProps) {
  const { store } = useStore();
  const supabase = createSupabaseClient();

  const [productCount, setProductCount] = useState<number>(0);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !store) return;

    async function fetchPlanData() {
      try {
        // Fetch active (non-archived) product count
        const { count, error: countError } = await supabase!
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store!.id)
          .eq('is_archived', false);

        if (!countError && count !== null) {
          setProductCount(count);
        }

        // Fetch active subscription for pro stores
        if (store!.is_pro || store!.subscription_status === 'active') {
          const { data: subs, error: subError } = await supabase!
            .from('subscriptions')
            .select('*')
            .eq('store_id', store!.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!subError && subs && subs.length > 0) {
            setActiveSubscription(subs[0] as Subscription);
          }
        }

        // Check for pending subscription
        if (store!.subscription_status === 'pending') {
          const { data: pendingSubs, error: pendingError } = await supabase!
            .from('subscriptions')
            .select('*')
            .eq('store_id', store!.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!pendingError && pendingSubs && pendingSubs.length > 0) {
            setActiveSubscription(pendingSubs[0] as Subscription);
          }
        }
      } catch (err) {
        console.error('[PlanDashboard] Failed to fetch plan data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanData();
  }, [supabase, store]);

  if (!store) return null;

  const isPro = store.is_pro;
  const isPending = store.subscription_status === 'pending';
  const maxProducts = FREE_TIER_PRODUCT_LIMIT;
  const imageLimit = isPro ? PRO_IMAGE_LIMIT : FREE_TIER_IMAGE_LIMIT;
  const productPercent = Math.min((productCount / maxProducts) * 100, 100);
  const isProductCritical = productCount >= maxProducts;
  const isProductWarning = productPercent >= 80 && !isProductCritical;

  // Format expiration date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format tier name
  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'monthly':
        return 'الشهري';
      case 'quarterly':
        return 'الربع سنوي';
      case 'annual':
        return 'السنوي';
      default:
        return tier;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="plan-dashboard">
        <div className="plan-status-card">
          <div className="billing-skeleton" style={{ width: '80px' }} />
          <div className="billing-skeleton" style={{ width: '60px' }} />
        </div>
        <div className="plan-resources">
          <div className="billing-skeleton wide" />
          <div className="billing-skeleton wide" />
        </div>
      </div>
    );
  }

  // ─── Pro Store: Show current plan details ───────────────────────
  if (isPro && !isPending) {
    return (
      <div className="pro-plan-details">
        <div className="pro-plan-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-gold)">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          {DS.proBadge}
        </div>
        <div className="pro-plan-info">
          {activeSubscription ? (
            <>
              <p>
                <strong>الباقة:</strong> {getTierLabel(activeSubscription.tier)}
              </p>
              <p>
                <strong>المبلغ:</strong> {activeSubscription.amount_usd} دولار
              </p>
              <p>
                <strong>تاريخ الانتهاء:</strong> {formatDate(activeSubscription.expires_at)}
              </p>
            </>
          ) : (
            <p>متجرك مميز بالباقة الاحترافية. جميع الميزات متاحة لك.</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Pending: Show pending state ────────────────────────────────
  if (isPending) {
    return (
      <>
        <div className="pending-badge-container">
          <div className="pending-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {DS.billingPending}
          </div>
        </div>
        <p className="pending-badge-text">
          طلب الترقية قيد المراجعة. سيتم تفعيل الباقة الاحترافية بعد تأكيد الدفع.
        </p>
      </>
    );
  }

  // ─── Free Store: Show resource bars + upgrade CTA ───────────────
  return (
    <div className="plan-dashboard">
      <div className="plan-status-card">
        <span className="plan-status-label">الباقة الحالية</span>
        <span className="plan-status-badge free">{DS.freeBadge}</span>
      </div>

      <div className="plan-resources">
        {/* Product Count Bar */}
        <div className="resource-item">
          <div className="resource-label">
            <span>عدد المنتجات</span>
            <span className="resource-label-count">
              {productCount} / {maxProducts} منتج
            </span>
          </div>
          <div className="resource-bar-track">
            <div
              className={`resource-bar-fill${isProductCritical ? ' critical' : isProductWarning ? ' warning' : ''}`}
              style={{ width: `${productPercent}%` }}
            />
          </div>
        </div>

        {/* Image Limit Info */}
        <div className="resource-item">
          <div className="resource-label">
            <span>صور لكل منتج</span>
            <span className="resource-label-count">
              {imageLimit} صورة
            </span>
          </div>
          <div className="resource-bar-track">
            <div
              className="resource-bar-fill"
              style={{ width: `${(imageLimit / PRO_IMAGE_LIMIT) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <button className="upgrade-cta" onClick={onUpgradeClick}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        {DS.upgradeCta}
      </button>
    </div>
  );
}
