/**
 * @vizzo/dashboard — useDiscount Hook
 * Custom hook for discount management on a product.
 * Validates discount_price < base_price and > 0.
 * Handles save (with temporal trigger) and remove discount.
 */

import { useState, useCallback } from 'react';
import { createSupabaseClient, DEFAULT_DISCOUNT_DAYS } from '@vizzo/shared';
import type { Product } from '@vizzo/shared';

interface UseDiscountOptions {
  product: Product;
  onSaved: () => void;
}

export function useDiscount({ product, onSaved }: UseDiscountOptions) {
  const [discountPrice, setDiscountPrice] = useState<string>(
    product.is_discounted && product.discount_price !== null
      ? String(product.discount_price)
      : ''
  );
  const [durationDays, setDurationDays] = useState<string>(
    String(DEFAULT_DISCOUNT_DAYS)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDiscount = parseFloat(discountPrice);
  const parsedDuration = parseInt(durationDays, 10);

  const isDiscountValid =
    discountPrice.trim() !== '' &&
    !isNaN(parsedDiscount) &&
    parsedDiscount > 0 &&
    parsedDiscount < product.base_price;

  const isDurationValid =
    durationDays.trim() !== '' &&
    !isNaN(parsedDuration) &&
    parsedDuration > 0;

  const validate = useCallback((): boolean => {
    if (!discountPrice.trim() || isNaN(parsedDiscount)) {
      setError('يرجى إدخال سعر التخفيض');
      return false;
    }
    if (parsedDiscount <= 0) {
      setError('سعر التخفيض يجب أن يكون أكبر من صفر');
      return false;
    }
    if (parsedDiscount >= product.base_price) {
      setError('سعر التخفيض يجب أن يكون أقل من السعر الأصلي');
      return false;
    }
    if (!durationDays.trim() || isNaN(parsedDuration) || parsedDuration <= 0) {
      setError('يرجى إدخال مدة صالحة');
      return false;
    }
    setError(null);
    return true;
  }, [discountPrice, parsedDiscount, parsedDuration, durationDays, product.base_price]);

  const saveDiscount = useCallback(async () => {
    if (!validate()) return false;

    const supabase = createSupabaseClient();
    if (!supabase) {
      setError('خطأ في الاتصال');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parsedDuration);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_discounted: true,
          discount_price: Math.round(parsedDiscount),
          discount_expires_at: expiresAt.toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      onSaved();
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التخفيض';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, parsedDiscount, parsedDuration, product.id, onSaved]);

  const removeDiscount = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setError('خطأ في الاتصال');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_discounted: false,
          discount_price: null,
          discount_expires_at: null,
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setDiscountPrice('');
      onSaved();
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء إزالة التخفيض';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [product.id, onSaved]);

  return {
    discountPrice,
    setDiscountPrice,
    durationDays,
    setDurationDays,
    isSubmitting,
    error,
    setError,
    isDiscountValid,
    isDurationValid,
    saveDiscount,
    removeDiscount,
    validate,
  };
}
