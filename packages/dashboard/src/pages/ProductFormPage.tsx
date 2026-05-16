/**
 * @vizzo/dashboard — ProductFormPage
 * Multi-tier conditional product form:
 *   Tier 1 — Global (mandatory): name, base_price, images, category
 *   Tier 2 — Mobile (phones): brand, storage, ram, color, condition
 *   Tier 3 — PC (laptops): brand, storage, storage_type, ram, condition, processor, gpu
 *   Tier 4 — Dynamic Attributes: notes, custom key/value pairs
 * Route: /products/new (create) and /products/:id/edit (edit)
 * RTL layout, Arabic text, vanilla CSS.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  PRODUCT_FORM_STRINGS,
  FREE_TIER_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
  createSupabaseClient,
} from '@vizzo/shared';
import type { Product } from '@vizzo/shared';
import { useStore } from '../components/AuthGate';
import { useProductForm } from '../hooks/useProductForm';
import ImageUploader from '../components/ImageUploader';
import '../styles/productform.css';

interface LocationState {
  clonedProduct?: Product;
}

export default function ProductFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const locationState = location.state as LocationState | null;
  const { store } = useStore();

  const isEditMode = Boolean(params.id);
  const productId = params.id;

  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Fetch existing product in edit mode
  useEffect(() => {
    if (!isEditMode || !productId) return;

    const fetchProduct = async () => {
      const supabase = createSupabaseClient();
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('store_id', store?.id)
          .single();

        if (error) throw error;
        if (data) setExistingProduct(data as Product);
      } catch (err) {
        console.error('[ProductFormPage] Failed to fetch product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [isEditMode, productId, store?.id]);

  const {
    form,
    isSubmitting,
    errors,
    submitError,
    updateField,
    updateCustomAttribute,
    removeCustomAttribute,
    addCustomAttribute,
    handleSubmit,
  } = useProductForm({
    mode: isEditMode ? 'edit' : 'create',
    store,
    productId,
    clonedProduct: locationState?.clonedProduct ?? null,
    existingProduct,
    onSuccess: () => {
      navigate('/');
    },
  });

  const maxImages = store?.is_pro ? PRO_IMAGE_LIMIT : FREE_TIER_IMAGE_LIMIT;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  if (isLoading) {
    return (
      <div className="product-form-page">
        <div className="form-header">
          <button
            className="form-header-back"
            onClick={() => navigate('/')}
            aria-label="رجوع"
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="form-header-title">تحميل...</h1>
        </div>
        <div className="form-section">
          <div className="form-skeleton form-skeleton-input" />
          <div className="form-skeleton form-skeleton-input" />
          <div className="form-skeleton form-skeleton-input" />
        </div>
      </div>
    );
  }

  const categories: Array<{ value: typeof form.category; label: string }> = [
    { value: 'phones', label: PRODUCT_FORM_STRINGS.categoryPhones },
    { value: 'laptops', label: PRODUCT_FORM_STRINGS.categoryLaptops },
    { value: 'accessories', label: PRODUCT_FORM_STRINGS.categoryAccessories },
  ];

  return (
    <div className="product-form-page">
      {/* Header */}
      <div className="form-header">
        <button
          className="form-header-back"
          onClick={() => navigate('/')}
          aria-label="رجوع"
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="form-header-title">
          {isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        </h1>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* ─── Tier 1: Global (Mandatory) ──────────────────────────────── */}
        <div className="form-section">
          <h2 className="form-section-title">المعلومات الأساسية</h2>

          {/* Product Name */}
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="product-name">
              {PRODUCT_FORM_STRINGS.productName}
            </label>
            <input
              id="product-name"
              type="text"
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={PRODUCT_FORM_STRINGS.productName}
              autoComplete="off"
            />
            {errors.name && <p className="form-error-text">{errors.name}</p>}
          </div>

          {/* Base Price */}
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="base-price">
              {PRODUCT_FORM_STRINGS.basePrice}
            </label>
            <input
              id="base-price"
              type="number"
              className={`form-input ${errors.base_price ? 'form-input-error' : ''}`}
              value={form.base_price || ''}
              onChange={(e) =>
                updateField('base_price', parseFloat(e.target.value) || 0)
              }
              placeholder="0"
              min="1"
              dir="ltr"
            />
            {errors.base_price && (
              <p className="form-error-text">{errors.base_price}</p>
            )}
          </div>

          {/* Category Selector */}
          <div className="form-group">
            <label className="form-label form-label-required">
              {PRODUCT_FORM_STRINGS.categoryLabel}
            </label>
            <div className="category-chips">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-chip ${form.category === cat.value ? 'category-chip-active' : ''}`}
                  onClick={() => updateField('category', cat.value as typeof form.category)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="form-error-text">{errors.category}</p>
            )}
          </div>

          {/* Images */}
          <div className="form-group">
            <label className="form-label form-label-required">الصور</label>
            <ImageUploader
              images={form.images}
              onImagesChange={(urls) => updateField('images', urls)}
              maxImages={maxImages}
            />
            {errors.images && (
              <p className="form-error-text">{errors.images}</p>
            )}
          </div>
        </div>

        {/* ─── Tier 2: Mobile (phones) ─────────────────────────────────── */}
        {form.category === 'phones' && (
          <div className="form-section">
            <h2 className="form-section-title">تفاصيل الهاتف</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="phone-brand">
                {PRODUCT_FORM_STRINGS.brand}
              </label>
              <input
                id="phone-brand"
                type="text"
                className="form-input"
                value={form.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder={PRODUCT_FORM_STRINGS.brand}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone-storage">
                {PRODUCT_FORM_STRINGS.storageCapacity}
              </label>
              <input
                id="phone-storage"
                type="text"
                className="form-input"
                value={form.storage_capacity}
                onChange={(e) => updateField('storage_capacity', e.target.value)}
                placeholder="128GB"
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone-ram">
                {PRODUCT_FORM_STRINGS.ram}
              </label>
              <input
                id="phone-ram"
                type="text"
                className="form-input"
                value={form.ram}
                onChange={(e) => updateField('ram', e.target.value)}
                placeholder="8GB"
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone-color">
                {PRODUCT_FORM_STRINGS.color}
              </label>
              <input
                id="phone-color"
                type="text"
                className="form-input"
                value={form.color}
                onChange={(e) => updateField('color', e.target.value)}
                placeholder={PRODUCT_FORM_STRINGS.color}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{PRODUCT_FORM_STRINGS.condition}</label>
              <div className="form-radio-group">
                <button
                  type="button"
                  className={`form-radio-option ${form.condition === 'new' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('condition', 'new')}
                >
                  {PRODUCT_FORM_STRINGS.conditionNew}
                </button>
                <button
                  type="button"
                  className={`form-radio-option ${form.condition === 'used' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('condition', 'used')}
                >
                  {PRODUCT_FORM_STRINGS.conditionUsed}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tier 3: PC (laptops) ────────────────────────────────────── */}
        {form.category === 'laptops' && (
          <div className="form-section">
            <h2 className="form-section-title">تفاصيل الجهاز</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="laptop-brand">
                {PRODUCT_FORM_STRINGS.brand}
              </label>
              <input
                id="laptop-brand"
                type="text"
                className="form-input"
                value={form.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder={PRODUCT_FORM_STRINGS.brand}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="laptop-storage">
                {PRODUCT_FORM_STRINGS.storageCapacity}
              </label>
              <input
                id="laptop-storage"
                type="text"
                className="form-input"
                value={form.storage_capacity}
                onChange={(e) => updateField('storage_capacity', e.target.value)}
                placeholder="512GB"
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{PRODUCT_FORM_STRINGS.storageType}</label>
              <div className="form-radio-group">
                <button
                  type="button"
                  className={`form-radio-option ${form.storage_type === 'hdd' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('storage_type', 'hdd')}
                >
                  {PRODUCT_FORM_STRINGS.storageHdd}
                </button>
                <button
                  type="button"
                  className={`form-radio-option ${form.storage_type === 'ssd' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('storage_type', 'ssd')}
                >
                  {PRODUCT_FORM_STRINGS.storageSsd}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="laptop-ram">
                {PRODUCT_FORM_STRINGS.ram}
              </label>
              <input
                id="laptop-ram"
                type="text"
                className="form-input"
                value={form.ram}
                onChange={(e) => updateField('ram', e.target.value)}
                placeholder="16GB"
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{PRODUCT_FORM_STRINGS.condition}</label>
              <div className="form-radio-group">
                <button
                  type="button"
                  className={`form-radio-option ${form.condition === 'new' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('condition', 'new')}
                >
                  {PRODUCT_FORM_STRINGS.conditionNew}
                </button>
                <button
                  type="button"
                  className={`form-radio-option ${form.condition === 'used' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('condition', 'used')}
                >
                  {PRODUCT_FORM_STRINGS.conditionUsed}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="laptop-processor">
                {PRODUCT_FORM_STRINGS.processor}
              </label>
              <input
                id="laptop-processor"
                type="text"
                className="form-input"
                value={form.processor}
                onChange={(e) => updateField('processor', e.target.value)}
                placeholder={PRODUCT_FORM_STRINGS.processor}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{PRODUCT_FORM_STRINGS.gpu}</label>
              <div className="form-radio-group">
                <button
                  type="button"
                  className={`form-radio-option ${form.gpu_type === 'internal' ? 'form-radio-option-active' : ''}`}
                  onClick={() => {
                    updateField('gpu_type', 'internal');
                    updateField('gpu_name', '');
                  }}
                >
                  {PRODUCT_FORM_STRINGS.gpuInternal}
                </button>
                <button
                  type="button"
                  className={`form-radio-option ${form.gpu_type === 'external' ? 'form-radio-option-active' : ''}`}
                  onClick={() => updateField('gpu_type', 'external')}
                >
                  {PRODUCT_FORM_STRINGS.gpuExternal}
                </button>
                <button
                  type="button"
                  className={`form-radio-option ${form.gpu_type === 'none' ? 'form-radio-option-active' : ''}`}
                  onClick={() => {
                    updateField('gpu_type', 'none');
                    updateField('gpu_name', '');
                  }}
                >
                  {PRODUCT_FORM_STRINGS.gpuNone}
                </button>
              </div>
            </div>

            {/* GPU Name — only when gpu_type === 'external' */}
            {form.gpu_type === 'external' && (
              <div className="form-group">
                <label className="form-label" htmlFor="gpu-name">
                  اسم كرت الشاشة
                </label>
                <input
                  id="gpu-name"
                  type="text"
                  className="form-input"
                  value={form.gpu_name}
                  onChange={(e) => updateField('gpu_name', e.target.value)}
                  placeholder="مثال: NVIDIA RTX 3060"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        )}

        {/* ─── Tier 4: Dynamic Attributes (always visible) ─────────────── */}
        <div className="form-section">
          <h2 className="form-section-title">معلومات إضافية</h2>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="product-notes">
              {PRODUCT_FORM_STRINGS.notes}
            </label>
            <textarea
              id="product-notes"
              className="form-textarea"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={PRODUCT_FORM_STRINGS.notes}
              rows={3}
            />
          </div>

          {/* Custom Attributes */}
          {Object.keys(form.custom_attributes).length > 0 && (
            <div className="dynamic-attributes-list">
              {Object.entries(form.custom_attributes).map(([key, value]) => (
                <div key={key} className="dynamic-attribute-row">
                  <input
                    type="text"
                    className="form-input"
                    value={key}
                    onChange={(e) => {
                      const newAttrs = { ...form.custom_attributes };
                      const oldValue = newAttrs[key];
                      delete newAttrs[key];
                      newAttrs[e.target.value] = oldValue;
                      updateField('custom_attributes', newAttrs);
                    }}
                    placeholder="الميزة"
                    autoComplete="off"
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={value}
                    onChange={(e) => updateCustomAttribute(key, e.target.value)}
                    placeholder="القيمة"
                    autoComplete="off"
                  />
                  <button
                    className="dynamic-attribute-remove"
                    onClick={() => removeCustomAttribute(key)}
                    aria-label={`إزالة ${key}`}
                    type="button"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="add-attribute-btn"
            onClick={addCustomAttribute}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {PRODUCT_FORM_STRINGS.addAttribute}
          </button>
        </div>

        {/* Submit Error */}
        {submitError && (
          <p className="form-error-text" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            {submitError}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="form-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'جاري الحفظ...'
            : isEditMode
              ? 'حفظ التعديلات'
              : 'إضافة المنتج'}
        </button>
      </form>
    </div>
  );
}
