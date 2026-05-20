/**
 * @vizzo/dashboard — Settings Page
 * P2-14: Store identity editing, location, social links, WhatsApp display.
 * Includes AccountActions component (P2-16) at the bottom.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createSupabaseClient,
  generateSlug,
  DASHBOARD_STRINGS,
  SUDAN_COUNTRY_CODE,
} from '@vizzo/shared';
import type { Store } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';
import { AccountActions } from '../components/AccountActions';
import '../styles/settings.css';

const DS = DASHBOARD_STRINGS;

type SlugAvailability = 'idle' | 'checking' | 'available' | 'taken';

export default function SettingsPage() {
  const { store, setStore } = useStore();
  const supabase = createSupabaseClient();

  const [name, setName] = useState(store?.name ?? '');
  const [slug, setSlug] = useState(store?.slug ?? '');
  const [originalSlug, setOriginalSlug] = useState(store?.slug ?? '');
  const [location, setLocation] = useState(store?.location ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(
    store?.whatsapp_number?.replace(SUDAN_COUNTRY_CODE, '') ?? ''
  );
  const [tiktokUrl, setTiktokUrl] = useState(store?.tiktok_url ?? '');
  const [instagramUrl, setInstagramUrl] = useState(store?.instagram_url ?? '');
  const [facebookUrl, setFacebookUrl] = useState(store?.facebook_url ?? '');

  const [showSlugWarning, setShowSlugWarning] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability>('idle');
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show slug warning when slug changes from original
  useEffect(() => {
    setShowSlugWarning(slug !== originalSlug && slug.length > 0);
  }, [slug, originalSlug]);

  // Debounced slug uniqueness check
  const checkSlugUniqueness = useCallback(
    async (newSlug: string) => {
      if (!supabase || !newSlug || newSlug === originalSlug) {
        setSlugAvailability('idle');
        return;
      }
      setSlugAvailability('checking');
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', newSlug)
        .limit(1);

      if (error) {
        setSlugAvailability('idle');
        return;
      }
      setSlugAvailability(data && data.length > 0 ? 'taken' : 'available');
    },
    [supabase, originalSlug]
  );

  useEffect(() => {
    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
    }
    if (slug && slug !== originalSlug) {
      slugDebounceRef.current = setTimeout(() => {
        checkSlugUniqueness(slug);
      }, 300);
    } else {
      setSlugAvailability('idle');
    }
    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
    };
  }, [slug, originalSlug, checkSlugUniqueness]);

  // Auto-generate slug from name
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (newName !== store?.name) {
      const generated = generateSlug(newName);
      setSlug(generated);
    }
  };

  // Save settings
  const handleSave = async () => {
    if (!supabase || !store) return;
    if (slugAvailability === 'taken') return;
    if (slugAvailability === 'checking') return;

    setSaving(true);
    try {
      const fullWhatsapp = `${SUDAN_COUNTRY_CODE}${whatsappNumber.replace(/\D/g, '')}`;
      const updates: Partial<Store> = {
        name,
        slug,
        location: location || null,
        whatsapp_number: fullWhatsapp,
        tiktok_url: tiktokUrl || null,
        instagram_url: instagramUrl || null,
        facebook_url: facebookUrl || null,
      };

      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', store.id);

      if (error) throw error;

      setOriginalSlug(slug);
      setStore({
        ...store,
        ...updates,
      });

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error('[Settings] Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const isSaveDisabled =
    saving ||
    slugAvailability === 'taken' ||
    slugAvailability === 'checking' ||
    !name.trim() ||
    !slug.trim() ||
    !whatsappNumber.trim();

  // Slug availability text
  const slugAvailabilityText = () => {
    switch (slugAvailability) {
      case 'checking':
        return 'جاري التحقق...';
      case 'available':
        return 'الرابط متاح ✓';
      case 'taken':
        return 'الرابط مستخدم بالفعل ✗';
      default:
        return '';
    }
  };

  return (
    <div className="settings-page">
      {/* ─── Store Identity Section ─────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">هوية المتجر</div>

        {/* Store Name */}
        <div className="settings-field-group">
          <label className="settings-label">اسم المتجر</label>
          <input
            className="settings-input"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={DS.onboardingStoreName}
          />
        </div>

        {/* Store Slug */}
        <div className="settings-field-group">
          <label className="settings-label">رابط المتجر</label>
          <div className="slug-input-wrapper">
            <input
              className="slug-input"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
              placeholder="store-slug"
            />
            <span className="slug-prefix">{DS.onboardingSlug}</span>
          </div>
          {slugAvailability !== 'idle' && (
            <div className={`slug-availability ${slugAvailability}`}>
              {slugAvailabilityText()}
            </div>
          )}
        </div>

        {/* Slug Change Warning */}
        {showSlugWarning && (
          <div className="slug-warning">
            <svg
              className="slug-warning-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="slug-warning-text">{DS.slugWarning}</span>
          </div>
        )}
      </div>

      {/* ─── Location Section ───────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">الموقع</div>
        <div className="settings-field-group">
          <label className="settings-label">وصف الموقع</label>
          <input
            className="settings-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={DS.locationPlaceholder}
          />
        </div>
      </div>

      {/* ─── WhatsApp Section ───────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">رقم الواتساب</div>
        <div className="settings-field-group">
          <label className="settings-label">رقم استقبال الطلبات</label>
          <div className="whatsapp-display">
            <input
              className="whatsapp-number-input"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                if (digits.length <= 10) {
                  setWhatsappNumber(digits);
                }
              }}
              placeholder="912345678"
              maxLength={10}
            />
            <span className="whatsapp-prefix">{SUDAN_COUNTRY_CODE}</span>
          </div>
        </div>
      </div>

      {/* ─── Social Links Section ───────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">روابط التواصل الاجتماعي</div>
        <div className="social-links-grid">
          {/* TikTok */}
          <div className="social-link-row">
            <div className="social-link-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.36-6.22V8.79a8.18 8.18 0 0 0 3.86.96V6.69z" />
              </svg>
            </div>
            <input
              className="social-link-input"
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@username"
            />
          </div>

          {/* Instagram */}
          <div className="social-link-row">
            <div className="social-link-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <input
              className="social-link-input"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/username"
            />
          </div>

          {/* Facebook */}
          <div className="social-link-row">
            <div className="social-link-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </div>
            <input
              className="social-link-input"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/username"
            />
          </div>
        </div>
      </div>

      {/* ─── Save Button ────────────────────────────────────────── */}
      <button
        className="settings-save-btn"
        onClick={handleSave}
        disabled={isSaveDisabled}
      >
        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>

      <div className={`settings-saved-indicator ${showSaved ? 'visible' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        تم الحفظ
      </div>

      {/* ─── Account Actions (P2-16) ────────────────────────────── */}
      <AccountActions />
    </div>
  );
}
