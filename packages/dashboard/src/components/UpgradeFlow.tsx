/**
 * @vizzo/dashboard — Upgrade Flow Component
 * P2-15: Sequential multi-block interface for upgrading to Pro.
 * Steps: Pricing projection → Bank transfer matrix → Proof ingestion → Pending lock.
 * Manual bank transfer only (AP-08). No Stripe/PayPal.
 */

import { useState, useRef } from 'react';
import {
  createSupabaseClient,
  compressImage,
  DASHBOARD_STRINGS,
  PRICING,
  BANK_DETAILS,
  LANDING_STRINGS,
} from '@vizzo/shared';
import type { SubscriptionTier } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';

const DS = DASHBOARD_STRINGS;

type UpgradeStep = 'pricing' | 'bank' | 'proof' | 'pending';

const TIER_KEYS: SubscriptionTier[] = ['monthly', 'quarterly', 'annual'];

export function UpgradeFlow() {
  const { store, setStore } = useStore();
  const supabase = createSupabaseClient();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('annual');
  const [step, setStep] = useState<UpgradeStep>('pricing');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If already pending from the store status, lock immediately
  if (store?.subscription_status === 'pending' && step !== 'pending') {
    setStep('pending');
  }

  // ─── Copy to clipboard ─────────────────────────────────────────
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        console.error('[UpgradeFlow] Copy failed');
      }
      document.body.removeChild(textArea);
    }
  };

  // ─── Upload receipt to R2 ──────────────────────────────────────
  const uploadReceiptToR2 = async (file: File): Promise<string> => {
    if (!supabase) throw new Error('Supabase client not available');

    // Compress the image
    const compressed = await compressImage(file);

    // Get upload URL from Supabase storage (R2-backed)
    const fileName = `receipts/${store!.id}/${Date.now()}-${compressed.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, compressed, {
        contentType: compressed.type || 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // ─── Handle file selection ─────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const url = await uploadReceiptToR2(file);
      setReceiptFile(file);
      setReceiptUrl(url);
    } catch (err) {
      console.error('[UpgradeFlow] Receipt upload failed:', err);
      setError('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
    }
  };

  // ─── Submit subscription ───────────────────────────────────────
  const handleSubmit = async () => {
    if (!supabase || !store || !receiptUrl) return;

    setSubmitting(true);
    setError(null);

    try {
      const tierPrice = PRICING[selectedTier].usd;

      // INSERT into subscriptions table
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          store_id: store.id,
          tier: selectedTier,
          amount_usd: tierPrice,
          receipt_image_url: receiptUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Update store subscription_status to pending
      const { error: updateError } = await supabase
        .from('stores')
        .update({ subscription_status: 'pending' })
        .eq('id', store.id);

      if (updateError) throw updateError;

      // Update local store state
      setStore({
        ...store,
        subscription_status: 'pending',
      });

      setStep('pending');
    } catch (err) {
      console.error('[UpgradeFlow] Submission failed:', err);
      setError('فشل إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Pending Lock State ────────────────────────────────────────
  if (step === 'pending') {
    return (
      <div className="upgrade-flow">
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
          تم إرسال إشعار الدفع بنجاح. سيتم مراجعة الإيصال وتفعيل الباقة الاحترافية خلال 24 ساعة.
        </p>

        {/* Lock all sections with overlay */}
        <div className="pending-lock-overlay">
          <div className="upgrade-section" style={{ pointerEvents: 'none', opacity: 0.3 }}>
            <div className="upgrade-section-title">تفاصيل التحويل البنكي</div>
            <div className="bank-transfer-matrix">
              <div className="bank-detail-row">
                <span className="bank-detail-label">البنك</span>
                <span className="bank-detail-value">{BANK_DETAILS.bank}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-flow">
      {/* ─── Step 1: Pricing Projection ────────────────────────────── */}
      <div className="upgrade-section">
        <div className="upgrade-section-title">اختر الباقة</div>
        <div className="pricing-cards">
          {TIER_KEYS.map((tierKey) => {
            const tier = PRICING[tierKey];
            const isSelected = selectedTier === tierKey;
            const isAnnual = tierKey === 'annual';

            return (
              <div
                key={tierKey}
                className={`pricing-card${isSelected ? ' selected' : ''}${isAnnual ? ' annual' : ''}`}
                onClick={() => setSelectedTier(tierKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTier(tierKey);
                  }
                }}
              >
                {isAnnual && (
                  <span className="pricing-card-badge">
                    {LANDING_STRINGS.annualBadge}
                  </span>
                )}
                <div className="pricing-card-title">
                  {tierKey === 'monthly' ? 'شهري' : tierKey === 'quarterly' ? 'ربع سنوي' : 'سنوي'}
                </div>
                <div className="pricing-card-price">
                  ${tier.usd}
                  <span className="pricing-card-price-unit">
                    {tierKey === 'monthly' ? '/شهر' : tierKey === 'quarterly' ? '/3 أشهر' : '/سنة'}
                  </span>
                </div>
                <div className="pricing-card-label">{tier.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Step 2: Bank Transfer Matrix ──────────────────────────── */}
      <div className="upgrade-section">
        <div className="upgrade-section-title">تحويل بنكي</div>
        <div className="bank-transfer-matrix">
          <div className="bank-detail-row">
            <span className="bank-detail-label">البنك</span>
            <span className="bank-detail-value">{BANK_DETAILS.bank}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">اسم المستفيد</span>
            <span className="bank-detail-value">{BANK_DETAILS.beneficiary}</span>
            <button
              className={`copy-btn${copiedField === 'beneficiary' ? ' copied' : ''}`}
              onClick={() => copyToClipboard(BANK_DETAILS.beneficiary, 'beneficiary')}
              type="button"
            >
              {copiedField === 'beneficiary' ? 'تم النسخ ✓' : 'نسخ'}
            </button>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">رقم الحساب</span>
            <span className="bank-detail-value">{BANK_DETAILS.account}</span>
            <button
              className={`copy-btn${copiedField === 'account' ? ' copied' : ''}`}
              onClick={() => copyToClipboard(BANK_DETAILS.account, 'account')}
              type="button"
            >
              {copiedField === 'account' ? 'تم النسخ ✓' : 'نسخ'}
            </button>
          </div>
        </div>
        <div className="bank-transfer-note">
          ({LANDING_STRINGS.paymentNotice})
        </div>
      </div>

      {/* ─── Step 3: Proof Ingestion ───────────────────────────────── */}
      <div className="upgrade-section">
        <div className="upgrade-section-title">تأكيد الدفع</div>
        <div className="proof-upload-section">
          <p className="proof-upload-instructions">
            قم بتحويل المبلغ إلى الحساب البنكي أعلاه، ثم ارفع صورة إيصال الدفع هنا لتأكيد الاشتراك.
          </p>

          <div className={`proof-upload-area${receiptFile ? ' has-file' : ''}`}>
            <input
              ref={fileInputRef}
              className="proof-upload-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {receiptFile ? (
              <>
                <svg className="proof-upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="proof-upload-filename">{receiptFile.name}</span>
              </>
            ) : (
              <>
                <svg className="proof-upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="proof-upload-text">
                  {uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة الإيصال'}
                </span>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            className="proof-submit-btn"
            onClick={handleSubmit}
            disabled={!receiptUrl || submitting || uploading}
          >
            {submitting ? 'جاري الإرسال...' : DS.billingSend}
          </button>

          {error && <p className="upgrade-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
