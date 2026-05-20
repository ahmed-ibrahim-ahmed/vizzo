---
Task ID: 2-d
Agent: Agent D
Task: P2-12 Storefront Editor + P2-13 Banner Slot Management

Work Log:
- Created StorefrontEditorPage.tsx with split-screen desktop / stacked mobile layout
- Created EditorControls.tsx with logo upload (compress → R2 pipeline) and drag-and-drop banner slot management
- Created LivePreview.tsx with simulated phone frame and live storefront preview
- Created editor.css with all editor page, controls, phone frame, toggle switch, skeleton, and overlay styles
- Created BannerSlotEditor.tsx with auto-discount (queries is_discounted=true products) and manual banner modes
- Created ProductSelectorModal.tsx with search, checkboxes, and product selection
- Created bannerslot.css with all banner slot editor and product selector modal styles
- Integrated with existing AuthGate's useStore hook (store is non-null inside AuthGate)
- Restored App.tsx to use existing DashboardLayout routing pattern with /storefront route

Stage Summary:
- All 7 files created with complete production-ready implementation
- Storefront editor with split-screen desktop (right: controls, left: preview) and stacked mobile layouts
- Live preview in simulated phone frame with notch, scaled rendering, and banner sections
- Banner slot management with auto-discount (AP-09: hidden when 0 discounted items) and manual modes
- Product selector modal with search filter, checkbox selection, and real-time preview updates
- Native HTML5 drag-and-drop for slot reordering with sort_order persistence
- Logo upload with compress → R2 pipeline, preview, and remove functionality
- RTL layout throughout, Arabic text, mobile-first, vanilla CSS with design tokens
- Skeleton screens for loading states (AP-05), no spinners
