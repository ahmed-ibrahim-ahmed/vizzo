/**
 * @vizzo/landing — Features Block (P1-04)
 * Section id="features" for Header scroll targeting.
 * Three feature sub-blocks with alternating text/visual sides.
 * Intersection Observer triggers slide-in animations.
 */

import { useEffect, useRef } from 'react';
import { AVAILABILITY_LABELS } from '@vizzo/shared/constants';

function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const textEl = entry.target.querySelector('.features__text');
            const visualEl = entry.target.querySelector('.features__visual');
            if (textEl) textEl.classList.add('features__text--visible');
            if (visualEl) visualEl.classList.add('features__visual--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const blocks = section.querySelectorAll('.features__block');
    blocks.forEach((block) => observer.observe(block));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="features" id="features" ref={sectionRef}>
      <div className="features__container">
        {/* Block 1: Thumb-Driven Dashboard */}
        <div className="features__block">
          <div className="features__text">
            <h3 className="features__text-title">تبديل بلمسة واحدة</h3>
            <p className="features__text-desc">
              بدّل حالة المنتج بين «{AVAILABILITY_LABELS.available}» و«{AVAILABILITY_LABELS.out}» بضغطة واحدة.
              الإخفاء غير مدمر — المنتج يبقى في قاعدة البيانات ولا يُحذف أبداً.
            </p>
          </div>
          <div className="features__visual">
            <div className="feature-toggle">
              <div className="feature-toggle__item">
                <div className="feature-toggle__info">
                  <div className="feature-toggle__dot" />
                  <div className="feature-toggle__name">iPhone 15 Pro</div>
                </div>
                <div>
                  <div className="feature-toggle__switch feature-toggle__switch--on" />
                  <div className="feature-toggle__label feature-toggle__label--on">{AVAILABILITY_LABELS.available}</div>
                </div>
              </div>
              <div className="feature-toggle__item">
                <div className="feature-toggle__info">
                  <div className="feature-toggle__dot" style={{ background: '#f59e0b' }} />
                  <div className="feature-toggle__name">AirPods Pro 2</div>
                </div>
                <div>
                  <div className="feature-toggle__switch feature-toggle__switch--off" />
                  <div className="feature-toggle__label feature-toggle__label--off">{AVAILABILITY_LABELS.out}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: Smart Discount Engine (reversed) */}
        <div className="features__block features__block--reverse">
          <div className="features__text">
            <h3 className="features__text-title">محرك تخفيضات ذكي</h3>
            <p className="features__text-desc">
              حدد سعر التخفيض ومدته — ويتولّى النظام تلقائياً عرض المنتج في بانر «عروض اليوم».
              عند انتهاء المدة يُلغى التخفيض تلقائياً.
            </p>
          </div>
          <div className="features__visual">
            <div className="feature-discount">
              <div className="feature-discount__product">
                <div className="feature-discount__name">iPhone 15 Pro</div>
                <div className="feature-discount__prices">
                  <span className="feature-discount__original">45,000</span>
                  <span className="feature-discount__sale">39,000</span>
                </div>
              </div>
              <div className="feature-discount__banner">
                <div className="feature-discount__banner-text">عروض اليوم</div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: Order Reception */}
        <div className="features__block">
          <div className="features__text">
            <h3 className="features__text-title">استقبال الطلبات عبر الواتساب</h3>
            <p className="features__text-desc">
              عندما يضغط المشتري «إرسال الطلب»، يُنشئ النظام رسالة واتساب منسقة بكل تفاصيل الطلب
              وتُرسل مباشرة إلى رقمك. لا حاجة لأي بوابة دفع.
            </p>
          </div>
          <div className="features__visual">
            <div className="feature-whatsapp">
              <div className="feature-whatsapp__label">رسالة واردة</div>
              <div className="feature-whatsapp__bubble">
                مرحباً، أود إتمام هذا الطلب من متجرك:
                <br />
                1x iPhone 15 Pro
                <br />
                السعر: 39,000
                <br />
                الإجمالي: 39,000
                <br />
                ملاحظات: لا يوجد
                <br />
                <span className="feature-whatsapp__link">vizzotrade.com/my-store</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
