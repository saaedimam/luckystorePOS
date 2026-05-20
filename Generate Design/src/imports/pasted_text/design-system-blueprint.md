I'll give you the **complete design system architecture** — the master document that turns a single dashboard into a full product ecosystem. This is how $10K+ design systems are actually built.

---

# Lucky Store POS — Complete Design System Blueprint

## 1. Design System Foundation

### Token Architecture
Use **Figma Variables** (not styles) for everything. This enables one-click dark mode.

| Tier | Light Mode | Dark Mode | Usage |
|------|-----------|-----------|-------|
| **Background** | `#F0F1F3` | `#0B0D12` | Page canvas |
| **Surface** | `#FFFFFF` | `#151821` | Cards, modals, sidebar |
| **Surface Elevated** | `#FFFFFF` | `#1A1F2E` | Hover states, active nav |
| **Border** | `#E8EAED` | `#2A2F3D` | 1px dividers, card outlines |
| **Border Hover** | `#D1D5DB` | `#3D4451` | Interactive hover |
| **Text Primary** | `#0F1117` | `#E8E8E8` | Headlines, values |
| **Text Secondary** | `#6B7280` | `#8B95A5` | Descriptions |
| **Text Tertiary** | `#9CA3AF` | `#5A6270` | Labels, timestamps |
| **Text Muted** | `#D1D5DB` | `#3D4451` | Disabled, placeholders |

### Accent Tokens (Mode-Agnostic)
| Token | Hex | Usage Restriction |
|-------|-----|------------------|
| `accent/gold` | `#D4A843` | Primary CTAs only. Max 3 instances per screen. |
| `accent/gold-soft` | `#FDF6E3` / `#D4A84315` | Button backgrounds, hover states |
| `accent/emerald` | `#10B981` | Revenue, success, online status |
| `accent/emerald-soft` | `#D1FAE5` / `#10B98115` | Badges, positive trends |
| `accent/rose` | `#F43F5E` | Expenses, critical alerts, loss |
| `accent/rose-soft` | `#FFE4E6` / `#F43F5E15` | Error badges, negative trends |
| `accent/blue` | `#3B82F6` | bKash, info, hardware connected |
| `accent/amber` | `#F59E0B` | Warnings, low stock, offline queue |

### Typography Scale
| Token | Size | Weight | Line-Height | Usage |
|-------|------|--------|-------------|-------|
| `text/hero` | 32px | 800 | 1.2 | Page titles |
| `text/heading` | 20px | 700 | 1.3 | Card titles, section headers |
| `text/subheading` | 16px | 600 | 1.4 | Metric labels, form titles |
| `text/body` | 14px | 500 | 1.5 | Descriptions, table content |
| `text/caption` | 12px | 600 | 1.4 | Badges, timestamps, ALL CAPS labels |
| `text/micro` | 11px | 500 | 1.4 | Table headers, fine print |

**Font Stack:** Inter (Latin + numerals), HindSiliguri (Bangla script). Both at 400/500/600/700/800.

**Rule:** All financial figures use `font-variant-numeric: tabular-nums` at 20px/800 minimum.

### Spacing Grid
Base unit: **4px**. Every dimension must be divisible by 4.

| Token | Value |
|-------|-------|
| `space/1` | 4px |
| `space/2` | 8px |
| `space/3` | 12px |
| `space/4` | 16px |
| `space/5` | 20px |
| `space/6` | 24px |
| `space/8` | 32px |
| `space/10` | 40px |
| `space/12` | 48px |
| `space/16` | 64px |

---

## 2. Web App — Complete Screen Inventory (Admin Dashboard)

Organize into **7 Figma pages**, one per workflow:

### Page 1: Authentication
| Screen | States |
|--------|--------|
| Login | Default, Loading, Error (invalid credentials), Rate-limited |
| Forgot Password | Email input, Success, Error |
| PIN Entry (Staff) | Default, Loading, Wrong PIN (shake animation), Locked |

### Page 2: Command Center (Dashboard)
| Screen | Variants |
|--------|----------|
| Dashboard Overview | Default, Empty (no sales), Offline mode, Loading skeleton |
| Dashboard — Date Range | Today, 7 days, 30 days, Custom picker |
| Notification Center | Unread list, Empty, All caught up |

