/**
 * @vizzo/landing — Final CTA Block (P1-07)
 * Minimalist full-width section. Zero images, zero secondary links.
 * Single centered paragraph + duplicate Google OAuth CTA.
 * Terminal conversion node of the funnel.
 */

import { useEffect, useRef } from 'react';
import { LANDING_STRINGS } from '@vizzo/shared/constants';

const STRINGS = LANDING_STRINGS;

interface FinalCTAProps {
  onLogin: () => void;
}

function FinalCTA({ onLogin }: FinalCTAProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const text = section.querySelector('.final-cta__text');
          const btn = section.querySelector('.final-cta__btn');
          if (text) text.classList.add('final-cta__text--visible');
          if (btn) btn.classList.add('final-cta__btn--visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="final-cta" ref={sectionRef}>
      <p className="final-cta__text">{STRINGS.finalCtaText}</p>
      <button className="final-cta__btn" onClick={onLogin} type="button">
        <svg className="final-cta__btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {STRINGS.ctaGoogle}
      </button>
    </section>
  );
}

export default FinalCTA;
