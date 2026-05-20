/**
 * @vizzo/landing — Pricing Block (P1-06)
 * Section id="pricing" for Header scroll targeting.
 * Two tier cards (Free, Pro) + tripartite subscription matrix.
 * Annual plan gets gold border + badge.
 * Payment notice: manual bank transfer via تطبيق بنكك. No Stripe/PayPal.
 */

import { useEffect, useRef } from 'react';
import {
  LANDING_STRINGS,
  PRICING,
  FREE_TIER_PRODUCT_LIMIT,
  FREE_TIER_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
} from '@vizzo/shared/constants';

const STRINGS = LANDING_STRINGS;

function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pricing__tier--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const tiers = container.querySelectorAll('.pricing__tier');
    tiers.forEach((tier) => observer.observe(tier));

    const matrix = container.querySelector('.pricing__matrix');
    if (matrix) {
      const matrixObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pricing__matrix--visible');
            matrixObserver.unobserve(entry.target);
          }
        },
        { threshold: 0.15 }
      );
      matrixObserver.observe(matrix);
    }

    const payment = container.querySelector('.pricing__payment');
    if (payment) {
      const payObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pricing__payment--visible');
            payObserver.unobserve(entry.target);
          }
        },
        { threshold: 0.15 }
      );
      payObserver.observe(payment);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="pricing" id="pricing">
      <div className="pricing__container" ref={containerRef}>
        <div className="pricing__tiers">
          {/* Free Tier Card */}
          <div className="pricing__tier pricing__tier--free">
            <h3 className="pricing__tier-title">{STRINGS.freeTierTitle}</h3>
            <ul className="pricing__tier-list">
              <li className="pricing__tier-item">حتى {FREE_TIER_PRODUCT_LIMIT} منتج</li>
              <li className="pricing__tier-item">{FREE_TIER_IMAGE_LIMIT} صور لكل منتج</li>
              <li className="pricing__tier-item">شعار Vizzotrade إلزامي</li>
              <li className="pricing__tier-item">استقبال الطلبات عبر الواتساب</li>
              <li className="pricing__tier-item">محرك تخفيضات ذكي</li>
            </ul>
          </div>

          {/* Pro Tier Card */}
          <div className="pricing__tier pricing__tier--pro">
            <h3 className="pricing__tier-title">{STRINGS.proTierTitle}</h3>
            <ul className="pricing__tier-list">
              <li className="pricing__tier-item">منتجات غير محدودة</li>
              <li className="pricing__tier-item">{PRO_IMAGE_LIMIT} صور لكل منتج</li>
              <li className="pricing__tier-item">بدون شعار Vizzotrade</li>
              <li className="pricing__tier-item">استقبال الطلبات عبر الواتساب</li>
              <li className="pricing__tier-item">محرك تخفيضات ذكي</li>
            </ul>
          </div>
        </div>

        {/* Tripartite Subscription Matrix */}
        <div className="pricing__matrix">
          <div className="pricing__plan">
            <div className="pricing__plan-label">{PRICING.monthly.label}</div>
            <div className="pricing__plan-price">
              {PRICING.monthly.usd} <span>USD/شهر</span>
            </div>
          </div>

          <div className="pricing__plan">
            <div className="pricing__plan-label">{PRICING.quarterly.label}</div>
            <div className="pricing__plan-price">
              {PRICING.quarterly.usd} <span>USD/ربع</span>
            </div>
          </div>

          <div className="pricing__plan pricing__plan--annual">
            <div className="pricing__plan-badge">{STRINGS.annualBadge}</div>
            <div className="pricing__plan-label">{PRICING.annual.label}</div>
            <div className="pricing__plan-price">
              {PRICING.annual.usd} <span>USD/سنة</span>
            </div>
          </div>
        </div>

        {/* Payment Notice */}
        <div className="pricing__payment">
          <p className="pricing__payment-text">
            جميع المدفوعات تتم عبر تحويل بنكي يدوي باستخدام
            <strong> ({STRINGS.paymentNotice}) </strong>
            — لا حاجة لبطاقة ائتمان.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
