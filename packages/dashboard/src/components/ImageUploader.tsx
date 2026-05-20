/**
 * @vizzo/dashboard — ImageUploader Component
 * Drag-and-drop image upload with compressImage() pipeline → R2 upload.
 * Free tier: max 2 images. Pro tier: max 5 images.
 * Shows compressed preview thumbnails with remove and progress indicators.
 */

import { useState, useRef, useCallback } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

/**
 * Client-side high-efficiency image transcoding & center cropping.
 * Strips all metadata, resizes to exactly 800x800px, and transcodes to WebP at 80% quality.
 * Serves as Option A: Pure client-side Canvas optimization.
 */
function compressAndCropToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const cropSize = Math.min(img.width, img.height);
        const cropX = (img.width - cropSize) / 2;
        const cropY = (img.height - cropSize) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(img.src);
          reject(new Error('Could not get canvas 2D context'));
          return;
        }

        // Draw image onto canvas center-cropped and scaled to 800x800
        ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, 800, 800);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to JPEG if WebP is not supported by legacy environments
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve(jpegBlob);
                  } else {
                    reject(new Error('Canvas image export failed'));
                  }
                },
                'image/jpeg',
                0.8
              );
            }
          },
          'image/webp',
          0.8
        );
      } catch (err) {
        URL.revokeObjectURL(img.src);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image file: ' + err));
    };
  });
}

async function uploadToS3(file: Blob, originalName: string): Promise<string> {
  const r2AccountId = import.meta.env.VITE_R2_ACCOUNT_ID as string | undefined;
  const r2AccessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID as string | undefined;
  const r2SecretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string | undefined;
  const r2BucketName = import.meta.env.VITE_R2_BUCKET_NAME as string | undefined;
  const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;

  const tebiAccessKeyId = import.meta.env.VITE_TEBI_ACCESS_KEY_ID as string | undefined;
  const tebiSecretAccessKey = import.meta.env.VITE_TEBI_SECRET_ACCESS_KEY as string | undefined;
  const tebiBucketName = import.meta.env.VITE_TEBI_BUCKET_NAME as string | undefined;
  const tebiEndpoint = import.meta.env.VITE_TEBI_ENDPOINT as string | undefined;
  const tebiPublicUrl = import.meta.env.VITE_TEBI_PUBLIC_URL as string | undefined;

  const isR2Configured = r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName && r2PublicUrl;
  const isTebiConfigured = tebiAccessKeyId && tebiSecretAccessKey && tebiBucketName && tebiEndpoint;

  if (!isR2Configured && !isTebiConfigured) {
    console.warn('[ImageUploader] Missing both Cloudflare R2 and Tebi.io env configurations. Falling back to temporary Object URL.');
    return URL.createObjectURL(file);
  }

  let s3;
  let finalBucket;
  let finalKey;
  let finalUrl;

  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "");
  const key = `products/${crypto.randomUUID()}-${baseName}.webp`;

  if (isR2Configured) {
    s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
    finalBucket = r2BucketName;
    finalKey = key;
    finalUrl = `${r2PublicUrl}/${key}`;
  } else {
    s3 = new S3Client({
      region: 'global',
      endpoint: tebiEndpoint,
      credentials: {
        accessKeyId: tebiAccessKeyId,
        secretAccessKey: tebiSecretAccessKey,
      },
    });
    finalBucket = tebiBucketName;
    finalKey = key;
    finalUrl = tebiPublicUrl ? `${tebiPublicUrl}/${key}` : `${tebiEndpoint}/${tebiBucketName}/${key}`;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: finalBucket,
      Key: finalKey,
      Body: file,
      ContentType: 'image/webp'
    })
  );

  return finalUrl;
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

      // Process uploaded images sequentially
      let currentImages = [...images];
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const uploadId = newUploading[i].id;

        try {
          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 30 } : u))
          );

          // Phase 4 Canvas optimization: center-crop 800x800px & transcode to WebP 80%
          const optimizedBlob = await compressAndCropToWebP(file);

          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 60 } : u))
          );

          // Phase 4 S3 Upload: Direct S3/R2 Upload pipeline
          const url = await uploadToS3(optimizedBlob, file.name);

          setUploading((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 90 } : u))
          );

          currentImages = [...currentImages, url];
          onImagesChange(currentImages);

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
