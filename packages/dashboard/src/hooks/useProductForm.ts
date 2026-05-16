/**
 * @vizzo/dashboard — useProductForm Hook
 * Custom hook for product creation/editing form state.
 * Supports multi-tier conditional fields, validation, and clone pre-fill.
 * Mode: 'create' | 'edit'
 */

import { useState, useCallback, useEffect } from 'react';
import { createSupabaseClient } from '@vizzo/shared';
import type { Product, Category, Store } from '@vizzo/shared';

export interface ProductFormData {
  name: string;
  base_price: number;
  category: Category | '';
  images: string[];
  brand: string;
  storage_capacity: string;
  ram: string;
  color: string;
  condition: 'new' | 'used' | '';
  storage_type: 'hdd' | 'ssd' | '';
  processor: string;
  gpu_type: 'internal' | 'external' | 'none' | '';
  gpu_name: string;
  notes: string;
  custom_attributes: Record<string, string>;
}

export interface ValidationErrors {
  name?: string;
  base_price?: string;
  category?: string;
  images?: string;
}

const INITIAL_FORM_DATA: ProductFormData = {
  name: '',
  base_price: 0,
  category: '',
  images: [],
  brand: '',
  storage_capacity: '',
  ram: '',
  color: '',
  condition: '',
  storage_type: '',
  processor: '',
  gpu_type: '',
  gpu_name: '',
  notes: '',
  custom_attributes: {},
};

function productToFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    base_price: product.base_price,
    category: product.category,
    images: [...product.images],
    brand: product.brand ?? '',
    storage_capacity: product.storage_capacity ?? '',
    ram: product.ram ?? '',
    color: product.color ?? '',
    condition: product.condition ?? '',
    storage_type: product.storage_type ?? '',
    processor: product.processor ?? '',
    gpu_type: product.gpu_type ?? '',
    gpu_name: product.gpu_name ?? '',
    notes: product.notes ?? '',
    custom_attributes: product.custom_attributes ? { ...product.custom_attributes } : {},
  };
}

interface UseProductFormOptions {
  mode: 'create' | 'edit';
  store: Store | null;
  productId?: string;
  clonedProduct?: Product | null;
  existingProduct?: Product | null;
  onSuccess?: () => void;
}

export function useProductForm({
  mode,
  store,
  productId,
  clonedProduct,
  existingProduct,
  onSuccess,
}: UseProductFormOptions) {
  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill from existing product (edit mode) or cloned product (clone mode)
  useEffect(() => {
    if (mode === 'edit' && existingProduct) {
      setForm(productToFormData(existingProduct));
    } else if (clonedProduct) {
      const cloned = productToFormData(clonedProduct);
      cloned.name = `${cloned.name} (نسخة)`;
      setForm(cloned);
    }
  }, [mode, existingProduct, clonedProduct]);

  const updateField = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (prev[key as keyof ValidationErrors]) {
        const next = { ...prev };
        delete next[key as keyof ValidationErrors];
        return next;
      }
      return prev;
    });
  }, []);

  const updateCustomAttribute = useCallback((key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      custom_attributes: { ...prev.custom_attributes, [key]: value },
    }));
  }, []);

  const removeCustomAttribute = useCallback((key: string) => {
    setForm((prev) => {
      const next = { ...prev.custom_attributes };
      delete next[key];
      return { ...prev, custom_attributes: next };
    });
  }, []);

  const addCustomAttribute = useCallback(() => {
    setForm((prev) => {
      const keys = Object.keys(prev.custom_attributes);
      const newKey = `ميزة ${keys.length + 1}`;
      return {
        ...prev,
        custom_attributes: { ...prev.custom_attributes, [newKey]: '' },
      };
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'اسم المنتج مطلوب';
    }

    if (!form.base_price || form.base_price <= 0) {
      newErrors.base_price = 'السعر الأساسي يجب أن يكون أكبر من صفر';
    }

    if (!form.category) {
      newErrors.category = 'يرجى اختيار الفئة';
    }

    if (form.images.length === 0) {
      newErrors.images = 'يرجى إضافة صورة واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const buildProductPayload = useCallback(() => {
    const isPhones = form.category === 'phones';
    const isLaptops = form.category === 'laptops';

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      base_price: Math.round(form.base_price),
      category: form.category,
      images: form.images,
      is_available: true,
      is_archived: false,
      is_discounted: false,
      discount_price: null,
      discount_expires_at: null,
      sort_order: 0,
    };

    // Phones: brand, storage_capacity, ram, color, condition
    if (isPhones) {
      payload.brand = form.brand.trim() || null;
      payload.storage_capacity = form.storage_capacity.trim() || null;
      payload.ram = form.ram.trim() || null;
      payload.color = form.color.trim() || null;
      payload.condition = form.condition || null;
      // Clear laptop-only fields
      payload.storage_type = null;
      payload.processor = null;
      payload.gpu_type = null;
      payload.gpu_name = null;
    }
    // Laptops: brand, storage_capacity, storage_type, ram, condition, processor, gpu_type, gpu_name
    else if (isLaptops) {
      payload.brand = form.brand.trim() || null;
      payload.storage_capacity = form.storage_capacity.trim() || null;
      payload.storage_type = form.storage_type || null;
      payload.ram = form.ram.trim() || null;
      payload.condition = form.condition || null;
      payload.processor = form.processor.trim() || null;
      payload.gpu_type = form.gpu_type || null;
      payload.gpu_name =
        form.gpu_type === 'external' && form.gpu_name.trim()
          ? form.gpu_name.trim()
          : null;
      // Clear phone-only fields
      payload.color = null;
    }
    // Accessories: clear all tier-specific fields
    else {
      payload.brand = null;
      payload.storage_capacity = null;
      payload.ram = null;
      payload.color = null;
      payload.condition = null;
      payload.storage_type = null;
      payload.processor = null;
      payload.gpu_type = null;
      payload.gpu_name = null;
    }

    payload.notes = form.notes.trim() || null;
    payload.custom_attributes =
      Object.keys(form.custom_attributes).length > 0
        ? form.custom_attributes
        : {};

    return payload;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return false;

    const supabase = createSupabaseClient();
    if (!supabase || !store) {
      setSubmitError('خطأ في الاتصال. يرجى المحاولة لاحقاً.');
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildProductPayload();

      if (mode === 'edit' && productId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId);

        if (error) throw error;
      } else {
        (payload as Record<string, unknown>).store_id = store.id;
        const { error } = await supabase.from('products').insert(payload);

        if (error) throw error;
      }

      onSuccess?.();
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ';
      setSubmitError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, mode, productId, store, buildProductPayload, onSuccess]);

  return {
    form,
    isSubmitting,
    errors,
    submitError,
    updateField,
    updateCustomAttribute,
    removeCustomAttribute,
    addCustomAttribute,
    handleSubmit,
    setForm,
  };
}
