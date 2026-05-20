/**
 * @vizzo/dashboard — EditorControls Component
 * Control panel for storefront customization.
 * - Header Config: Logo upload (compress → R2 pipeline).
 * - Row Management: Drag-and-drop list of banner slots.
 * Uses native HTML5 drag-and-drop API for reordering.
 */

import { useState, useRef, useCallback } from 'react';
import { createSupabaseClient, compressImage } from '@vizzo/shared';
import type { BannerSlot, Store, Product } from '@vizzo/shared';
import BannerSlotEditor from './BannerSlotEditor';

interface EditorControlsProps {
  store: Store | null;
  bannerSlots: BannerSlot[];
  products: Product[];
  discountedProducts: Product[];
  onUpdateSlots: (slots: BannerSlot[]) => void;
  onUpdateStore: (store: Store) => void;
  onPreviewToggle: () => void;
}

export default function EditorControls({
  store,
  bannerSlots,
  products,
  discountedProducts,
  onUpdateSlots,
  onUpdateStore,
  onPreviewToggle,
}: EditorControlsProps) {
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedSlots = [...bannerSlots].sort((a, b) => a.sort_order - b.sort_order);
  const editingSlot = editingSlotId
    ? bannerSlots.find((s) => s.id === editingSlotId) || null
    : null;

  const handleSlotClick = (slotId: string) => {
    setEditingSlotId(slotId);
  };

  const handleSlotUpdate = (updated: BannerSlot) => {
    const newSlots = bannerSlots.map((s) => (s.id === updated.id ? updated : s));
    onUpdateSlots(newSlots);
  };

  const handleBackFromEditor = () => {
    setEditingSlotId(null);
  };

  const handleVisibilityToggle = async (
    e: React.MouseEvent,
    slotId: string,
    currentVisible: boolean
  ) => {
    e.stopPropagation();
    const supabase = createSupabaseClient();
    if (!supabase) return;

    const newVisible = !currentVisible;
    try {
      const { error } = await supabase
        .from('banner_slots')
        .update({ is_visible: newVisible })
        .eq('id', slotId);

      if (!error) {
        const newSlots = bannerSlots.map((s) =>
          s.id === slotId ? { ...s, is_visible: newVisible } : s
        );
        onUpdateSlots(newSlots);
      }
    } catch (err) {
      console.error('[EditorControls] Error toggling visibility:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => target.classList.add('dragging'), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
    setDragIndex(null);
    setDragOverIndex(null);

    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      return;
    }

    const reordered = [...sortedSlots];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dragOverIndex, 0, moved);

    const updatedSlots = reordered.map((slot, i) => ({
      ...slot,
      sort_order: i,
    }));

    onUpdateSlots(updatedSlots);

    const supabase = createSupabaseClient();
    if (supabase) {
      updatedSlots.forEach(async (slot) => {
        await supabase
          .from('banner_slots')
          .update({ sort_order: slot.sort_order })
          .eq('id', slot.id);
      });
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const uploadToR2 = async (file: File): Promise<string | null> => {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID as string;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID as string;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string;
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME as string;
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string;

    const s3AccessKeyId = import.meta.env.VITE_S3_ACCESS_KEY_ID as string || import.meta.env.VITE_TEBI_ACCESS_KEY_ID as string;
    const s3SecretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY as string || import.meta.env.VITE_TEBI_SECRET_ACCESS_KEY as string;
    const s3BucketName = import.meta.env.VITE_S3_BUCKET_NAME as string || import.meta.env.VITE_TEBI_BUCKET_NAME as string;
    const s3Endpoint = import.meta.env.VITE_S3_ENDPOINT as string || import.meta.env.VITE_TEBI_ENDPOINT as string;
    const s3PublicUrl = import.meta.env.VITE_S3_PUBLIC_URL as string || import.meta.env.VITE_TEBI_PUBLIC_URL as string;
    const s3Region = import.meta.env.VITE_S3_REGION as string || 'global';

    const isR2Configured = accountId && accessKeyId && secretAccessKey && bucketName && publicUrl;
    const isS3Configured = s3AccessKeyId && s3SecretAccessKey && s3BucketName && s3Endpoint;

    if (!isR2Configured && !isS3Configured) {
      console.warn('[EditorControls] Storage env vars missing — logo upload disabled');
      return null;
    }

    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      let s3;
      let finalBucket;
      let finalKey;
      let finalUrl;

      if (isR2Configured) {
        s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        finalBucket = bucketName;
        finalKey = `logos/${store?.id || 'unknown'}/${Date.now()}-${file.name}`;
        finalUrl = `${publicUrl}/${finalKey}`;
      } else {
        s3 = new S3Client({
          region: s3Region,
          endpoint: s3Endpoint,
          credentials: {
            accessKeyId: s3AccessKeyId,
            secretAccessKey: s3SecretAccessKey,
          },
        });
        finalBucket = s3BucketName;
        finalKey = `logos/${store?.id || 'unknown'}/${Date.now()}-${file.name}`;
        finalUrl = s3PublicUrl 
          ? `${s3PublicUrl}/${finalKey}` 
          : `${s3Endpoint}/${s3BucketName}/${finalKey}`;
      }

      await s3.send(
        new PutObjectCommand({
          Bucket: finalBucket,
          Key: finalKey,
          Body: file,
          ContentType: file.type || 'image/webp',
        })
      );

      return finalUrl;
    } catch (err) {
      console.error('[EditorControls] Logo S3 upload error:', err);
      return null;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;

    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToR2(compressed);

      if (url) {
        const supabase = createSupabaseClient();
        if (supabase) {
          const { error } = await supabase
            .from('stores')
            .update({ logo_url: url })
            .eq('id', store.id);

          if (!error) {
            onUpdateStore({ ...store, logo_url: url });
          }
        }
      }
    } catch (err) {
      console.error('[EditorControls] Logo upload error:', err);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoRemove = async () => {
    if (!store) return;
    const supabase = createSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('stores')
        .update({ logo_url: null })
        .eq('id', store.id);

      if (!error) {
        onUpdateStore({ ...store, logo_url: null });
      }
    } catch (err) {
      console.error('[EditorControls] Logo remove error:', err);
    }
  };

  const renderDragHandle = () => (
    <div className="banner-slot-drag-handle" aria-label="اسحب لإعادة الترتيب">
      <div className="banner-slot-drag-handle-dots">
        <span className="banner-slot-drag-handle-dot" />
        <span className="banner-slot-drag-handle-dot" />
      </div>
      <div className="banner-slot-drag-handle-dots">
        <span className="banner-slot-drag-handle-dot" />
        <span className="banner-slot-drag-handle-dot" />
      </div>
      <div className="banner-slot-drag-handle-dots">
        <span className="banner-slot-drag-handle-dot" />
        <span className="banner-slot-drag-handle-dot" />
      </div>
    </div>
  );

  if (editingSlot) {
    return (
      <div className="editor-controls-panel">
        <BannerSlotEditor
          slot={editingSlot}
          storeId={store?.id || ''}
          onBack={handleBackFromEditor}
          onUpdateSlot={handleSlotUpdate}
        />
      </div>
    );
  }

  return (
    <div className="editor-controls-panel">
      <div className="editor-section">
        <div className="editor-section-title">
          <span className="editor-section-title-icon">🏪</span>
          شعار المتجر
        </div>

        {store?.logo_url ? (
          <div className="logo-preview">
            <div className="logo-preview-image-wrapper">
              <img
                className="logo-preview-image"
                src={store.logo_url}
                alt="شعار المتجر"
              />
            </div>
            <div className="logo-preview-actions">
              <button
                className="logo-change-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? 'جاري الرفع...' : 'تغيير الشعار'}
              </button>
              <button
                className="logo-remove-btn"
                onClick={handleLogoRemove}
                disabled={uploadingLogo}
              >
                إزالة الشعار
              </button>
            </div>
          </div>
        ) : (
          <div
            className="logo-upload-area"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="رفع شعار المتجر"
          >
            <div className="logo-upload-icon">📷</div>
            <div className="logo-upload-text">
              {uploadingLogo ? 'جاري رفع الشعار...' : 'اضغط لرفع شعار المتجر'}
            </div>
            <div className="logo-upload-hint">PNG أو WebP — بحد أقصى 200 كيلوبايت</div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      <div className="editor-section">
        <div className="editor-section-title">
          <span className="editor-section-title-icon">📌</span>
          أقسام المتجر
        </div>

        {sortedSlots.length === 0 ? (
          <div className="editor-empty-state">
            <div className="editor-empty-state-icon">📋</div>
            <div className="editor-empty-state-text">لا توجد أقسام بعد</div>
          </div>
        ) : (
          sortedSlots.map((slot, index) => {
            const isAutoDiscount = slot.slot_type === 'auto_discount';
            const productCount = isAutoDiscount
              ? discountedProducts.length
              : slot.product_ids.length;

            return (
              <div
                key={slot.id}
                className={`banner-slot-row${
                  dragOverIndex === index && dragIndex !== index ? ' drag-over' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onClick={() => handleSlotClick(slot.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSlotClick(slot.id);
                }}
                aria-label={`قسم ${slot.title}`}
              >
                {renderDragHandle()}

                <div className="banner-slot-info">
                  <div className="banner-slot-title">{slot.title}</div>
                  <div className="banner-slot-meta">
                    {isAutoDiscount
                      ? `${productCount} منتج مخفض`
                      : `${productCount} منتج مختار`}
                  </div>
                </div>

                <span
                  className={`banner-slot-type-badge${
                    isAutoDiscount ? ' auto-discount' : ''
                  }`}
                >
                  {isAutoDiscount ? 'تخفيضات تلقائية' : 'يدوي'}
                </span>

                <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="toggle-switch-input"
                    type="checkbox"
                    checked={slot.is_visible}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(
                        e as unknown as React.MouseEvent,
                        slot.id,
                        slot.is_visible
                      );
                    }}
                    aria-label={`إظهار ${slot.title}`}
                  />
                  <span className="toggle-switch-track" />
                  <span className="toggle-switch-thumb" />
                </label>
              </div>
            );
          })
        )}
      </div>

      <button
        className="preview-toggle-btn"
        onClick={onPreviewToggle}
        aria-label="معاينة المتجر"
      >
        👁
      </button>
    </div>
  );
}
