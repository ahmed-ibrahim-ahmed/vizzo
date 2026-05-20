# SYSTEM_ARCHITECTURE.md — Vizzo Platform

> Canonical reference for all engineering decisions. No code may be generated that contradicts a rule in this document.

---

## [TECH_STACK]

| Layer | Technology | Pinned Version | Role |
|---|---|---|---|
| Runtime | Node.js | ≥ 22.x LTS | Build tooling & SSR functions |
| Build / Dev | Vite | 8.0.x (Rolldown bundler) | CSR app bundling, dev server, HMR |
| UI Library | React | 19.2.x | Component rendering (CSR & SSR) |
| Routing (CSR) | React Router | 7.15.x | Client-side hash/browser routing |
| State (Buyer) | Local Storage API | Native | Cart persistence (IDs + quantities only) |
| Auth Provider | Supabase Auth (Google OAuth 2.0) | @supabase/supabase-js 2.105.x | Merchant authentication & JWT session |
| Database | Supabase PostgreSQL | Managed (latest) | Source of Truth for all entities |
| Object Storage | Tebi.io | S3-compatible API | Geo-distributed S3-compatible data lake via @aws-sdk/client-s3 |
| Edge Hosting | Cloudflare Pages | Managed service | Static asset delivery & SSR functions |
| CLI / Deploy | Wrangler | 4.x | Cloudflare Pages management |
| Image Compression (Client) | browser-image-compression | 2.0.x | Pre-upload compression ≤ 200 KB |
| Image Delivery (Server) | Node.js (Server-Side) + Sharp | — | Metadata stripping, resize to 800x800px, WebP transcoding @ 80% quality, ≈ 40 KB output, direct S3 upload to Tebi.io |
| CSS | Vanilla CSS (custom properties) | — | No Tailwind, no CSS-in-JS |
| Language | TypeScript (strict mode) | 5.x | All application code |

### Approved Auxiliary Libraries (exhaustive — nothing outside this list)

| Package | Purpose |
|---|---|
| `react-router-dom` | DOM bindings for React Router |
| `@supabase/supabase-js` | Supabase client (auth, db, storage) |
| `@aws-sdk/client-s3` | Tebi.io uploads via S3-compatible API |
| `browser-image-compression` | Client-side image compression before upload |
| `sharp` | Server-side image optimization, EXIF stripping, and WebP transcoding |
| `vite-plugin-pwa` | Progressive Web App manifest & service worker (if required) |

> **Adding any library not listed above requires explicit human approval before code generation.**

---

## [DATA_MUTATION_RULES]

### Monorepo Boundary Ledger

```
vizzo1/
├── packages/
│   ├── shared/                    ← SHARED / CORE ZONE
│   │   ├── types/                 # TypeScript interfaces & enums
│   │   ├── constants/             # Hardcoded strings, limits, country codes
│   │   ├── utils/                 # Pure functions (price calc, slug generator, payload serializer)
│   │   └── supabase/              # Supabase client factory, typed query helpers
│   │
│   ├── landing/                   ← APPLICATION ZONE (CSR)
│   │   ├── src/
│   │   │   ├── components/        # Landing page spatial funnel blocks
│   │   │   ├── assets/            # Static images, fonts
│   │   │   ├── styles/            # Vanilla CSS (design tokens + component styles)
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   ├── dashboard/                 ← APPLICATION ZONE (CSR)
│   │   ├── src/
│   │   │   ├── components/        # Merchant dashboard UI components
│   │   │   ├── hooks/             # Custom React hooks (auth, inventory, subscriptions)
│   │   │   ├── pages/             # Route-level page components
│   │   │   ├── styles/            # Vanilla CSS
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   ├── storefront/                ← APPLICATION ZONE (CSR root + SSR product routes)
│   │   ├── src/
│   │   │   ├── components/        # Buyer-facing storefront components
│   │   │   ├── hooks/             # Cart, search, infinite scroll hooks
│   │   │   ├── pages/             # Route-level page components
│   │   │   ├── styles/            # Vanilla CSS
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── functions/             # Cloudflare Pages Functions (SSR for /product/:id)
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── admin/                     ← APPLICATION ZONE (CSR Admin SPA)
│       ├── src/
│       │   ├── components/        # Admin UI, Auth/Whitelist Gate, ReceiptViewer
│       │   ├── pages/             # Operations dashboard, store directory, ledger
│       │   ├── styles/            # Vanilla CSS (admin theme styling)
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       └── vite.config.ts
│
├── supabase/
│   └── migrations/                # SQL migration files (sequential, versioned)
│
├── SYSTEM_ARCHITECTURE.md         ← This file
├── PROJECT_MAP.md                 ← Task DAG
├── package.json                   # Workspace root (npm workspaces)
└── tsconfig.base.json             # Shared TS config extended by each package
```

### Zone Rules

| Zone | May import from `shared/` | May import from other app zones | Mutates DB directly | Owns routes |
|---|---|---|---|---|
| `shared/` | Self only | **NO** | **NO** (provides query helpers only) | None |
| `landing/` | Yes | **NO** | **NO** (read-only; auth delegated to Supabase OAuth redirect) | `vizzotrade.com` |
| `dashboard/` | Yes | **NO** | **YES** (merchant CRUD, subscription mutations) | `app.vizzotrade.com` |
| `storefront/` | Yes | **NO** | **NO** (read-only; cart is Local Storage only) | `vizzotrade.com/:store-slug` |
| `admin/` | Yes | **NO** | **YES** (admin whitelist verification, store suspensions, BOK subscription approvals/rejections) | `admin.vizzotrade.com` |

### Data Flow Invariants

