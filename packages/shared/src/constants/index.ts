/**
 * @vizzo/shared — Constants
 * All hardcoded values for the Vizzo Platform.
 * Adding values not listed here requires explicit human approval.
 */

/** Sudan country code — immutable prefix enforced at DOM level (AP-14) */
export const SUDAN_COUNTRY_CODE = '+249';

/** Maximum unique cart items (AP-10) */
export const MAX_CART_ITEMS = 15;

/** Maximum notes length in characters (AP-10) */
export const MAX_NOTES_LENGTH = 150;

/** Maximum image size in bytes — 200KB compression target */
export const MAX_IMAGE_SIZE_BYTES = 204800;

/** Free tier product limit */
export const FREE_TIER_PRODUCT_LIMIT = 20;

/** Free tier images per product */
export const FREE_TIER_IMAGE_LIMIT = 2;

/** Pro tier images per product */
export const PRO_IMAGE_LIMIT = 5;

/** Default discount duration in days */
export const DEFAULT_DISCOUNT_DAYS = 7;

/** Infinite scroll batch size */
export const PRODUCT_BATCH_SIZE = 20;

/** Search latency budget in ms (AP-16) */
export const SEARCH_LATENCY_BUDGET_MS = 50;

/** WebP output quality for Cloudflare Image Transformations */
export const WEBP_QUALITY = 0.8;

/** Watermark text for free-tier stores */
export const WATERMARK_TEXT = 'تم إنشاء هذا المتجر مجاناً عبر Vizzotrade';

/** Category labels (Arabic) */
export const CATEGORIES: Record<string, string> = {
  phones: 'هواتف',
  laptops: 'اجهزة لابتوب و ديسكتوب',
  accessories: 'ملحقات',
} as const;

/** Availability labels (Arabic) */
export const AVAILABILITY_LABELS = {
  available: 'متوفر',
  out: 'نفد',
} as const;

/** Pricing tiers with Arabic labels */
export const PRICING = {
  monthly: {
    label: 'الشهري (10 دولارات / صائد المترددين)',
    usd: 10,
  },
  quarterly: {
    label: 'الربع سنوي (25 دولاراً / الرهان الآمن)',
    usd: 25,
  },
  annual: {
    label: 'السنوي (80 دولاراً / البقرة الحلوب)',
    usd: 80,
  },
} as const;

/** Bank details for manual transfer (placeholders) */
export const BANK_DETAILS = {
  bank: 'Bank of Khartoum',
  beneficiary: '[Placeholder — replace with real beneficiary name]',
  account: '[Placeholder — replace with real account number]',
} as const;

// ─── Landing Page UI Strings (SRS §2) ────────────────────────────────

export const LANDING_STRINGS = {
  heroTitle: 'حول فوضى الواتساب إلى متجر احترافي في 10 ثوانٍ',
  heroSubtitle: 'نظم مخزونك، استقبل طلباتك مباشرة على الواتساب، وضاعف مبيعاتك دون أي خبرة برمجية',
  ctaGoogle: 'المتابعة باستخدام حساب Google',
  navFeatures: 'المميزات',
  navPricing: 'الأسعار',
  navLogin: 'تسجيل الدخول',
  painPoint1: 'هل تتعب من الرد على (بكم هذا) يومياً؟',
  painPoint2: 'كم بيعة خسرت لأن المشتري لم يعرف أن المنتج متوفر؟',
  painPoint3: 'صور منتجاتك تضيع في زحمة المجموعات؟',
  freeTierTitle: 'الباقة المجانية',
  proTierTitle: 'الباقة الاحترافية (باقة التاجر المعتمد)',
  annualBadge: 'الأكثر شعبية/الأوفر',
  paymentNotice: 'تطبيق بنكك',
  finalCtaText: 'ابدأ تنظيم متجرك الآن مجاناً، وقم بالترقية عندما تكبر مبيعاتك.',
} as const;

// ─── Dashboard UI Strings (SRS §3) ───────────────────────────────────

