# skills.md — Vizzo Platform Swarm Constitution & Mini-Manual

> **Authority Level**: ABSOLUTE. This document is the binding constitution for all 300 agents in the Vizzo Swarm. No code may be generated that contradicts a rule herein. When this document conflicts with an agent's prior assumptions, **this document wins**.
>
> **How to Use This Manual**: This manual is structured as a series of self-contained modules, each governing a distinct architectural domain. Orchestration logic may inject only the relevant module(s) to a specific agent based on its assignment. However, **every agent MUST read the Core Baseline (Modules 0–1) before any other module**. These contain the physics of the environment — the invariants that apply universally regardless of task assignment.

---

## MODULE 0: CORE BASELINE — ENVIRONMENTAL PHYSICS

### 0.1 Tech Stack (Immutable)

| Layer | Technology | Pinned Version | Constraint |
|---|---|---|---|
| Runtime | Node.js | ≥ 22.x LTS | Build tooling & SSR functions |
| Build / Dev | Vite | 8.0.x (Rolldown) | CSR bundling, HMR |
| UI Library | React | 19.2.x | Component rendering |
| Routing (CSR) | React Router | 7.15.x | Hash/browser routing only |
| Auth | Supabase Auth (Google OAuth 2.0) | @supabase/supabase-js 2.105.x | No email/password flows |
| Database | Supabase PostgreSQL | Managed | Single source of truth |
| Object Storage | Tebi.io | S3-compatible via @aws-sdk/client-s3 | Image assets |
| Edge Hosting | Cloudflare Pages → **Workers with Static Assets** | Managed | SSR + static delivery |
| CLI / Deploy | Wrangler | 4.x | Deployment management |
| Image Compression | browser-image-compression | 2.0.x | ≤ 200 KB pre-upload |
| Image Delivery | Tebi.io Edge CDN | Managed | Pre-optimized WebP @ 80%, ≈ 40 KB output |
| CSS | Vanilla CSS (custom properties) | — | **NO Tailwind, NO CSS-in-JS** |
| Language | TypeScript (strict mode) | 5.x | All application code |
| Runtime Validation | Zod | Latest stable | Schema-first contract layer |
| Monorepo Boundary | Nx enforce-module-boundaries | Latest stable | Import prohibition |
| Type Generation | supabase gen types typescript | Latest | Generated, never hand-written |
| Breaking Change | @microsoft/api-extractor + @changesets/cli | Latest | API surface tracking |

### 0.2 Approved Auxiliary Libraries (Exhaustive)

`react-router-dom`, `@supabase/supabase-js`, `@aws-sdk/client-s3`, `browser-image-compression`, `vite-plugin-pwa`, `zod`, `@tanstack/react-virtual`, `dompurify`

> **Adding any library not listed requires explicit human approval before code generation.**

### 0.3 Monorepo Boundary Ledger

```
packages/
├── shared/                    ← SHARED / CORE ZONE (Common Types, Constants, Utilities)
├── landing/                   ← APPLICATION ZONE (Landing Page Funnel SPA)
├── dashboard/                 ← APPLICATION ZONE (Merchant Control Panel SPA)
├── storefront/                ← APPLICATION ZONE (Buyer Shop SPA & Pages Functions SSR)
└── admin/                     ← APPLICATION ZONE (Platform Administrator Command Center SPA)
```

### 0.4 Zone Isolation (Zero-Tolerance)

| Zone | Import from `shared/` | Import from other apps | Mutate DB | Owns Routes |
|---|---|---|---|---|
| `shared/` | Self only | **NO** | **NO** | None |
| `landing/` | Yes | **NO** | **NO** | `vizzotrade.com` |
| `dashboard/` | Yes | **NO** | **YES** | `app.vizzotrade.com` |
| `storefront/` | Yes | **NO** | **NO** | `vizzotrade.com/:slug` |
| `admin/` | Yes | **NO** | **YES** | `admin.vizzotrade.com` |

> **Cross-zone import = CI failure. No exceptions. No warnings. No bypass.**

### 0.5 Rendering Topology

```
vizzotrade.com           → Landing SPA (CSR, static)
app.vizzotrade.com       → Dashboard SPA (CSR, static)
vizzotrade.com/:slug     → Storefront root (CSR)
vizzotrade.com/:slug/p/:id → Product page (SSR via Cloudflare Worker)
admin.vizzotrade.com     → Admin SPA (CSR, static)
Tebi.io Bucket           → Image assets (WebP pipeline)
Supabase                 → Auth + PostgreSQL + Realtime
```

---

## MODULE 1: CORE BASELINE — UNIVERSAL INVARIANTS

These rules apply to **every agent** regardless of module assignment. Violation is a build-breaking error.

### INV-01: Source of Truth

Supabase PostgreSQL is the single source of truth for all product, merchant, and subscription data. No derived state stored elsewhere may contradict it. Local Storage cart data is advisory only — prices are hydrated at render time from Supabase.

### INV-02: Soft Delete Only

Products are never hard-deleted. Merchant "delete" sets `is_archived = true`. "Out of stock" sets `is_available = false`. Both preserve the row for SEO tombstoning and WhatsApp deep link integrity.

### INV-03: Price Computation

All price totals are computed client-side **after** fetching real-time prices from Supabase. `discount_price` takes precedence over `base_price` when `is_discounted === true`. No price may be cached in Local Storage or used for checkout without server-side verification.

### INV-04: WhatsApp Payload

