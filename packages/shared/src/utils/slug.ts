/**
 * @vizzo/shared — Slug Generator
 * Converts Arabic store names to URL-safe slugs.
 */

// Arabic-to-English transliteration map
const ARABIC_MAP: Record<string, string> = {
  'أ': 'a', 'إ': 'a', 'آ': 'a', 'ا': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd',
  'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w',
  'ي': 'y', 'ى': 'a',
  'ة': 'a', 'ؤ': 'o',
  'ئ': 'a', 'ء': '',
};

/**
 * Generates a URL-safe slug from an Arabic store name.
 * - Transliterates Arabic characters to English
 * - Converts spaces to hyphens
 * - Strips special characters
 * - Lowercases the result
 * - Collapses multiple hyphens
 */
export function generateSlug(arabicName: string): string {
  return arabicName
    .trim()
    .split('')
    .map((char) => {
      if (ARABIC_MAP[char] !== undefined) return ARABIC_MAP[char];
      if (char === ' ') return '-';
      if (/[a-zA-Z0-9]/.test(char)) return char.toLowerCase();
      return '';
    })
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