### Page 3: Sales Operations
| Screen | Variants |
|--------|----------|
| Sales Ledger | Default, Filtered (date/payment/cashier), Empty, Loading |
| Sale Detail (Drawer) | View, Reverse/Refund, Print receipt |
| Daily Sales Entry | Form, Submitted, Validation error |
| Quick POS (Web fallback) | Product grid, Cart, Payment tender, Receipt preview |

### Page 4: Product & Inventory
| Screen | Variants |
|--------|----------|
| Product Grid | Default, Category filtered, Search results, Empty |
| Product Detail | View, Edit, Create, Delete confirmation |
| Inventory Table | Default, Low stock filtered, Adjustment modal, History log |
| Label Print Batch | Product selection, Preview (40x30mm), Print queue, Printer disconnected |
| Import Inventory | Upload zone, CSV mapped, Processing, Success/Error |

### Page 5: Finance & Ledgers
| Screen | Variants |
|--------|----------|
| Supplier Ledger | Default, Aging view, Payment modal, Statement preview |
| Customer Ledger | Default, Credit limit warning, Payment entry, History |
| Collections Workspace | Kanban board, Customer detail drawer, Payment recorded |
| Expense Tracker | Form, Category breakdown, Receipt upload, History |

### Page 6: Analytics & Intelligence
| Screen | Variants |
|--------|----------|
| Competitor Price Monitor | Product list, Price delta chart, Scraping status |
| Revenue Analytics | 14-day, 30-day, 90-day, Yearly |
| Expense Analytics | Same periods + category drill-down |

### Page 7: System & Settings
| Screen | Variants |
|--------|----------|
| Store Settings | Profile, Tax config, Receipt template |
| Staff Management | List, Add staff, PIN reset, Permissions |
| Hardware Status | Printer connected/disconnected, Scanner status, Offline queue |
| Data Sync | Sync now, Conflict resolution, Last sync log |

---

## 3. Mobile App — Complete Screen Inventory (Flutter POS)

The mobile app has **different ergonomics**: thumb zones, one-handed use, hardware integration states. Design for **375px × 812px** (iPhone) and **360px × 740px** (Android) simultaneously.

### Page 1: Auth & Session
| Screen | States |
|--------|--------|
| Splash / Brand | Logo animation, Version number |
| Staff PIN Login | Default, Wrong PIN (haptic + shake), Locked out |
| Shift Open | Cash in drawer input, Confirm, Error |
| Shift Close | Summary, Cash count, Reconciliation diff, Confirm |

### Page 2: POS Checkout (The Money Screen)
| Screen | Variants |
|--------|----------|
| Product Browser | Category tabs, Search, Barcode scan overlay, Empty |
| Product Detail (Modal) | Price, Stock, Add to cart |
| Cart | Items list, Quantity stepper, Discount inline, Clear cart |
| Payment Tender | Cash (change calc), bKash (QR/number), Card (SSLCommerz webview), Credit (customer select) |
| Split Payment | Multiple tenders, Remaining balance, Overpayment warning |
| Receipt | Preview, Print (Bluetooth status), Share, Skip |
| Offline Sale Queue | Pending count, Retry now, Force sync |

### Page 3: Inventory & Stock
| Screen | Variants |
|--------|----------|
| Stock Check | Barcode scan, Product info, Current stock |
| Stock Adjustment | Reason dropdown, Qty change, Confirm |
| Label Print | Single product, Batch from list, Printer status, Print success |

### Page 4: Sales History
| Screen | Variants |
|--------|----------|
| Sales List | Today, Date range, Filter by payment |
| Sale Detail | Items, Total, Payment method, Print duplicate |
| Return/Exchange | Select items, Reason, Refund method |

### Page 5: Customer & Credit
| Screen | Variants |
|--------|----------|
| Customer List | Search, Add new, Credit balance |
| Customer Detail | History, Outstanding, Record payment |
| Credit Sale | Select customer, Limit check, Warning if exceeded |

