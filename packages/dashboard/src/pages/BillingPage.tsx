/**
 * @vizzo/dashboard — Billing Page
 * P2-15: Subscription & Billing page at /settings/billing.
 * Shows PlanDashboard and UpgradeFlow components.
 * If store is already pro, shows current plan details instead.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_STRINGS } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';
import { PlanDashboard } from '../components/PlanDashboard';
import { UpgradeFlow } from '../components/UpgradeFlow';
import '../styles/billing.css';

const DS = DASHBOARD_STRINGS;

export default function BillingPage() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!store) return null;

  const isPro = store.is_pro && store.subscription_status === 'active';
  const isPending = store.subscription_status === 'pending';

  return (
    <div className="billing-page">
      {/* Back button to settings */}
      <button
        className="billing-back-btn"
        onClick={() => navigate('/settings')}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        العودة للإعدادات
      </button>

      {/* Plan Dashboard — shows resource bars for free, plan details for pro */}
      <PlanDashboard
        onUpgradeClick={() => setShowUpgrade(true)}
      />

      {/* Upgrade Flow — only shown for free stores when CTA is clicked, or for pending stores */}
      {((!isPro && showUpgrade) || isPending) && <UpgradeFlow />}

      {/* For free stores that haven't clicked upgrade yet, show a prompt */}
      {!isPro && !isPending && !showUpgrade && (
        <div className="upgrade-section" style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-5)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            قم بالترقية للباقة الاحترافية للحصول على منتجات غير محدودة وصور أكثر لكل منتج.
          </p>
          <button className="upgrade-cta" onClick={() => setShowUpgrade(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            {DS.upgradeCta}
          </button>
        </div>
      )}
    </div>
  );
}