export const DASHBOARD_STRINGS = {
  loginWelcome: 'نظم مبيعاتك في ثوانٍ',
  onboardingStoreName: 'اسم المتجر',
  onboardingSlug: 'vizzotrade.com/',
  onboardingWhatsapp: 'رقم استقبال الطلبات',
  onboardingSubmit: 'إنشاء المتجر والانطلاق',
  navProducts: 'المنتجات',
  navStorefront: 'المتجر',
  navSettings: 'الإعدادات',
  upgradeCta: 'الترقية الى برو',
  freeBadge: 'مجاني',
  proBadge: 'برو',
  searchPlaceholder: 'بحث سريع',
  filterAll: 'الكل',
  filterPhones: 'الهواتف فقط',
  filterAccessories: 'الملحقات فقط',
  filterComputers: 'اجهزة الكمبيوتر',
  actionEdit: 'تعديل',
  actionDiscount: 'إدارة التخفيض',
  actionClone: 'نسخ',
  actionDelete: 'حذف',
  cloneLabel: 'استنساخ المنتج',
  deleteConfirm: 'هل أنت متأكد؟ سيتم إخفاء المنتج نهائياً من المتجر',
  toggleAvailable: 'متوفر',
  toggleUnavailable: 'نفد',
  toggleTooltip: 'تبديل الحالة يخفي المنتج من المتجر دون حذفه',
  discountOriginal: 'السعر الأصلي الحالي',
  discountNew: 'سعر التخفيض',
  discountError: 'سعر التخفيض يجب أن يكون أقل من السعر الأصلي',
  discountDuration: 'هذا التخفيض يستمر لمدة :',
  discountDays: 'ايام',
  billingPending: 'قيد المراجعة',
  billingSend: 'إرسال الإشعار وتأكيد الدفع',
  slugWarning: 'تنبيه: تغيير الرابط سيؤدي إلى تعطل جميع الروابط القديمة التي قمت بمشاركتها مع عملائك في الواتساب أو الفيسبوك',
  locationPlaceholder: 'الخرطوم , سوق كذا , بالقرب من كذا',
  deleteAccountConfirm1: 'هل أنت متأكد أنك تريد حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه',
} as const;

// ─── Storefront UI Strings (SRS §4) ──────────────────────────────────

export const STOREFRONT_STRINGS = {
  searchPlaceholder: 'ابحث عن منتج...',
  noSearchResults: 'لم نجد',
  askMerchant: 'اسأل التاجر عن هذا المنتج عبر الواتساب',
  backToBrowse: 'العودة للتصفح',
  tombstoneBadge: 'نفد من المخزون',
  similarProducts: 'منتجات مشابهة متوفرة حالياً',
  cartNotes: 'الملاحظات',
  sendOrder: 'إرسال الطلب',
  emptyStore: 'المنتجات قيد التحديث، تواصل معنا للاستفسار',
  storeNotFound: 'هذا المتجر غير موجود',
  filterAll: 'الكل',
  filterPhones: 'هواتف',
  filterLaptops: 'أجهزة لابتوب',
  filterAccessories: 'ملحقات',
  sortNewest: 'الأحدث',
  sortLowest: 'أقل سعر',
  sortHighest: 'أعلى سعر',
  discountBanner: 'عروض اليوم',
  noDiscounts: 'لا توجد منتجات مخفضة حالياً',
  addToCart: 'أضف للسلة',
} as const;

// ─── Product Form Strings ─────────────────────────────────────────────

export const PRODUCT_FORM_STRINGS = {
  productName: 'اسم المنتج',
  basePrice: 'السعر الأساسي',
  categoryLabel: 'الفئة',
  categoryPhones: 'هواتف',
  categoryLaptops: 'اجهزة لابتوب و ديسكتوب',
  categoryAccessories: 'ملحقات',
  brand: 'الماركة',
  storageCapacity: 'السعة',
  storageType: 'نوع السعة',
  ram: 'الرامات',
  color: 'اللون',
  condition: 'الحالة',
  conditionNew: 'جديد',
  conditionUsed: 'مستعمل',
  processor: 'المعالج',
  gpu: 'كرت شاشة',
  gpuInternal: 'داخلي',
  gpuExternal: 'خارجي',
  gpuNone: 'غير متوفر',
  notes: 'الملاحظات',
  addAttribute: 'إضافة ميزة إضافية',
  storageHdd: 'HDD',
  storageSsd: 'SSD',
} as const;
