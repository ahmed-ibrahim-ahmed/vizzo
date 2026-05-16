---
Task ID: 2-a
Agent: Agent A
Task: P2-02 Auth Gate & Login + P2-03 Onboarding Wizard

Work Log:
- Created useAuth.ts hook with Google OAuth, session management, graceful Supabase fallback
- Created AuthGate.tsx with StoreContext providing { store, merchant, setStore, refetch }
- AuthGate implements gate logic: loading → pulse animation, no session → /login, no store → /onboarding, store exists → render children
- Created LoginPage.tsx with minimalist centered layout, Vizzo logo, Arabic welcome text, Google OAuth CTA button
- Created auth.css with login page styles, pulse animation for loading state, responsive mobile styles
- Created useOnboarding.ts hook with form state, auto-slug generation, debounced slug uniqueness check, WhatsApp +249 validation, dual INSERT logic
- Created OnboardingPage.tsx with 3-field wizard: store name, slug preview, WhatsApp with immutable +249 prefix
- Created onboarding.css with form styles, slug preview, WhatsApp input group, responsive design
- Updated App.tsx with BrowserRouter, Routes for /login, /onboarding, / (protected via AuthGate)
- Updated tsconfig.json to fix rootDir monorepo issue, added vite-env.d.ts for import.meta.env types
- Updated root package.json dev script to serve dashboard on port 3000
- Updated start-dev.sh to start dashboard Vite server

Stage Summary:
- All 7 files created with complete, production-ready implementation
- Auth flow: Google OAuth → AuthGate → Onboarding/Dashboard
- StoreContext available for all dashboard components via useStore()
- Graceful degradation when Supabase env vars are not configured
- Arabic text throughout, RTL layout, mobile-first vanilla CSS
- WhatsApp +249 prefix enforced at DOM level (AP-14)
- Skeleton pulse animation for loading state (AP-05)
- Debounced slug uniqueness validation (300ms)

Key Decisions:
- AuthGate uses createSupabaseClient() directly rather than useAuth to avoid circular deps and simplify state management
- StoreContext includes setStore for SettingsPage to update store after saves
- Onboarding handles edge case: merchant exists but no store (re-login after failed onboarding)
- google_id sourced from user.user_metadata.sub with fallback to user.id
- Slug uniqueness check uses abortRef to prevent stale queries on unmount