The `wa.me` deep link is constructed **exclusively** at dispatch time using live-hydrated data. No cached or stale price may enter the serialized payload. The `+249` prefix is hardcoded and immutable at the DOM level.

### INV-05: No Placeholders

All emitted code must be complete and functional. No `// TODO`, no stub functions, no placeholder files, no speculative "just in case" code.

### INV-06: Simplicity First

Generalize only when a pattern appears ≥ 3 times. If a task can be achieved in 50 lines instead of 200, write the 50. Over-abstracting single-use logic into separate files is prohibited.

### INV-07: Style Matching

When editing existing code, strictly adhere to the established codebase style — even if you deem it sub-optimal. Touch only what is necessary. Do not reformat adjacent code, rewrite old comments, or refactor working code unless explicitly requested.

### INV-08: Logging

All logging must be asynchronous: `queueMicrotask()` or `requestIdleCallback()`. Synchronous logging or telemetry in the render path is prohibited — it blocks rendering and increases Largest Contentful Paint.

### INV-09: Skeleton Screens Only

CSS loading spinners or progress bars during lazy-load are prohibited. SRS mandates Skeleton Screens exclusively for perceived latency compression.

### INV-10: Cart Array Limits

Cart arrays MUST NOT exceed 15 unique items. Notes MUST NOT exceed 150 characters. These limits prevent `wa.me` URL from exceeding legacy mobile browser byte limits.

---

## MODULE 2: [SECURITY] — Client-Side State & Tamper Resistance

### SEC-01: Server Is the Sole Price Authority

Cart state in LocalStorage may ONLY contain `{ product_id: UUID, quantity: integer 1-15, variant?: string }`. Product names, prices, and image URLs are **prohibited** from Local Storage. They are hydrated at render time via a Supabase query keyed by `product_id`. This is AP-01 from SYSTEM_ARCHITECTURE.md and is non-negotiable.

**Attack vector mitigated**: Direct DevTools price manipulation, XSS-based cart modification, malicious browser extension injection (CVE-2025-56426, CVE-2026-21447). Research confirms that any e-commerce platform trusting client-side prices for checkout is vulnerable to the six canonical price manipulation patterns: hidden parameter tampering, negative quantity attacks, currency manipulation, discount stacking, product ID swapping, and race condition exploitation.

### SEC-02: HMAC-SHA256 Signing of Cart State

Every cart payload written to LocalStorage MUST be HMAC-SHA256 signed by the server. The signature is verified server-side at checkout. If verification fails, the cart is discarded and rebuilt from server state. Pattern:

```
Cart add → POST /api/cart {productId, quantity}
Server validates → signs cart state → returns {items, signature, timestamp}
Client stores signed payload
Checkout → Server verifies HMAC → re-fetches prices from DB → processes
```

**Never store unsigned cart data.** The `priceSnapshot` field in the signed payload is display-only — the server **never** uses it for checkout calculation.

### SEC-03: No Sensitive Data in LocalStorage

No authentication tokens, no PII, no payment data in LocalStorage. Follow OWASP WSTG-CLNT-12: use HttpOnly, Secure, SameSite cookies for session tokens. LocalStorage is accessible to any XSS vulnerability and any browser extension with `host_permissions`. The December 2024 Cyberhaven supply-chain attack compromised 16 Chrome extensions affecting 3.2M+ users — design all security controls assuming the browser environment is compromised.

### SEC-04: XSS Prevention — DOMPurify Mandatory

`dangerouslySetInnerHTML` is forbidden without DOMPurify sanitization. Zero exceptions. All HTML rendered from CMS, product descriptions, or user input must pass through DOMPurify with a strict allowlist:

```typescript
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3'],
  ALLOWED_ATTR: []
});
```

No `<script>`, no event handlers, no `javascript:` URIs. Code review must flag any `dangerouslySetInnerHTML` without DOMPurify.

### SEC-05: Strict Content-Security-Policy

Deploy CSP with nonce-based script loading:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{SERVER_GENERATED_NONCE}';
  style-src 'self';
  img-src 'self' https://cdn.vizzo.com data:;
  font-src 'self';
  connect-src 'self' https://api.vizzo.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

No `unsafe-inline`, no `unsafe-eval`. Vanilla CSS eliminates the need for `unsafe-inline` in `style-src` — this is a major security advantage that must not be compromised by adding CSS-in-JS libraries (AP-11).

### SEC-06: Server-Side Cart Reconstruction at Checkout

At checkout, the server rebuilds cart from IDs, fetches current prices, verifies stock availability, and creates a checkout session with server-authoritative total. The checkout token is short-lived and HMAC-signed. Payment uses this token — never client-submitted data.

### SEC-07: Price Change Notification Protocol

If a product's price changes between cart-add and checkout, the server MUST return `PRICE_CHANGED` with the new price. The client must display a confirmation dialog. Never silently accept a price difference. Implement a 15-minute price freeze window after cart creation for high-demand items.

---

## MODULE 2: [DB_PERFORMANCE] — Supabase RLS & PostgreSQL Scaling

### DBP-01: Every Column in a USING Clause Must Be Indexed

Every column referenced in an RLS policy's `USING` expression MUST have a corresponding index. No exceptions. Without an index, the planner falls back to a sequential scan. Under RLS, this is catastrophic — the policy is evaluated per-row, making an unindexed column an O(n²) operation.

