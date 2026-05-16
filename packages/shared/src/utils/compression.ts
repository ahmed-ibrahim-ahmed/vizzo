/**
 * @vizzo/shared — Image Compression Utility
 * Client-side image compression before upload to R2.
 * Uses browser-image-compression library.
 * Rejects if output still exceeds 200KB (MAX_IMAGE_SIZE_BYTES).
 */

import imageCompression from 'browser-image-compression';
import { MAX_IMAGE_SIZE_BYTES } from '../constants/index.js';

/**
 * Compresses an image file to ≤ 200KB before upload.
 * Config: maxSizeMB: 0.2, maxWidthOrHeight: 1920, useWebWorker: true.
 * Rejects if output still exceeds 200KB.
 */
export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  if (compressed.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Compressed image still exceeds ${MAX_IMAGE_SIZE_BYTES} bytes (${compressed.size} bytes). Try a smaller or simpler image.`
    );
  }

  return compressed;
}