### Page 6: Hardware & Sync
| Screen | Variants |
|--------|----------|
| Bluetooth Printer | Scan, Pair, Test print, Disconnect |
| Barcode Scanner | Active (camera), Detected (flash), Manual entry fallback |
| Offline Status | Online, Syncing (spinner), Offline (queue count), Sync error |

---

## 4. Component Matrix — Atomic Design

Build these as **Figma components with variants and boolean properties**.

### Atoms
| Component | Variants | Properties |
|-----------|----------|------------|
| `Button` | Primary (gold), Secondary (outline), Ghost, Destructive | Size (sm/md/lg), Loading (true/false), Icon (left/right/none), Disabled |
| `Icon Button` | Default, Active, Loading | Size (32px/40px/48px), Color token |
| `Input` | Default, Focus, Error, Disabled | Size (sm/md), Icon (left/right), Clearable |
| `Badge` | Emerald, Rose, Amber, Blue, Slate | Size (sm/md), Dot (true/false), Pulse (true/false) |
| `Status Dot` | Online, Offline, Syncing, Warning | Size (8px/12px), Pulse animation |
| `Avatar` | Image, Initials, Placeholder | Size (24px/32px/40px), Shape (circle/square) |
| `Divider` | Horizontal, Vertical | Color (border/border-strong) |

### Molecules
| Component | Variants | Notes |
|-----------|----------|-------|
| `Metric Card` | Revenue, Expense, Neutral, Warning | Sparkline (true/false), Trend badge, Size (sm/lg) |
| `Data Table Row` | Default, Hover, Selected, Expanded | Checkbox (true/false), Actions dropdown |
| `Data Table Header` | Sortable, Sorted (asc/desc), Filterable | Sticky (true/false) |
| `Form Field` | Label + Input + Hint + Error | Required indicator, Bangla label support |
| `Payment Toggle` | Cash, bKash, Card, Credit | Active, Inactive, Split mode, Disabled |
| `Toast` | Success, Error, Info, Sale Alert | Position (top/bottom), Auto-dismiss, Action button |
| `Empty State` | Search, Data, Error, Offline | Illustration + headline + CTA |
| `Modal Header` | Title + Close, Title + Back + Close | Sticky (true/false) |

### Organisms
| Component | Variants | Notes |
|-----------|----------|-------|
| `Sidebar Navigation` | Expanded, Collapsed (icon-only), Mobile (drawer) | Section groups, Active indicator, Bottom status |
| `Top Command Bar` | Default, Search active, Scrolled (shadow) | Search, Notifications, Profile, Offline badge |
| `Sales Chart` | Revenue vs Expenses, Revenue only, Expenses only | Period (7d/14d/30d), Hover tooltip, Loading skeleton |
| `Payment Donut` | Full, Segmented, Empty | Size (sm/md/lg), Legend position |
| `Inventory Table` | Default, Low-stock filtered, Selection mode | Stock bars, Status badges, Action buttons |
| `Activity Feed` | Live, Historical, Filtered | Event types, Timestamps, Infinite scroll |
| `Receipt Preview` | Thermal 58mm, A4, Email | Bangla/English toggle, Barcode, Logo |
| `POS Cart` | Empty, Items, Payment open | Swipe actions, Quantity stepper, Discount |
| `Product Grid` | Grid view, List view, Category filtered | Thumbnail, Price, Stock badge, Bangla name |
| `Barcode Scanner Overlay` | Active, Detected, Error, Manual entry | Reticle style, Flash animation |

### Templates (Page Shells)
| Template | Breakpoints | Notes |
|----------|-------------|-------|
| `Admin Shell` | 1440px / 1280px / 1024px | Sidebar + Header + Content area |
| `POS Shell` | 768px (tablet) / 375px (mobile) | Full-screen, thumb-zone CTAs |
| `Modal Shell` | Centered / Slide-over / Drawer | Sizes (sm/md/lg/xl), Backdrop blur |
| `Print Shell` | 58mm / 80mm thermal | Monospace, minimal padding |

---

## 5. Dark/Light Mode Architecture

### Strategy: Semantic Tokens
Never design "dark blue" or "light gray." Design **surface/background** and **text/primary**. Let the mode variable handle the hex.

