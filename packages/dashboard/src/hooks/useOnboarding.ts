/**
 * @vizzo/dashboard — useOnboarding Hook
 * Custom hook for onboarding form state management.
 * - Auto-generates slug from store name
 * - Debounced slug uniqueness check (300ms)
 * - WhatsApp validation with +249 prefix (AP-14)
 * - Inserts merchant + store records on submit
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSlug, SUDAN_COUNTRY_CODE } from '@vizzo/shared';
import type { Store, Merchant } from '@vizzo/shared';
import { useAuth } from './useAuth';

interface OnboardingState {
  storeName: string;
  slug: string;
  whatsappDigits: string;
  isSlugValid: boolean | null;
  isSlugChecking: boolean;
  isWhatsappValid: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  setStoreName: (name: string) => void;
  setSlug: (slug: string) => void;
  setWhatsappDigits: (digits: string) => void;
  handleSubmit: () => Promise<void>;
}

const WHATSAPP_REGEX = /^[0-9]{9,10}$/;
const SLUG_DEBOUNCE_MS = 300;

export function useOnboarding(): OnboardingState {
  const navigate = useNavigate();
  const { session, user, supabase } = useAuth();

  const [storeName, setStoreNameState] = useState('');
  const [slug, setSlugState] = useState('');
  const [whatsappDigits, setWhatsappDigitsState] = useState('');
  const [isSlugValid, setIsSlugValid] = useState<boolean | null>(null);
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<boolean>(false);

  const isWhatsappValid = WHATSAPP_REGEX.test(whatsappDigits);
  const isFormValid =
    storeName.trim().length > 0 &&
    slug.trim().length > 0 &&
    isSlugValid === true &&
    isWhatsappValid &&
    !isSubmitting;

  const setStoreName = useCallback((name: string) => {
    setStoreNameState(name);
    const autoSlug = generateSlug(name);
    setSlugState(autoSlug);
    setIsSlugValid(null);
  }, []);

  const setSlug = useCallback((newSlug: string) => {
    const sanitized = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlugState(sanitized);
    setIsSlugValid(null);
  }, []);

  const setWhatsappDigits = useCallback((digits: string) => {
    const sanitized = digits.replace(/[^0-9]/g, '').slice(0, 10);
    setWhatsappDigitsState(sanitized);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!slug.trim()) {
      setIsSlugValid(null);
      setIsSlugChecking(false);
      return;
    }

    setIsSlugChecking(true);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) return;

      if (!supabase) {
        setIsSlugValid(null);
        setIsSlugChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (abortRef.current) return;

      if (error) {
        console.error('[Vizzo] Slug check error:', error.message);
        setIsSlugValid(null);
      } else {
        setIsSlugValid(data === null);
      }

      setIsSlugChecking(false);
    }, SLUG_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [slug, supabase]);

  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!supabase || !user || !session) {
      setSubmitError('غير مسجل الدخول — يرجى المحاولة مرة أخرى');
      return;
    }

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const googleId = user.user_metadata?.sub || user.id;
      const email = user.email ?? '';
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null;
      const avatarUrl = user.user_metadata?.avatar_url || null;
      const whatsappNumber = `${SUDAN_COUNTRY_CODE}${whatsappDigits}`;

      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          google_id: googleId,
          email,
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (merchantError) {
        if (merchantError.code === '23505') {
          const { data: existingMerchant, error: fetchError } = await supabase
            .from('merchants')
            .select('*')
            .eq('google_id', googleId)
            .single();

          if (fetchError || !existingMerchant) {
            throw new Error('فشل في استرداد بيانات التاجر');
          }

          const { data: store, error: storeError2 } = await supabase
            .from('stores')
            .select('*')
            .eq('merchant_id', existingMerchant.id)
            .maybeSingle();

          if (storeError2) {
            throw new Error('فشل في التحقق من المتجر');
          }

          if (store) {
            navigate('/', { replace: true });
            return;
          }

          const { data: newStore, error: createStoreError } = await supabase
            .from('stores')
            .insert({
              name: storeName.trim(),
              slug,
              whatsapp_number: whatsappNumber,
              merchant_id: existingMerchant.id,
            })
            .select()
            .single();

          if (createStoreError) {
            throw createStoreError;
          }

          navigate('/', { replace: true });
          return;
        }
        throw merchantError;
      }

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: storeName.trim(),
          slug,
          whatsapp_number: whatsappNumber,
          merchant_id: merchant.id,
        })
        .select()
        .single();

      if (storeError) {
        throw storeError;
      }

      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      console.error('[Vizzo] Onboarding error:', message);
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }, [supabase, user, session, isFormValid, storeName, slug, whatsappDigits, navigate]);

  return {
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
  };
}
