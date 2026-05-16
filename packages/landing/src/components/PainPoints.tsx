/**
 * @vizzo/landing — Pain Points Block (P1-03)
 * Three cards with inline SVG icons, Intersection Observer fade-in.
 * Cards use Intersection Observer for scroll-triggered staggered fade-in animation.
 */

import { useEffect, useRef } from 'react';
import { LANDING_STRINGS } from '@vizzo/shared/constants';

const STRINGS = LANDING_STRINGS;

function PainPoints() {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = cardsRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('painpoints__card--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = container.querySelectorAll('.painpoints__card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="painpoints">
      <div className="painpoints__container">
        <div className="painpoints__grid" ref={cardsRef}>
          {/* Card 1: Chat-bubble icon */}
          <div className="painpoints__card">
            <svg className="painpoints__icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="48" height="32" rx="8" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M16 48L22 40H14L16 48Z" fill="currentColor"/>
              <circle cx="18" cy="24" r="2.5" fill="currentColor"/>
              <circle cx="28" cy="24" r="2.5" fill="currentColor"/>
              <circle cx="38" cy="24" r="2.5" fill="currentColor"/>
            </svg>
            <p className="painpoints__text">{STRINGS.painPoint1}</p>
          </div>

          {/* Card 2: Chart-declining icon */}
          <div className="painpoints__card">
            <svg className="painpoints__icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 40L20 28L30 34L48 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M36 16H48V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="48" x2="48" y2="48" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <line x1="8" y1="8" x2="8" y2="48" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            </svg>
            <p className="painpoints__text">{STRINGS.painPoint2}</p>
          </div>

          {/* Card 3: Scattered-gallery icon */}
          <div className="painpoints__card">
            <svg className="painpoints__icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="12" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
              <rect x="28" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
              <rect x="16" y="32" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
            <p className="painpoints__text">{STRINGS.painPoint3}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PainPoints;
