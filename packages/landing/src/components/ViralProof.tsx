/**
 * @vizzo/landing — Viral Proof Block (P1-05)
 * Showcases organic growth engine — every free store becomes a marketing channel.
 * Simulated storefront mockup with watermark banner visible.
 */

import { useEffect, useRef } from 'react';
import { WATERMARK_TEXT, LANDING_STRINGS } from '@vizzo/shared/constants';

const STRINGS = LANDING_STRINGS;

function ViralProof() {
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockup = mockupRef.current;
    if (!mockup) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('viralproof__mockup--visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(mockup);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="viralproof">
      <div className="viralproof__container">
        <h3 className="viralproof__title">كل متجر مجاني هو قناة تسويق</h3>
        <p className="viralproof__subtitle">
          كل متجر يُنشأ مجاناً يحمل شعار Vizzotrade — مما يعني أن كل زائر لمتجرك
          قد يصبح تاجراً جديداً عبر رابط واحد فقط.
        </p>

        <div className="viralproof__mockup" ref={mockupRef}>
          <div className="viralproof__mockup-header">
            <div className="viralproof__mockup-store">
              <div className="viralproof__mockup-logo">م</div>
              <span className="viralproof__mockup-storename">متجر الخرطوم</span>
            </div>
            <span className="viralproof__mockup-cart">🛒 0</span>
          </div>

          <div className="viralproof__mockup-grid">
            {[
              { name: 'iPhone 15', price: '45,000 ج', color: 'rgba(124,58,237,0.2)' },
              { name: 'Galaxy S24', price: '38,000 ج', color: 'rgba(59,130,246,0.2)' },
              { name: 'AirPods Pro', price: '12,000 ج', color: 'rgba(16,185,129,0.2)' },
              { name: 'MacBook Air', price: '95,000 ج', color: 'rgba(245,158,11,0.2)' },
              { name: 'iPad Mini', price: '32,000 ج', color: 'rgba(239,68,68,0.2)' },
              { name: 'Galaxy Buds', price: '8,000 ج', color: 'rgba(124,58,237,0.15)' },
            ].map((item) => (
              <div className="viralproof__mockup-item" key={item.name}>
                <div
                  className="viralproof__mockup-item-img"
                  style={{ background: `linear-gradient(135deg, ${item.color}, transparent)` }}
                />
                <div className="viralproof__mockup-item-name">{item.name}</div>
                <div className="viralproof__mockup-item-price">{item.price}</div>
              </div>
            ))}
          </div>

          <div className="viralproof__watermark">
            <a href="https://vizzotrade.com" target="_blank" rel="noopener noreferrer">
              {WATERMARK_TEXT}
            </a>
          </div>
        </div>

        <p className="viralproof__explanation">
          الشعار يظهر تلقائياً في كل متجر مجاني — وعند ترقية التاجر للباقة الاحترافية
          يختفي الشعار وتبقى المتاجر المُنشأة سابقاً تحمل الرابط، مما يبني <strong>دورة نمو عضوية</strong> ذاتية الاستدامة.
        </p>
      </div>
    </section>
  );
}

export default ViralProof;
