/**
 * @vizzo/dashboard — ImageUploader Component
 * Drag-and-drop image upload with compressImage() pipeline → R2 upload.
 * Free tier: max 2 images. Pro tier: max 5 images.
 * Shows compressed preview thumbnails with remove and progress indicators.
 */

import { useState, useRef, useCallback } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { compressImage } from '@vizzo/shared';
import '../styles/productform.css';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages: number;
}

interface UploadingImage {
  id: string;
  preview: string;
  progress: number;
}

async function uploadToR2(file: File): Promise<string> {
  const accountId = import.meta.env.R2_ACCOUNT_ID as string | undefined;
  const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID as string | undefined;
  const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY as string | undefined;
  const bucketName = import.meta.env.R2_BUCKET_NAME as string | undefined;
  const publicUrl = import.meta.env.R2_PUBLIC_URL as string | undefined;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return URL.createObjectURL(file);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `products/${crypto.randomUUID()}-${file.name}`;
  await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: file }));
  return `${publicUrl}/${key}`;
}

export default function ImageUploader({ images, onImagesChange, maxImages }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState<UploadingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAtLimit = images.length + uploading.length >= maxImages;

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length - uploading.length;
      if (remaining <= 0) return;

      const filesToProcess = fileArray.slice(0, remaining);

      const newUploading: UploadingImage[] = filesToProcess.map((file) => ({
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
        progress: 10,
      }));

      setUploading((prev) => [...prev, ...newUploading]);

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const uploadId = newUploading[i].id;

        try {
          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 30 } : u))
          );

          const compressed = await compressImage(file);

          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 60 } : u))
          );

          const url = await uploadToR2(compressed);

          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 90 } : u))
          );

          onImagesChange([...images, url]);

          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u))
          );
        } catch (err) {
          console.error('[ImageUploader] Upload failed:', err);
        } finally {
          setTimeout(() => {
            setUploading((prev) => {
              const item = prev.find((u) => u.id === uploadId);
              if (item) {
                URL.revokeObjectURL(item.preview);
              }
              return prev.filter((u) => u.id !== uploadId);
            });
          }, 300);
        }
      }
    },
    [images, onImagesChange, maxImages, uploading.length]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAtLimit) {
        setIsDragOver(true);
      }
    },
    [isAtLimit]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isAtLimit) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [isAtLimit, processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const updated = [...images];
      updated.splice(index, 1);
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  const handleClick = useCallback(() => {
    if (!isAtLimit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isAtLimit]);

  return (
    <div className="form-group">
      <div
        className={`image-upload-zone ${isDragOver ? 'image-upload-zone-dragover' : ''} ${isAtLimit ? 'image-upload-zone-disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <svg
          className="image-upload-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="image-upload-text">
          {isAtLimit ? `تم الوصول للحد الأقصى (${maxImages} صور)` : 'اضغط أو اسحب الصور هنا'}
        </span>
        <span className="image-upload-limit">
          {images.length + uploading.length} / {maxImages}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        aria-hidden="true"
      />

      {(images.length > 0 || uploading.length > 0) && (
        <div className="image-previews">
          {images.map((url, index) => (
            <div key={`img-${index}`} className="image-preview-item">
              <img src={url} alt={`صورة المنتج ${index + 1}`} />
              <button
                className="image-preview-remove"
                onClick={() => handleRemoveImage(index)}
                aria-label={`إزالة الصورة ${index + 1}`}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
          {uploading.map((u) => (
            <div key={u.id} className="image-preview-item">
              <img src={u.preview} alt="جاري الرفع..." />
              <div className="upload-progress">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