1. **Source of Truth**: Supabase PostgreSQL is the single source of truth for all product, merchant, and subscription data. No derived state stored elsewhere may contradict it.
2. **Local Storage Schema (Buyer Cart)**: The buyer cart stored in `localStorage` must contain **only** the following shape per item and nothing else:
   ```ts
   interface CartItem {
     product_id: string;   // UUID
     quantity: number;      // integer, 1–15
     variant?: string;      // cosmetic variant label (e.g., color string)
   }
   ```
   Product names, prices, and image URLs are **prohibited** from Local Storage. They are hydrated at render time via a Supabase query keyed by `product_id`.
3. **Price Computation**: All price totals are computed client-side **after** fetching real-time prices from Supabase. The `discount_price` field takes precedence over `base_price` when `is_discounted === true`.
4. **Image Pipeline**: 
   1. Upload path: Client compress (≤ 200 KB) via `browser-image-compression` → Vizzo Node.js Backend. 
   2. Processing path: Backend executes `sharp` pipeline (strip EXIF, resize to 800x800px, WebP format @ 80% quality) yielding ≈ 40 KB payload → Upload to Tebi.io via S3 SDK. 
   3. Delivery path: Tebi.io Edge Node → Buyer browser.
5. **Soft Delete Only**: Products are never hard-deleted. Merchant "delete" sets `is_archived = true`. Merchant "out of stock" sets `is_available = false`. Both states preserve the DB row for SEO tombstoning.
6. **WhatsApp Payload**: The `wa.me` deep link is constructed **exclusively** at dispatch time using live-hydrated data. No cached or stale price may enter the serialized payload.

---

## [ANTI_PATTERNS]

### Strictly Prohibited Practices

| # | Anti-Pattern | Rationale |
|---|---|---|
| AP-01 | **Storing product names, prices, or image URLs in Local Storage** | Enables client-side price tampering; violates Dynamic State Hydration protocol. |
| AP-02 | **Using standard HTML `<form>` elements for authentication** | Auth is Google OAuth 2.0 via Supabase only. No email/password flows exist. |
| AP-03 | **Hard-deleting database rows (products, merchants, orders)** | Destroys SEO equity and breaks historical WhatsApp deep links. Soft-delete exclusively. |
| AP-04 | **Synchronous logging or telemetry in the render path** | Blocks rendering; increases Largest Contentful Paint. All logging must be fire-and-forget (`queueMicrotask` or `requestIdleCallback`). |
| AP-05 | **CSS loading spinners or progress bars during lazy-load** | SRS mandates Skeleton Screens exclusively for perceived latency compression. |
| AP-06 | **Price-mutating product variants (e.g., 128GB vs 256GB as one entity)** | Creates checkout complexity. Different storage capacities = different product rows via Rapid Clone Engine. |
| AP-07 | **Importing between application zones (`landing/` ↔ `dashboard/` ↔ `storefront/`)** | Violates monorepo boundary ledger. Share only via `shared/` package. |
| AP-08 | **Using Stripe, PayPal, or any external payment gateway** | Payment is manual bank transfer via Bankak. No programmatic payment processing. |
| AP-09 | **Rendering the discount banner when `is_discounted` items count === 0** | Must set `display: none` to prevent dead UI zones. |
| AP-10 | **Allowing cart arrays > 15 unique items or notes > 150 characters** | Prevents `wa.me` URL exceeding legacy mobile browser byte limits. |
| AP-11 | **Using Tailwind CSS, styled-components, or any CSS-in-JS library** | Stack mandates Vanilla CSS with custom properties exclusively. |
| AP-12 | **Generating `// TODO`, stub functions, or placeholder files** | All emitted code must be complete and functional. |
| AP-13 | **Over-abstracting single-use logic into separate files** | Simplicity first. Generalize only when a pattern appears ≥ 3 times. |
| AP-14 | **Allowing the WhatsApp routing number to omit the `+249` prefix** | Hardcoded, immutable prefix enforced at the DOM level. |
| AP-15 | **Rendering an HTTP 404 for archived/unavailable products** | Must render Tombstone UI (grayscale card + "نفد من المخزون" badge + similar products grid). |
| AP-16 | **Search latency > 50ms per keystroke** | Client-side regex against pre-loaded JSON array; no server round-trip per keystroke. |
| AP-17 | **Using `window.location` for in-app navigation within CSR boundaries** | Must use React Router programmatic navigation to prevent full page reloads. |
| AP-18 | **Omitting `safe-area-inset-bottom` on cart modal CSS** | Prevents iOS/Android nav bar occlusion of the cart UI. |

---

## Rendering Topology Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge & Infrastructure Topology                       │
│                                                                                     │
│  vizzotrade.com            → Landing SPA (CSR, static)                              │
│  app.vizzotrade.com        → Dashboard SPA (CSR, static)                            │
│  vizzotrade.com/:slug      → Storefront root (CSR)                                  │
│  vizzotrade.com/:slug/p/:id → Product page (SSR via Cloudflare Pages Function)       │
│  admin.vizzotrade.com      → Admin SPA (CSR, static)                                │
│                                                                                     │
│  Node.js Backend           → Image processing (Sharp) & Tebi.io S3 upload pipeline  │
│  Tebi.io Data Lake         → Geo-distributed Image assets (S3-compatible)           │
│  Supabase                  → Auth + PostgreSQL + Realtime                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### SSR Product Route Contract

The SSR function at `/functions/product/[id].ts` must:
1. Fetch product data from Supabase by `product_id`.
2. Inject `og:title`, `og:image`, `og:description` meta tags into the HTML `<head>`.
3. Return fully-rendered HTML for WhatsApp/social media link preview scraping.
4. If `is_archived === true` or `is_available === false`, render Tombstone UI with proper meta tags (no 404 status code; return 200 with tombstone markup).
