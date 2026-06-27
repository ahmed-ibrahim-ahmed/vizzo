# Prompt: Build Plan for Vizzo

You are writing or revising `build-plan.md` for Vizzo.

## Mission
Turn the product scope and architecture into a safe, dependency-aware execution plan for a real WhatsApp-first Sudan bus-booking MVP.

This plan must prevent fake progress. Do not let future sessions build dashboards, queues, or traveler flows before the underlying booking, inventory, finance, and audit foundations exist.

## Read first
Before drafting, read:
1. `system_guide.md`
2. `product_vision.md`
3. `context/project-overview.md`
4. `context/architecture.md`
5. current `context/build-plan.md` if it exists
6. `context/code-standards.md` if event names or dependency constraints matter

## Core principle
Build the system in operationally safe slices.

Use UI-first with mock data for visible office/admin surfaces when visual validation matters.
Use logic-first for auth, database foundations, state machines, storage, webhooks, cron jobs, and money-state features when fake UI would create misleading momentum.

Do not force a shallow UI-first rule onto every feature.

## Output structure
Write the file with this structure:

# Build Plan

## Core Principle
2-4 sentences.

## Phase N - Name

### NN Feature Name
For every feature include:
- Purpose
- Dependencies
- UI
- Logic
- States touched, if relevant
- Acceptance checks
- PostHog events, only if already approved elsewhere

## Feature Count
Table: Phase | Features | Total

## Required dependency logic
Unless context clearly proves otherwise, keep this rough order:
1. Foundation and auth skeleton
2. Database, roles, constants, and domain foundations
3. Office/admin app chrome and protected navigation
4. Office operational basics
5. Admin operational basics
6. WhatsApp traveler booking engine
7. Automation and safety jobs
8. Production hardening and auditability

## Must-cover capabilities
The plan must place all MVP capabilities, especially:
- office trip creation and editing
- office confirmed bookings visibility
- office wallet and withdrawal requests
- admin payment confirmation and rejection
- admin refund processing
- admin availability and working-hours controls
- traveler route/date/trip/seat selection over WhatsApp
- temporary booking creation with reference number
- receipt submission by traveler
- warning and expiry automation
- trip cancellation and refund-detail collection
- auditability and production hardening

## Sequencing rules
Do not allow:
- payment confirmation before booking states and ledger/audit foundations
- seat reservation before quota rules exist
- withdrawals before wallet and bank snapshot rules exist
- refund processing before cancellation and refund-record creation exist
- receipt handling before private storage rules exist
- production-ready claims before safeguards are verified

## Quality bar
- Every feature must fit a focused implementation session.
- Every acceptance check must be observable.
- UI bullets must be concrete.
- Logic bullets must describe behavior, not vague implementation noise.
- The plan must reflect operational risk, not only page count.
- The final phase must include hardening work, not cosmetic cleanup.

## Final warning
This is a real operational product. The build order must protect seats, money, receipts, and refunds from careless sequencing.

If working in a repository, save the file to `context/build-plan.md`.
