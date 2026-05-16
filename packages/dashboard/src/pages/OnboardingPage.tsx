/**
 * @vizzo/dashboard — OnboardingPage
 * Single-page onboarding wizard with 3 fields:
 * 1. Store Name (اسم المتجر) — auto-generates slug
 * 2. Store Slug — read-only display with live uniqueness validation
 * 3. WhatsApp Number (رقم استقبال الطلبات) — with immutable +249 prefix (AP-14)
 *
 * On submit: INSERT merchant + store, then navigate to /
 */

import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { DASHBOARD_STRINGS, SUDAN_COUNTRY_CODE } from '@vizzo/shared';
import '../styles/onboarding.css';

export function OnboardingPage() {
  const { session, loading: authLoading } = useAuth();
  const {
    storeName,
    slug,
    whatsappDigits,
    isSlugValid,
    isSlugChecking,
    isWhatsappValid,
    isFormValid,
    isSubmitting,
    submitError,
    setStoreName,
    setSlug,
    setWhatsappDigits,
    handleSubmit,
  } = useOnboarding();

  if (authLoading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className="onboarding-page">
      <form className="onboarding-form" onSubmit={onSubmit}>
        <h1 className="onboarding-title">{DASHBOARD_STRINGS.onboardingStoreName}</h1>

        <div className="onboarding-field-group">
          <label className="onboarding-label" htmlFor="store-name">
            {DASHBOARD_STRINGS.onboardingStoreName}
          </label>
          <input
            id="store-name"
            className="onboarding-input"
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="مثال: متجر الخرطوم للهواتف"
            autoComplete="off"
            dir="rtl"
          />
        </div>

        <div className="onboarding-field-group">
          <label className="onboarding-label" htmlFor="store-slug">
            رابط المتجر
          </label>
          <div className="slug-preview">
            <span className="slug-prefix">{DASHBOARD_STRINGS.onboardingSlug}</span>
            <input
              id="store-slug"
              className="slug-input"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="store-slug"
              dir="ltr"
              autoComplete="off"
            />
            <span className="slug-status">
              {isSlugChecking && <span className="slug-checking">...</span>}
              {!isSlugChecking && isSlugValid === true && (
                <span className="slug-valid" aria-label="الرابط متاح">✔</span>
              )}
              {!isSlugChecking && isSlugValid === false && (
                <span className="slug-invalid" aria-label="الرابط مستخدم">✖</span>
              )}
            </span>
          </div>
          {!isSlugChecking && isSlugValid === false && (
            <p className="onboarding-field-error">هذا الرابط مستخدم بالفعل، اختر رابطاً آخر</p>
          )}
        </div>

        <div className="onboarding-field-group">
          <label className="onboarding-label" htmlFor="whatsapp-number">
            {DASHBOARD_STRINGS.onboardingWhatsapp}
          </label>
          <div className="whatsapp-input-group">
            <span className="whatsapp-prefix">{SUDAN_COUNTRY_CODE}</span>
            <input
              id="whatsapp-number"
              className="whatsapp-digits-input"
              type="tel"
              value={whatsappDigits}
              onChange={(e) => setWhatsappDigits(e.target.value)}
              placeholder="912345678"
              dir="ltr"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
            />
          </div>
          {whatsappDigits.length > 0 && !isWhatsappValid && (
            <p className="onboarding-field-error">أدخل رقم واتساب صالح (9-10 أرقام)</p>
          )}
        </div>

        {submitError && (
          <div className="onboarding-submit-error">{submitError}</div>
        )}

        <button
          className="onboarding-submit"
          type="submit"
          disabled={!isFormValid}
        >
          {isSubmitting ? 'جارٍ الإنشاء...' : DASHBOARD_STRINGS.onboardingSubmit}
        </button>
      </form>
    </div>
  );
}