| Column Use Case | Index Type | Example |
|---|---|---|
| `user_id = auth.uid()` | B-tree | `CREATE INDEX ON orders(user_id)` |
| Composite conditions | Composite B-tree | `CREATE INDEX ON orders(tenant_id, user_id)` |
| Array contains (`@>`) | GIN | `CREATE INDEX ON items USING gin(tags)` |
| Filtering subset of rows | Partial | `CREATE INDEX ON orders(tenant_id) WHERE status = 'active'` |
| FK in policy subquery | B-tree on FK | `CREATE INDEX ON team_members(team_id)` |

### DBP-02: No Subqueries in USING Clauses

Never write `EXISTS` or `IN (SELECT ...)` directly in a policy's `USING` clause. RLS policies are rewritten into WHERE conditions evaluated **for every candidate row**. A subquery in a policy becomes N subqueries per query. Benchmarks show this degrades from 51ms to 8,100ms (159× slower) on 1M rows — the planner abandons index scans entirely.

**Instead**: Create `SECURITY DEFINER STABLE` functions that return the needed value set:

```sql
CREATE FUNCTION auth_helpers.get_user_team_ids() RETURNS uuid[]
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT array_agg(team_id) FROM team_members WHERE user_id = auth.uid();
$$;

CREATE POLICY "team_access" ON orders
  FOR SELECT TO authenticated
  USING (team_id = ANY(SELECT auth_helpers.get_user_team_ids()));
```

### DBP-03: Wrap Security Definer Functions in SELECT

When using a function in a policy that returns a fixed value per query, wrap it in `SELECT` to signal the planner it is a constant subquery. This enables single evaluation and caching. Supabase benchmarks show **94.74% performance improvement** with this pattern.

```sql
-- FORBIDDEN: per-row evaluation
USING (team_id = ANY(get_user_team_ids()))

-- REQUIRED: single evaluation
USING (team_id = ANY(SELECT auth_helpers.get_user_team_ids()))
```

### DBP-04: Never Join More Than One Table in a Policy

RLS policies must never contain joins across more than one table. Multi-hop joins in policies create nested per-row evaluation with O(rows_A × rows_B × rows_C) cost. If you need data from related tables, use a `SECURITY DEFINER` function that performs the join internally — the function runs as its creator, bypassing RLS on referenced tables.

### DBP-05: Mark Policy Functions as STABLE

All functions used in RLS policies must declare the correct volatility. `STABLE` if the result doesn't change within a single query. `IMMUTABLE` if it never changes. Without `STABLE`, the planner may re-evaluate the function for every row, destroying performance.

### DBP-06: Always Use `TO authenticated` in Policies

Every RLS policy must specify `TO authenticated` (or a specific role). Never create policies without a role target — they apply to all roles including `anon` and `public`, creating a silent security hole.

### DBP-07: FORCE ROW LEVEL SECURITY on All Sensitive Tables

Every table with RLS must also run `ALTER TABLE ... FORCE ROW LEVEL SECURITY`. Without this, table owners bypass RLS silently, creating false security during testing.

### DBP-08: Use Transaction-Local `set_config`

When setting tenant/user context for RLS via `set_config`, ALWAYS use the third parameter `true` to make it transaction-local. Without this, settings persist across transactions. In transaction-mode pooling (Supavisor), the next transaction may be a different user on the same pooled connection — causing **cross-tenant data leaks**.

```sql
-- FORBIDDEN: Session-level (leaks across transactions in pooler)
SELECT set_config('app.tenant_id', 'uuid', false);

-- REQUIRED: Transaction-local
SELECT set_config('app.tenant_id', 'uuid', true);
```

### DBP-09: Place SECURITY DEFINER Functions in Private Schema

All SECURITY DEFINER functions used in RLS policies must be created in a schema NOT in the API schema search path (e.g., `auth_helpers`). This prevents direct API invocation of security-sensitive functions via PostgREST.

### DBP-10: EXPLAIN ANALYZE Before Merge

No RLS policy may be merged without verifying its query plan uses an **Index Scan** (or Bitmap Index Scan), never a Sequential Scan. If the plan shows `Seq Scan`, the policy must be rewritten before merging. Use the Supabase Performance Advisor to automate this check.

### DBP-11: Materialized Views for Analytics Only

Use materialized views only for analytics/reporting dashboards where stale data is acceptable. For transactional operations (cart, checkout, inventory), use SECURITY DEFINER functions and proper indexing. MVs return data as of last refresh — dangerous for inventory. `CONCURRENTLY` allows reads during refresh but is slower.

---

## MODULE 3: [DOM_PERFORMANCE] — Rendering & Virtualization

### DOM-01: Virtualize All Catalog Lists Beyond 50 Items

Use TanStack Virtual v3 for any list exceeding 50 items. DOM node count must stay below 1,500 total per page (Lighthouse threshold). Infinite scroll catalogs MUST use virtualization, not naive append. Each product card component must be wrapped in `React.memo` (or rely on the React Compiler for automatic memoization).

**The O(n) problem**: Without virtualization, scrolling to product 1000 means React maintains 1000 component instances and 15,000-30,000 DOM nodes. Every re-render touches reconciliation of all mounted components. Windowing/virtualization reduces this to O(viewport) — ~20-50 DOM nodes regardless of catalog size.

### DOM-02: Use `startTransition` for Catalog Data Fetching

Wrap all product data fetches triggered by scroll/pagination in `startTransition`. These are lower priority than user interactions (add to cart, filter changes). Never block the main thread with synchronous catalog state updates.

### DOM-03: React 19 Actions for Cart Mutations

Use React 19's `useActionState` for cart mutations. It provides automatic pending state, error handling, and optimistic updates. The `useOptimistic` hook gives instant cart feedback — but **never optimistically update prices**. Only product IDs and quantities may be updated optimistically.

