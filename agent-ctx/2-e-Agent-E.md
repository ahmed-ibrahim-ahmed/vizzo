---
Task ID: 2-e
Agent: Agent E
Task: P2-14 Settings + P2-15 Billing + P2-16 Account Management

Work Log:
- Created SettingsPage.tsx with store identity editing (name, slug, location, WhatsApp, social links)
- Created settings.css with all required styles (RTL, mobile-first, vanilla CSS)
- Created BillingPage.tsx as billing wrapper at /settings/billing route
- Created PlanDashboard.tsx with resource consumption bars (product count, image limits)
- Created UpgradeFlow.tsx with 4-step sequential flow (pricing cards → bank transfer → proof upload → pending lock)
- Created billing.css with all billing component styles
- Created AccountActions.tsx with logout and double-confirmation delete account flow
- Updated App.tsx to include /settings and /settings/billing routes with DashboardLayout
- Updated main.tsx to import new CSS files
- Verified TypeScript compilation passes with zero errors

Stage Summary:
- All 7 files created with complete production-ready code
- Settings: store identity editing with slug uniqueness validation (300ms debounce) and critical warning alert
- Billing: resource bars showing product count vs FREE_TIER_PRODUCT_LIMIT, image limits per tier
- Upgrade flow: 3 pricing cards (monthly/quarterly/annual), bank transfer matrix with copy-to-clipboard, R2 receipt upload, pending lock
- Account: logout via supabase.auth.signOut() + double-confirmation delete with store name typing requirement
- Manual bank transfer only (AP-08), no payment gateways
- +249 WhatsApp prefix immutable at DOM level (AP-14)
- All text in Arabic, RTL layout throughout
- Vanilla CSS only, no Tailwind (AP-11)
- No TODOs or placeholder code (AP-12)