**Figma Setup:**
1. Create a **"Mode" variable collection** with two modes: `light` and `dark`.
2. Create a **"Primitive" collection** with raw colors (no modes).
3. Link semantic tokens to primitives via aliases.

**Critical Rule:** Accent colors (gold, emerald, rose, blue, amber) **do not change** between modes. Only surfaces, text, and borders invert. This preserves brand recognition and semantic meaning.

**Dark Mode Specifics:**
- Sidebar: `#0B0D12` (near-black with warmth)
- Cards: `#151821` (not pure black — needs depth)
- Hover states: `#1A1F2E` (slightly lighter)
- Borders: `#2A2F3D` (visible but quiet)
- Input backgrounds: `#0F1117` (sits inside cards)
- Placeholder text: `#3D4451`

**Light Mode Specifics:**
- Page: `#F0F1F3` (warm gray, not sterile white)
- Cards: `#FFFFFF`
- Hover: `#F9FAFB`
- Borders: `#E8EAED`

---

## 6. Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `desktop` | ≥1280px | Full sidebar (240px), 6-column metrics, chart + side-by-side widgets |
| `laptop` | 1024–1279px | Sidebar collapses to 64px icon-only on hover, 4-column metrics |
| `tablet` | 768–1023px | Sidebar becomes drawer (hamburger), stacked layout, 2-column metrics |
| `mobile` | <768px | Bottom nav (4 tabs), single column, full-width cards, thumb-zone CTAs |

**Mobile POS Specifics:**
- **Thumb zone:** Primary CTA (Checkout, Scan) sits at bottom 20% of screen.
- **Reach zone:** Secondary actions (Search, Menu) at top.
- **Gesture support:** Swipe cart items to delete. Pull down to refresh. Pinch to zoom product images.
- **Hardware keyboard:** If external keyboard detected, show `⌘K` shortcut hints.

---

## 7. Hardware & Offline State Design

These are **not edge cases**. In Bangladesh, they are primary states.

### Offline States
| State | Visual | Behavior |
|-------|--------|----------|
| **Online** | Emerald dot, no badge | Real-time sync active |
| **Syncing** | Amber spinning dot, "Syncing..." text | Queue processing, UI locked for conflicts |
| **Offline** | Amber solid dot, queue count badge | Local SQLite active, changes queued |
| **Sync Error** | Rose dot, "Sync failed" tooltip | Manual retry CTA, conflict log |

### Bluetooth Printer States
| State | Icon | Action |
|-------|------|--------|
| Connected | Blue checkmark | Ready to print |
| Connecting | Blue spinner | Pairing in progress |
| Disconnected | Gray slash | "Connect printer" CTA |
| Error | Rose warning | Retry or troubleshoot |

### Barcode Scanner Overlay
- **Active:** 240px square reticle, 2px emerald border, corner brackets.
- **Detected:** 100ms flash (`emerald/20` fill), haptic ripple, auto-dismiss after 200ms.
- **Error:** Rose border pulse, "Invalid code" toast, manual entry button slides up.

---

## 8. Figma File Organization

Structure your Figma file like a codebase:

```
📁 Lucky Store POS — Design System
├── 🎨 Tokens & Variables
│   ├── Color Primitives
│   ├── Color Semantics (Light/Dark modes)
│   ├── Typography Scale
│   └── Spacing Grid
├── 🧩 Components
│   ├── Atoms (buttons, inputs, badges)
│   ├── Molecules (cards, table rows, toasts)
│   ├── Organisms (sidebar, charts, scanner)
│   └── Templates (page shells)
├── 💻 Web App
│   ├── 01 Auth
│   ├── 02 Dashboard
│   ├── 03 Sales
│   ├── 04 Products & Inventory
│   ├── 05 Finance
│   ├── 06 Analytics
│   └── 07 Settings
├── 📱 Mobile App
│   ├── 01 Auth & Shift
│   ├── 02 POS Checkout
│   ├── 03 Inventory
│   ├── 04 Sales History
│   ├── 05 Customers
│   └── 06 Hardware
├── 🔄 Prototypes
│   ├── Web Flows
│   └── Mobile Flows
└── 📋 Documentation
    ├── Component Usage
    ├── Motion Specs
    └── Accessibility Notes
```