### DOM-04: Search Latency ≤ 50ms Per Keystroke

Client-side regex against pre-loaded JSON array. No server round-trip per keystroke. If the catalog exceeds what can be held in memory, implement debounced server search with a minimum 300ms debounce interval — but the regex search on pre-loaded data must remain under 50ms.

### DOM-05: `safe-area-inset-bottom` on Cart Modal

Omitting this causes iOS/Android nav bar occlusion of the cart UI (AP-18). Apply `padding-bottom: env(safe-area-inset-bottom)` to the cart modal overlay.

### DOM-06: React Compiler

React Compiler 1.0 is stable and provides automatic memoization, enhancing performance by up to 12%. It makes `useMemo`/`useCallback` largely unnecessary. Do not add manual memoization unless the compiler fails to optimize a specific case — verify with React DevTools Profiler first.

### DOM-07: Skeleton Screens, Not Spinners

All loading states must use Skeleton Screens (AP-05). CSS loading spinners or progress bars during lazy-load are prohibited. Skeleton screens provide perceived latency compression without indicating an indeterminate wait time.

---

## MODULE 4: [EDGE_SSR] — Cloudflare Worker Constraints & Caching

### EDGE-01: CPU Time Budget ≤ 20ms Per SSR Request

The Free plan allows 10ms CPU; Paid defaults to 30 seconds. For production SSR, target under 20ms CPU time per request. CPU time does NOT include I/O wait (fetch, DB queries). Exceeding limits returns Error 1102. Monitor CPU time via Wrangler logs and dashboard metrics.

### EDGE-02: Memory Budget ≤ 10MB Per Request

Isolate memory limit is 128MB shared across concurrent requests on the same isolate. Never call `await response.text()` or `await response.arrayBuffer()` on large responses. Always stream with `TransformStream` or pass `response.body` directly. Product page HTML should be under 500KB. Product data JSON should be under 1MB.

### EDGE-03: Zero Global Mutable State

