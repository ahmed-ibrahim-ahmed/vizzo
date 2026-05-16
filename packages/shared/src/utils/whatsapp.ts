/**
 * @vizzo/shared — WhatsApp Payload Builder
 * Constructs the wa.me deep link at dispatch time using live-hydrated data.
 * No cached or stale price may enter the serialized payload (Data Flow Invariant #6).
 */

import { SUDAN_COUNTRY_CODE, MAX_NOTES_LENGTH } from '../constants/index.js';

interface WhatsAppItem {
  name: string;
  price: number;
  variant?: string;
  quantity: number;
}

/**
 * Serializes cart items into the SRS §4.7 template format
 * and returns the full wa.me deep link URL.
 *
 * Template:
 * مرحباً، أود إتمام هذا الطلب من متجرك:
 * 1x [name] - [variant]
 * السعر: [price]
 * الإجمالي: [total]
 * ملاحظات: [notes]
 * [storeUrl]
 */
export function buildWhatsAppPayload(
  items: WhatsAppItem[],
  total: number,
  notes: string,
  storeUrl: string,
  merchantNumber: string
): string {
  // Enforce notes length limit
  const trimmedNotes = notes.slice(0, MAX_NOTES_LENGTH);

  const itemLines = items
    .map((item) => {
      const variantPart = item.variant ? ` - ${item.variant}` : '';
      return `${item.quantity}x ${item.name}${variantPart}`;
    })
    .join('\n');

  const message = [
    'مرحباً، أود إتمام هذا الطلب من متجرك:',
    itemLines,
    `السعر: ${total}`,
    `الإجمالي: ${total}`,
    `ملاحظات: ${trimmedNotes}`,
    storeUrl,
  ].join('\n');

  const encoded = encodeURIComponent(message);

  // Ensure merchant number has +249 prefix (AP-14)
  const normalizedNumber = merchantNumber.startsWith('+')
    ? merchantNumber
    : `${SUDAN_COUNTRY_CODE}${merchantNumber}`;

  return `https://wa.me/${normalizedNumber.replace('+', '')}?text=${encoded}`;
}