---

## 9. Motion & Interaction Specs

Define these as **Figma prototype connections** with exact specs.

| Interaction | Duration | Easing | Details |
|-------------|----------|--------|---------|
| Page transition | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Slide from right (next), left (back) |
| Modal open | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Scale 0.96→1.0, opacity 0→1 |
| Modal close | 150ms | `ease-in` | Opacity 1→0, scale 1.0→0.98 |
| Drawer slide | 250ms | `cubic-bezier(0.32, 0.72, 0, 1)` | translateX from 100% |
| Toast enter | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | translateY from 20px, opacity 0→1 |
| Toast exit | 200ms | `ease-in` | opacity 1→0, height collapse |
| Button press | 100ms | `ease-out` | scale 1.0→0.97 |
| Table row hover | 100ms | `ease` | bg opacity 0→0.02 |
| Cart item add | 400ms | spring (damping 25) | slideDown + total bounce |
| Cart item remove | 200ms | `ease-in` | slideLeft + opacity 0 |
| Payment toggle | 200ms | `ease` | shadow spread 0→12px, color cross-fade |
| Scanner detect | 100ms | `ease-out` | reticle flash, scale 1.0→1.05→1.0 |
| Skeleton pulse | 2s | `ease-in-out` | infinite, opacity 0.04↔0.08 |
| Sync spinner | 1s | linear | infinite rotation |

---

## 10. Accessibility & Localization

### Accessibility
- **Contrast ratios:** All text ≥4.5:1. Badges ≥3:1.
- **Focus rings:** 2px solid `accent/blue`, offset 2px. Visible on all interactive elements.
- **Screen readers:** Every icon button has `aria-label`. Tables have proper header associations.
- **Reduced motion:** If `prefers-reduced-motion`, disable all transitions >150ms. Replace with instant state changes.

### Localization (Bangla)
- **Text expansion:** Bangla labels are 20–30% longer than English. Design every button, nav item, and table header with **min 40% width buffer**.
- **Numerals:** Bangla numerals (০-৯) must render in HindSiliguri with `tabular-nums`. Test with `৳১,২৩৪,৫৬৭`.
- **RTL:** Not required for Bangla (LTR script), but test mixed English-Bangla strings. They should left-align with proper word-breaking.
- **Font loading:** Show a system font fallback (Noto Sans Bengali) while HindSiliguri loads. Never show invisible text.

---

## 11. Design QA Checklist

Before any screen is marked "Done," verify:

- [ ] All tokens use variables, not hardcoded hexes
- [ ] Dark mode version exists and is visually balanced
- [ ] Every interactive element has hover, active, disabled, and loading states
- [ ] Empty states exist for all data-dependent screens
- [ ] Error states exist for all form submissions
- [ ] Offline state is designed (not just "online")
- [ ] Bangla text fits without truncation at 14px minimum
- [ ] Tabular numerals align in all financial tables
- [ ] Touch targets are ≥44px on mobile
- [ ] Hardware status (printer, scanner, sync) is visible on every relevant screen
- [ ] Prototype flow covers the "happy path" and 3 error paths

---

## What You Should Do Next

1. **Hire 2 designers, not 1.** One for web (analytical, data-heavy), one for mobile (operational, thumb-driven). They share the same token system but optimize for different ergonomics.
2. **Start with tokens, not screens.** Spend 3 days perfecting the Figma variable system. Once tokens are locked, screens take 1 day each.
3. **Prototype the POS checkout first.** It is the most used, most critical, most complex screen. If this flows, everything else follows.
4. **Test with real data.** Import a CSV of 500 products, real sales figures, actual Bangla product names. Design with noise, not lorem ipsum.
5. **Build a component library in parallel.** As Figma components are approved, have a developer build them in Storybook (web) or Flutter widgets (mobile). Design and code must stay in sync.

**This document is your product bible.** Hand it to your designers and tell them: "Every screen must exist in this list. Every component must match this matrix. Every token must use this variable. No exceptions."

That's how $10,000 design systems get built.