Workers reuse isolates across requests. A module-level `let` variable set during request A bleeds into request B. This causes data leaks AND memory leaks (growing arrays/maps never get GC'd). Pass all state through function arguments or the `env` object. Only module-level `const` for immutable configuration is acceptable.

### EDGE-04: Single Data Fetch per Page Render

Never make sequential fetches to Supabase for a single page render. A product page that fetches product → variants → reviews → inventory as 4 separate requests has 4× the network round-trip latency. Instead, create a Supabase RPC function that returns all data in one call, or use PostgREST joins: `.select('*, variants(*), inventory(*)')`.

### EDGE-05: Use Hyperdrive for Database Connections

Direct Postgres connections from Workers incur 300-500ms connection setup overhead per request (TCP + TLS + auth). Hyperdrive eliminates this by pooling connections near the database. First query per request typically 20-50ms for the query itself. Requires `nodejs_compat` compatibility flag.

### EDGE-06: Cache Everything with Stale-While-Revalidate

Every SSR product page response MUST be cached at the edge:

```
Cache-Control: public, s-maxage=300, stale-while-revalidate=86400
Cache-Tag: product-{slug}
```

Use `ctx.waitUntil(cache.put(key, response.clone()))` for non-blocking cache writes. Use `Cache-Tag` for targeted invalidation. **Critical**: Cache API contents do NOT replicate across data centers — a `cache.put()` in LHR doesn't appear in SFO. Handle cache warming or accept cold-cache first requests per PoP.

### EDGE-07: Stream Responses — Never Buffer HTML in Memory

Always stream the HTML response. Even if generating the full HTML string, use `new Response(html, headers)` rather than building a massive buffer. For large responses, use `TransformStream` to pipe data through without buffering. This reduces peak memory and improves TTFB.

### EDGE-08: Use Workers (Not Pages Functions) for New Projects

Pages Functions are in maintenance mode. Workers with Static Assets is the recommended platform. Workers provide Durable Objects, Queues, Workflows, Service Bindings, full observability, and active feature development. Pages Functions share billing but lack critical features.

### EDGE-09: Graceful Degradation — Always Have a Fallback

If the Supabase fetch fails or times out, return a cached version (stale) or a skeleton page with client-side data fetching. Never return a raw error page to a shopper:

```typescript
try {
  data = await fetchProduct(slug);
} catch {
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  return renderSkeletonPage(slug); // Client-side hydration will retry
}
```

### EDGE-10: Embed Product Data as JSON in HTML

After SSR, embed product data as `<script type="application/json" id="product-data">` in the HTML. The client-side hydration script reads this data instead of making a second API call. This eliminates the "SSR then refetch" anti-pattern and ensures the hydrated client has identical data to what was rendered server-side.

### EDGE-11: SSR Product Route Contract

The SSR function at `/functions/product/[id].ts` must:
1. Fetch product data from Supabase by `product_id`.
2. Inject `og:title`, `og:image`, `og:description` meta tags into `<head>`.
3. Return fully-rendered HTML for WhatsApp/social media link preview scraping.
4. If `is_archived === true` or `is_available === false`, render Tombstone UI with proper meta tags (no 404 status code; return 200 with tombstone markup). Rendering an HTTP 404 for archived/unavailable products is AP-15.

---

## MODULE 5: [CONCURRENCY] — Race Conditions & Inventory Control

### CON-01: Atomic Inventory Updates Only

NEVER use separate SELECT then UPDATE for inventory. Always use the atomic CAS (Compare-And-Swap) pattern:

```sql
UPDATE inventory
SET available_stock = available_stock - $1,
    version = version + 1
WHERE product_id = $2
  AND available_stock >= $1
RETURNING product_id, available_stock, version;
```

If 0 rows returned → insufficient stock. If 1 row returned → success with new stock value. This eliminates the entire class of read-modify-write race conditions in a single SQL statement.

### CON-02: Idempotency Keys on All Mutations

Every cart operation and order submission MUST include an idempotency key. The server checks the `idempotency_keys` table before processing. Duplicate keys return cached responses. Keys expire after 24 hours. Client-side generation format:

```typescript
`${action}_${sessionId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
```

### CON-03: Optimistic for Cart, Pessimistic for Checkout

- **Add to cart**: Use optimistic CAS (single atomic UPDATE). Non-blocking, no connection holding.
- **Checkout**: Use `SELECT FOR UPDATE` within a transaction that locks all involved inventory rows. Critical section, sub-second duration.
- Never mix these — optimistic for the 99% path, pessimistic for the critical 1%.

### CON-04: Stock Separation — Available vs. Reserved

The `inventory` table MUST track `available_stock` and `reserved_stock` separately. When a user adds to cart, `available_stock` decrements and `reserved_stock` increments. On checkout, `reserved_stock` decrements. On reservation expiry, stock moves back from `reserved_stock` to `available_stock`.

```sql
CREATE TABLE inventory (
  product_id UUID PRIMARY KEY,
  available_stock INTEGER NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
  reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  sold_stock INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### CON-05: Reservation Expiry with Automatic Release

Cart reservations MUST have an `expires_at` timestamp (default: 15 minutes). A background job (pg_cron) runs every minute to release expired reservations:

```sql
WITH expired AS (
  SELECT product_id, SUM(quantity) as total_quantity
  FROM cart_reservations WHERE expires_at < now() GROUP BY product_id
)
UPDATE inventory
SET available_stock = available_stock + expired.total_quantity,
    reserved_stock = reserved_stock - expired.total_quantity,
    version = version + 1
FROM expired
WHERE inventory.product_id = expired.product_id;

DELETE FROM cart_reservations WHERE expires_at < now();
```

### CON-06: Optimistic UI Rollback Within 200ms

When a server rejects an optimistic update, the UI MUST rollback within 200ms and show a specific user-friendly message. Error code taxonomy:

| Error Code | UI Response |
|---|---|
| `INSUFFICIENT_STOCK` | "Sorry, this item just sold out!" + disable button |
| `STOCK_CHANGED` | Show new quantity + re-confirm |
| `CONCURRENT_MODIFICATION` | Refresh cart state |
| `RESERVATION_EXPIRED` | "Your reservation expired" + retry option |
| `PRICE_CHANGED` | Show new price + confirmation dialog |

After rollback, invalidate the inventory cache for that product via `queryClient.invalidateQueries()`.

### CON-07: Realtime Is a Hint, Not a Guarantee

Supabase Realtime updates are **eventual consistency hints** for the UI. They MUST NOT be used for business logic. Realtime latency is 50-200ms (DB → logical replication → Realtime server → WebSocket → client). The ONLY source of truth is the PostgreSQL `inventory` table via atomic SQL operations. Always verify at the point of mutation.

### CON-08: WebSocket Connection Budget ≤ 80%

Supabase Realtime Pro plan limit: 500 concurrent connections per project. Vizzo MUST implement:
- **Channel multiplexing**: One channel for all visible inventory, not one per product.
- **Connection budget**: Never exceed 400 connections (80% of 500).
- **Polling fallback**: When approaching limit, fall back to HTTP polling at 2s intervals.
- **CDN-cached inventory snapshots**: For massive scale (50K+ viewers), cache at CDN edge with 1s TTL.

Scaling tiers:
```
Tier 1 (0-500 users):  Direct Realtime WebSockets
Tier 2 (500-5K):       Multiplexing + Broadcast + polling fallback
Tier 3 (5K-50K):       CDN-cached inventory API + polling
Tier 4 (50K+):         Custom Realtime server + CDN + snapshots
```

### CON-09: Never Trust Client-Side Data for Inventory Decisions

The client MUST NOT compute stock availability from cached data. The server MUST re-validate stock on every mutation endpoint. Price, stock, and availability sent from the client are advisory only. This prevents price manipulation and stock exploitation attacks.

### CON-10: All Inventory Changes Must Be Auditable

Every stock change MUST be logged to an `inventory_audit_log` table with: `product_id`, `change_type`, `quantity_before`, `quantity_after`, `delta`, `user_id`, `order_id`, `idempotency_key`, `created_at`. This enables debugging of race conditions and provides an audit trail for disputes.

---

## MODULE 6: [CAT] — Continuous Agentic Testing & Adversarial QA

### CAT-01: Maker/Checker Architecture — Mandatory Separation

Builder agents (Makers) write code. QA agents (Checkers) validate code. These MUST use different model configurations or prompting strategies to avoid shared blind spots. A Maker agent must never validate its own output. A Checker agent must never modify production code.

**Architecture**:

```
Builder Agent → code submission → Integration Queue
                                        ↓
                               Checker Agent (adversarial)
                                        ↓
                               Test Runner (sandboxed)
                                        ↓
                          ┌─── PASS ──→ Merge Queue ──→ Main Branch
                          └─── FAIL ──→ Rejection + Bug Report → Builder
```

### CAT-02: Execution-Grounded Verification

No PR may be merged based on static review alone. Every code submission MUST pass execution-grounded verification: tests are actually run in an isolated environment, and their pass/fail results are the gate. "Looks correct" from an LLM is insufficient. The test runner output is the single source of truth for merge eligibility.

### CAT-03: Adversarial QA — Minimum 3 Edge-Case Tests Per Function

QA agents MUST generate at least 3 edge-case tests per function/method beyond the happy path. These tests must target:
- Boundary conditions (empty arrays, max quantities, zero prices)
- Error conditions (network failure, DB timeout, invalid input)
- Concurrency scenarios (simultaneous cart adds, race conditions)

QA agents must be explicitly incentivized to **find bugs**, not to confirm correctness. Mutation testing with StrykerJS (30+ mutation operators for TypeScript) provides a minimum 60% mutation score requirement.

### CAT-04: Isolated Sandbox Per Agent — Zero Cross-Agent Leakage

Each agent operates in an isolated test environment:
- **Testcontainers** for database isolation (ephemeral PostgreSQL per agent)
- **MSW** (Mock Service Worker) for external API mocking
- **Docker sandbox** for execution isolation
- **PostgreSQL snapshots** for fast state reset between tests

Cross-agent state leakage is classified as a CRITICAL bug. No agent may read or modify another agent's test environment during execution.

### CAT-05: Merge Queue with 5-Dimension Quality Gate

Code is blocked from integration until it passes ALL five quality dimensions:

| Dimension | Tool | Threshold |
|---|---|---|
| Static Analysis | ESLint + TypeScript strict | Zero errors |
| Unit/Integration Tests | Vitest | 100% pass rate |
| Mutation Testing | StrykerJS | ≥ 60% mutation score |
| Contract Testing | Zod + API Extractor | Zero schema violations |
| Visual Regression | Playwright `toHaveScreenshot()` | Zero visual diffs on intentional changes |

The merge queue serializes PRs and batches up to 100 PRs for CI efficiency. Tools: Graphite, Mergify, or Aviator.

### CAT-06: TDD Enforcement — Test Before Code

For every feature, the QA agent generates the test specification BEFORE the Builder agent writes implementation code. The test must fail initially (confirming it tests something real), then pass after implementation. This prevents the "write code then write tests that pass" anti-pattern.

### CAT-67: Visual Regression for All UI Changes

Every UI component change MUST include a visual regression test using Playwright's built-in `toHaveScreenshot()`. For Storybook-based development, Chromatic provides zero-config visual regression. No UI PR may merge without visual diff approval.

### CAT-08: Continuous Benchmark Validation

A held-out "golden test set" of integration tests runs on every merge to main. These tests represent critical user journeys (add to cart → checkout → WhatsApp dispatch) and must never regress in performance or correctness. If a golden test fails, the merge is automatically reverted and the responsible agent is notified.

### CAT-09: Regression Detection on Every Merge

After every merge to main, a full regression suite runs against the entire codebase. If any test that previously passed now fails, the merge is flagged and a bug report is auto-generated for the responsible Builder agent. The agent must fix the regression before any new feature work.

### CAT-10: No Orphan Code — State Synchronization

Every agent MUST update `PROJECT_MAP.md` after completing its task. Any unlinked feature must appear in `[ORPHANS & PENDING]` immediately and be removed upon completion. Code deprecated by a change must be resolved or logged in the pending section. No "mess" is left behind.

---

## MODULE 7: [CONTRACT] — Type-Safe Boundary Enforcement

### CTR-01: Zod Schema Is Source of Truth, TypeScript Types Are Derived

Zod schemas in `@vizzo/shared/types` are the authoritative contract. TypeScript types must be derived via `z.infer<>`. Never hand-write TypeScript interfaces for API boundaries or database entities and then try to retroactively create validators.

```typescript
// CORRECT: Schema first, type derived
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(500),
  price: z.number().positive().multipleOf(0.01),
});
export type Product = z.infer<typeof ProductSchema>;

// FORBIDDEN: Type first, no runtime validation
export interface Product { id: string; name: string; price: number; }
```

### CTR-02: Validate at Every Trust Boundary

Every incoming API request, event payload, and database query result MUST be validated with Zod at the point of entry. No data crosses a service boundary without validation. Compile-time types alone are insufficient — they are erased at runtime.

```typescript
// CORRECT: Validate at boundary
const order = CreateOrderSchema.parse(req.body); // Throws on invalid

// FORBIDDEN: Trust unvalidated input
const order: CreateOrder = req.body; // No runtime check!
```

### CTR-03: No Cross-Zone Imports

A service MUST NOT import from another service's package. All inter-service communication flows through `@vizzo/shared/types` (for contracts) or via API calls (for runtime).

**Enforcement**: Three layers — all must be active:
1. **ESLint `no-restricted-imports`**: Baseline prohibition.
2. **Nx `enforce-module-boundaries`**: Tag-based scope + type constraints.
3. **TypeScript Project References**: Compilation-level dependency DAG enforcement.

### CTR-04: Database Types Are Generated, Never Hand-Written

All TypeScript types representing database entities MUST be generated via `supabase gen types typescript`. Hand-written database types are forbidden. If the generated types need augmentation, use type utilities — never edit the generated file directly.

**CI enforcement**: A scheduled job (every 6 hours + on migration PRs) regenerates types and diffs against committed versions. Any mismatch fails CI.

### CTR-05: Every Change to Shared Types Requires a Changeset

No PR modifying `packages/shared/` may be merged without an accompanying changeset file declaring the semver impact (major/minor/patch) and describing the change. CI checks for changeset file presence — PR is blocked without it.

### CTR-06: Breaking Changes Fail CI Until Acknowledged

If `@microsoft/api-extractor` detects a breaking change to the public API surface of `@vizzo/shared/types`, CI fails. The breaking change can only proceed if:
1. The changeset declares `major` semver bump.
2. All downstream consumers pass type-checking against the new types.
3. A human reviews and approves the `*.api.md` diff.

### CTR-07: Schema Drift Triggers Immediate Alert and Quarantine

**Runtime validation failure** (Zod parse error in production):
1. Log with full payload and schema violation details.
2. Report to `#vizzo-schema-alerts` Slack channel.
3. If failure rate exceeds 10 per 60 seconds → circuit-breaker mode.

**DB-to-TS drift detected** by scheduled CI check:
1. Auto-generated PR with updated types.
2. GitHub issue filed with `schema-deviation` label.
3. PR cannot merge until all downstream type-checks pass.

### CTR-08: Shared Types Package Has Zero Upward Dependencies

`@vizzo/shared/types` MUST NOT import from any other `@vizzo/*` package. It may only depend on `zod`, standard library types, and approved utility types. Enforcement: TypeScript project references + Nx boundary rules.

### CTR-09: API Responses Include Schema Version Metadata

Every API response MUST include an `X-Schema-Version` header matching the version of `@vizzo/shared/types` used to validate the response. This enables consumers to detect version mismatches without deep inspection.

### CTR-10: Deviation Protocol — Detect → Quarantine → Notify → Resolve

| Scenario | Auto-resolve? | CI Block? | Escalate? |
|---|---|---|---|
| New DB column, types not regenerated | Yes | Yes | No |
| DB column removed | No — manual | Yes | Slack |
| API field renamed | No — manual | Yes | Slack + PagerDuty |
| API field added (non-breaking) | Yes | No | Log only |
| Shared type field removed | No — changeset required | Yes | All channels |

**Never silently accept invalid data.** If Zod validation fails at a trust boundary, return `422 Unprocessable Entity` with validation error details. Never partially apply.

---

## MODULE 8: [ANTI_PATTERNS] — Prohibited Practices Quick Reference

This module consolidates all anti-patterns from SYSTEM_ARCHITECTURE.md and the security/performance analysis. Violation is a build-breaking error.

| ID | Anti-Pattern | Rationale |
|---|---|---|
| AP-01 | Storing prices, names, or image URLs in Local Storage | Enables price tampering; violates Dynamic State Hydration |
| AP-02 | Using `<form>` for authentication | Auth is Google OAuth 2.0 only. No email/password flows |
| AP-03 | Hard-deleting database rows | Destroys SEO equity and WhatsApp deep links |
| AP-04 | Synchronous logging in render path | Blocks rendering; increases LCP |
| AP-05 | CSS loading spinners during lazy-load | Skeleton Screens exclusively |
| AP-06 | Price-mutating product variants | Different capacities = different product rows |
| AP-07 | Cross-zone imports | Violates monorepo boundary ledger |
| AP-08 | External payment gateways (Stripe, PayPal) | Manual bank transfer via Bankak only |
| AP-09 | Discount banner with 0 discounted items | Must `display: none` |
| AP-10 | Cart > 15 items or notes > 150 chars | `wa.me` URL byte limits |
| AP-11 | Tailwind CSS, styled-components, CSS-in-JS | Vanilla CSS with custom properties only |
| AP-12 | `// TODO`, stubs, placeholders | All code must be complete and functional |
| AP-13 | Over-abstracting single-use logic | Generalize only at ≥ 3 occurrences |
| AP-14 | WhatsApp number without `+249` prefix | Hardcoded, immutable at DOM level |
| AP-15 | HTTP 404 for archived/unavailable products | Tombstone UI with 200 status |
| AP-16 | Search latency > 50ms per keystroke | Client-side regex against pre-loaded JSON |
| AP-17 | `window.location` for in-app CSR navigation | React Router programmatic navigation only |
| AP-18 | Missing `safe-area-inset-bottom` on cart modal | iOS/Android nav bar occlusion |
| AP-19 | Unsigned cart data in Local Storage | Must be HMAC-SHA256 signed by server |
| AP-20 | `dangerouslySetInnerHTML` without DOMPurify | XSS vulnerability — zero exceptions |
| AP-21 | Mutable global state in Workers | Isolate reuse causes data leaks between requests |
| AP-22 | Sequential DB fetches in SSR | Must batch into single RPC or joined query |
| AP-23 | Separate SELECT then UPDATE for inventory | Must use atomic CAS pattern |
| AP-24 | Trusting Realtime for business logic | Realtime is a hint; verify at mutation time |
| AP-25 | Skipping Zod validation at trust boundaries | Compile-time types are erased at runtime |

---

## MODULE 9: [AGENT_PROTOCOLS] — Swarm Operational Mechanics

### AP-9.1 Planning Protocol

Before writing any code, every agent must:
1. **Read `PROJECT_MAP.md`** to understand current project state and dependencies.
2. **Identify affected files** precisely — no speculative changes.
3. **Define a "Success Criterion"** for every feature before coding.
4. **Resolve ambiguities** by halting and seeking clarification — never select a path silently.
5. **Propose the simplest solution** — reject unnecessary complexities.

### AP-9.2 Execution Protocol

1. **Execute → Verify → Update Map** — continuous cycle until task complete.
2. **Zero speculative programming** — no "just in case" code.
3. **Production-ready quality** — complete, error-handled, integrated with logging.
4. **Write tests first** — TDD for every component (test → fail → implement → pass).
5. **Clean up orphan code** caused by your implementation — no mess left behind.
6. **Verify no regressions** — run affected test suites after every change.
7. **Update `PROJECT_MAP.md`** dynamically — any unlinked feature goes to `[ORPHANS & PENDING]`.

### AP-9.3 Surgical Editing Protocol

When modifying existing code:
1. **Minimal intervention** — touch only what is necessary.
2. **Style matching** — adhere to existing codebase style.
3. **Isolated cleanup** — remove only orphans created by your specific change.
4. **Read `PROJECT_MAP.md` first** — precisely identify affected files.
5. **Apply TDD** — write the test, confirm failure, ensure success.

### AP-9.4 Agent Error Prevention

Common implementation errors agents must guard against:
- **Feature creep**: Implement only what is specified. No extra features.
- **Boundary violations**: Never import across application zones.
- **Price in client storage**: Only `product_id`, `quantity`, `variant` — never prices.
- **Hard deletes**: Always use soft delete (`is_archived`, `is_available`).
- **Unindexed RLS**: Every column in a policy's USING clause must have an index.
- **Global mutable state in Workers**: Request-scoped data must never live at module scope.
- **Skipping validation**: Zod must validate at every trust boundary.
- **Optimistic prices**: Never optimistically update price data in the UI.

### AP-9.5 Inter-Agent Communication

- **Worklog**: Every agent MUST append its work record to `/home/z/my-project/worklog.md` after completing a task.
- **State sync**: Before starting work, read the worklog to understand what previous agents have done.
- **No direct agent-to-agent communication**: All coordination flows through `PROJECT_MAP.md` and the orchestration layer.
- **Conflict resolution**: If two agents modify the same file, the merge queue resolves conflicts. If conflicts cannot be auto-resolved, the second agent must rebase and re-test.

---

## APPENDIX A: RLS Performance Quick Reference

| Pattern | Performance | Verdict |
|---|---|---|
| `user_id = auth.uid()` + B-tree index | ~1μs overhead | ✅ Use everywhere |
| `tenant_id = ANY(SELECT sec_definer_fn())` + index | ~10-50μs overhead | ✅ Multi-tenant |
| `EXISTS (SELECT ... JOIN)` in policy | 100-8000ms | ❌ Never |
| Unindexed column in policy | Full table scan | ❌ Fatal |
| Non-LEAKPROOF function + RLS | Prevents index usage | ⚠️ Mark LEAKPROOF if safe |
| `set_config(..., false)` with pooler | Cross-tenant data leak | ❌ Fatal security bug |
| SECURITY DEFINER function unwrapped | Per-row evaluation | ⚠️ Wrap in SELECT |
| Materialized view for transactional data | Stale reads | ❌ Analytics only |

## APPENDIX B: Edge SSR Resource Limits

| Resource | Free Plan | Paid Plan |
|---|---|---|
| CPU time per request | 10ms | 30s default, up to 5min |
| Memory per isolate | 128MB | 128MB |
| Subrequests per request | 50 | 10,000 |
| Simultaneous outgoing connections | 6 | 6 |
| Worker size | 3MB | 10MB |
| Cold start P99 | <3ms | <3ms |

## APPENDIX C: Supabase Realtime Limits

| Resource | Free | Pro |
|---|---|---|
| Concurrent connections | 200 | 500 |
| Messages per second | 100 | 500 |
| Channels per client | 100 | 100 |
| Postgres Changes latency | 50-200ms | 50-200ms |
| Broadcast latency | 10-50ms | 10-50ms |

## APPENDIX D: Cart State Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React 19)                         │
│  Product Catalog → Cart State (IDs+Qty only) → Checkout     │
│                                        POST /api/checkout   │
│                                        {items: [{id, qty}]} │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER                                    │
│  1. Verify HMAC signature on cart state                     │
│  2. Fetch CURRENT prices from DB (never trust client)       │
│  3. Verify stock via atomic CAS                             │
│  4. Check for price changes → PRICE_CHANGED if different    │
│  5. Create checkout session with server-authoritative total  │
│  6. Return HMAC-signed checkout token                       │
│  7. Payment uses token — not client data                    │
└─────────────────────────────────────────────────────────────┘
```

## APPENDIX E: Maker/Checker Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Builder      │     │ Checker      │     │ Test Runner  │
│ Agent        │────▶│ Agent        │────▶│ (Sandboxed)  │
│ (Different   │     │ (Different   │     │ Docker +     │
│  model/      │     │  model/      │     │ Testcontainers│
│  prompt)     │     │  prompt)     │     │ + MSW        │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ PASS     │ │ FAIL     │ │ MUTATION │
                              │ → Merge  │ │ → Reject │ │ < 60%    │
                              │ Queue    │ │ + Report │ │ → Reject │
                              └──────────┘ └──────────┘ └──────────┘
```

## APPENDIX F: Schema Deviation Protocol

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. DETECT   │────▶│  2. QUARANTINE│────▶│  3. NOTIFY   │────▶│  4. RESOLVE  │
│              │     │              │     │              │     │              │
│ Zod validate │     │ Reject with  │     │ Slack alert, │     │ Auto-gen or  │
│ Diff check   │     │ 422 + schema │     │ GH issue,    │     │ manual fix   │
│ CI pipeline  │     │ violation    │     │ PagerDuty    │     │ + review     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```
