# Karbar UI Implementation Plan

## 1. Executive Summary

This document outlines the phased implementation plan to transform the current **Lucky Store Admin Web** application into a polished, production-ready UI that matches the **Karbar** design language observed in the screenshots. The plan covers design tokens, component architecture, feature modules, and integration strategy.

**Current Stack:** React 19 + Vite + TypeScript + Tailwind CSS + TanStack Query + Supabase
**Target Design:** Karbar-style dark sidebar, emerald primary accents, card-based layouts, POS grid interface

---

## 2. Current State Analysis

### 2.1 What's Working
- ✅ React 19 + Vite + TypeScript foundation
- ✅ Tailwind CSS configured with custom tokens
- ✅ TanStack Query for server state
- ✅ Supabase client with RPC functions
- ✅ Basic routing with react-router-dom
- ✅ Auth context and guards
- ✅ Core features: Dashboard, Products, Inventory, Sales, POS, Purchase, Finance

### 2.2 What's Missing vs. Karbar UI
- ❌ Dark sidebar navigation (currently light/white)
- ❌ Global top header with search, notifications, profile
- ❌ Card-based metric widgets with color coding
- ❌ POS grid layout with category pills
- ❌ Billing panel with running totals
- ❌ Modal-based add/edit flows
- ❌ Table filters and sort controls
- ❌ Consistent emerald green primary color
- ❌ Empty state illustrations
- ❌ Responsive mobile considerations

---

## 3. Design System Implementation

### 3.1 Color Palette Update

Update `src/styles/tokens.css` to match Karbar's palette:

```css
:root {
  /* Primary - Emerald Green */
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-primary-light: #d1fae5;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  
  /* Sidebar - Dark Slate */
  --bg-sidebar: #0f172a;
  --bg-sidebar-hover: rgba(255,255,255,0.05);
  --text-sidebar: #94a3b8;
  --text-sidebar-active: #10b981;
  
  /* Surfaces */
  --bg-app: #f8fafc;
  --bg-card: #ffffff;
  --bg-header: #ffffff;
  --bg-input: #f1f5f9;
  
  /* Text */
  --text-main: #1e293b;
  --text-muted: #64748b;
  --text-light: #94a3b8;
  
  /* Borders */
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
}
```

### 3.2 Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--font-size-xs` | 0.75rem | 400 | Badges, captions |
| `--font-size-sm` | 0.875rem | 500 | Labels, nav items |
| `--font-size-base` | 1rem | 400 | Body text |
| `--font-size-lg` | 1.125rem | 600 | Card titles |
| `--font-size-xl` | 1.25rem | 700 | Section headers |
| `--font-size-2xl` | 1.5rem | 700 | Page titles |
| `--font-size-3xl` | 1.875rem | 700 | Dashboard welcome |

### 3.3 Spacing & Layout

- Sidebar width: `260px` fixed
- Header height: `64px`
- Content padding: `24px`
- Card padding: `20px`
- Card border-radius: `12px` (`--radius-xl`)
- Button border-radius: `8px` (`--radius-md`)
- Gap between cards: `16px`

### 3.4 Shadows

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
--shadow-dropdown: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
--shadow-modal: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
```

---

## 4. Component Architecture

### 4.1 Shared Components (src/components/)

| Component | Purpose | Props |
|-----------|---------|-------|
| `Layout.tsx` | App shell with sidebar + header + content | `children` |
| `Sidebar.tsx` | Dark navigation sidebar | `navItems[]` |
| `TopHeader.tsx` | Global search, notifications, profile | `user, onSearch` |
| `PageHeader.tsx` | Page title + action buttons | `title, subtitle, actions[]` |
| `Card.tsx` | Container with shadow/border | `children, className, padding` |
| `MetricCard.tsx` | Dashboard stat widget | `title, value, icon, trend, color` |
| `DataTable.tsx` | Sortable/filterable table | `columns[], data[], onRowClick` |
| `TableFilters.tsx` | Search + dropdown filters | `filters[], onChange` |
| `Modal.tsx` | Centered overlay dialog | `isOpen, onClose, title, children` |
| `Drawer.tsx` | Slide-out panel | `isOpen, onClose, title, children` |
| `Button.tsx` | Styled button variants | `variant, size, icon, loading` |
| `Input.tsx` | Form input with label | `label, error, icon` |
| `Select.tsx` | Dropdown select | `options[], value, onChange` |
| `Badge.tsx` | Status/chip indicator | `variant, children` |
| `EmptyState.tsx` | Illustration + message | `icon, title, description, action` |
| `Avatar.tsx` | User/store avatar | `name, image, size` |
| `Skeleton.tsx` | Loading placeholder | `width, height, circle` |
| `Toast.tsx` | Notification toast | `message, type, duration` |
| `CategoryPill.tsx` | Horizontal scrollable filter | `categories[], active, onSelect` |
| `ProductCard.tsx` | POS grid item card | `product, onSelect, onQtyChange` |
| `BillingPanel.tsx` | POS right-side cart | `items[], onUpdate, onCheckout` |
| `QuantityStepper.tsx` | +/- quantity control | `value, min, max, onChange` |

### 4.2 Component Variants

**Button Variants:**
- `primary` - Emerald bg, white text (Save, Add)
- `secondary` - White bg, gray border (Cancel)
- `danger` - Red bg, white text (Delete)
- `ghost` - Transparent, hover bg (Icon buttons)
- `outline` - Bordered, colored text (Scan Code)

**Badge Variants:**
- `success` - Green bg/text
- `warning` - Amber bg/text
- `danger` - Red bg/text
- `info` - Blue bg/text
- `neutral` - Gray bg/text

---

## 5. Feature Module Implementation Plan

### Phase 1: Foundation (Week 1)

#### 5.1.1 Design Tokens & Global Styles
- [ ] Update `tokens.css` with Karbar palette
- [ ] Update `base.css` with scrollbar, focus styles
- [ ] Update `layout.css` with dark sidebar grid
- [ ] Add `components.css` for reusable component styles

#### 5.1.2 Core Layout Components
- [ ] Refactor `Sidebar.tsx` → Dark theme, grouped nav sections
- [ ] Create `TopHeader.tsx` → Search bar, icons, user dropdown
- [ ] Update `Layout.tsx` → Sidebar + Header + Content grid
- [ ] Create `PageHeader.tsx` → Title + breadcrumb + actions

#### 5.1.3 Base UI Components
- [ ] `Button.tsx` with all variants
- [ ] `Card.tsx` container
- [ ] `Input.tsx` with icon support
- [ ] `Select.tsx` dropdown
- [ ] `Modal.tsx` overlay dialog
- [ ] `Badge.tsx` status chips
- [ ] `Avatar.tsx` user initials
- [ ] `Skeleton.tsx` loading states

### Phase 2: Dashboard (Week 2)

#### 5.2.1 Dashboard Page Redesign
- [ ] Welcome header with user name
- [ ] 5-column metric cards grid:
  - To Receive (green)
  - To Give (red)
  - Sales (green)
  - Purchase (blue)
  - Expense (red)
- [ ] Cashflow chart area (placeholder for chart library)
- [ ] Total Balance card
- [ ] Upcoming Reminders section
- [ ] Low stock alerts panel

#### 5.2.2 Data Integration
- [ ] Connect to existing `get_manager_dashboard_stats` RPC
- [ ] Add new RPC for cashflow data (if needed)
- [ ] Add new RPC for reminders data

### Phase 3: Inventory & Products (Week 2-3)

#### 5.3.1 Items List Page
- [ ] Table with columns: Item Name, Type, Category, Item Code, Sales Price, Purchase Price, Quantity
- [ ] Filter bar: Search, Category dropdown, Stock dropdown, Item Type dropdown
- [ ] Sort dropdown
- [ ] Action column: Edit, Delete, More options
- [ ] Stock quantity with unit display (e.g., "57 LTR", "0 BOX")
- [ ] Color-coded low stock (red for zero/negative)

#### 5.3.2 Add/Edit Item Modal
- [ ] Two-column form layout
- [ ] Fields: Item Name, Category, Type (Product/Service toggle), Sales Price, Purchase Price, Opening Stock, Primary Unit, Item Code
- [ ] "Add Secondary Unit" expandable section
- [ ] "Generate" button for item code
- [ ] Image upload placeholder
- [ ] Save/Cancel actions

#### 5.3.3 Product Detail View
- [ ] Image/avatar display
- [ ] Price history chart
- [ ] Stock movement log

### Phase 4: Quick POS (Week 3-4)

#### 5.4.1 POS Layout
- [ ] Full-screen layout (no sidebar)
- [ ] Back to Dashboard button
- [ ] Top search bar with ⌘K shortcut hint
- [ ] Category filter pills (horizontal scroll)
- [ ] Product grid (3 columns desktop, 2 tablet, 1 mobile)
- [ ] Product card: Avatar/Initials, Name, Qty, Price, "Click to Select"

#### 5.4.2 Billing Panel (Right Side)
- [ ] Collapsible on mobile
- [ ] Item list with qty stepper (+/-)
- [ ] Inline edit (pencil) and remove (trash)
- [ ] Subtotal display
- [ ] Expandable: Discount, Tax, Additional Charges
- [ ] Total Amount (large, emerald)
- [ ] "Continue Billing" CTA button
- [ ] "Clear Items" link

#### 5.4.3 POS Interactions
- [ ] Click product → Add to bill
- [ ] Quantity stepper → Update total
- [ ] Remove item → Confirm or immediate
- [ ] Category filter → Filter grid
- [ ] Search → Filter grid in real-time
- [ ] Barcode scan integration (existing)

#### 5.4.4 Checkout Flow
- [ ] Customer selection
- [ ] Payment mode (Cash, Card, Digital)
- [ ] Amount tendered / change calculation
- [ ] Print receipt option
- [ ] Complete sale → Clear cart

### Phase 5: Sales & Purchase (Week 4)

#### 5.5.1 Sales History Page
- [ ] Table: Invoice No., Date, Customer, Items, Total, Status
- [ ] Filters: Date range, Customer, Status
- [ ] Export to PDF/Excel
- [ ] View invoice detail modal

#### 5.5.2 Add Sales Page
- [ ] Similar to POS but with customer selection
- [ ] Credit sale option
- [ ] Delivery note generation

#### 5.5.3 Purchase Entry Page
- [ ] Supplier selection
- [ ] Item grid with purchase prices
- [ ] Expense allocation
- [ ] Payment recording

### Phase 6: Expense & Finance (Week 4-5)

#### 5.6.1 Expense List Page
- [ ] Table: Exp No., Category, Date, Payment Mode, Total, Remarks
- [ ] Filters: Category, Payment Mode, Date
- [ ] Add New Expense button

#### 5.6.2 Add Expense Modal
- [ ] Category dropdown
- [ ] Amount, Date, Payment Mode
- [ Remarks textarea
- [ ] Receipt upload

#### 5.6.3 Ledger Pages
- [ ] Supplier Ledger: Party name, To Give, To Receive, Actions
- [ ] Customer Ledger: Similar structure
- [ ] Transaction detail view

### Phase 7: Settings & Management (Week 5)

#### 5.7.1 Settings Page
- [ ] Store profile
- [ ] Tax settings
- [ ] Receipt customization
- [ ] User management
- [ ] Staff PIN management

#### 5.7.2 Reports Section
- [ ] Sales report with charts
- [ ] Inventory valuation
- [ ] Profit/loss statement
- [ ] GST/Tax reports

---

## 6. Data Layer & API Integration

### 6.1 Existing RPCs to Leverage

| Feature | RPC Function | Status |
|---------|-------------|--------|
| Dashboard stats | `get_manager_dashboard_stats` | ✅ Exists |
| Low stock | `get_low_stock_items` | ✅ Exists |
| Inventory list | `get_inventory_list` | ✅ Exists |
| Stock history | `get_stock_history_simple` | ✅ Exists |
| Sales history | `get_sales_history` | ✅ Exists |
| POS transactions | `create_pos_transaction` | ✅ Exists |
| Stock adjustment | `adjust_stock` | ✅ Exists |
| Purchase receiving | `record_purchase_v2` | ✅ Exists |

### 6.2 New RPCs Needed

| Feature | Proposed RPC | Purpose |
|---------|-------------|---------|
| Cashflow chart | `get_cashflow_data` | Daily money in/out for chart |
| Reminders | `get_upcoming_reminders` | Due payments, follow-ups |
| Expense list | `get_expenses` | Filtered expense records |
| Expense categories | `get_expense_categories` | Dropdown options |
| Item units | `get_item_units` | Primary/secondary units |
| POS categories | `get_pos_categories` | Category pills with counts |
| POS products | `get_pos_products` | Filtered product grid data |

### 6.3 Frontend API Layer

Extend `src/lib/api.ts` with new modules:

```typescript
export const api = {
  // ... existing modules ...
  
  expenses: {
    list: async (filters) => { /* ... */ },
    create: async (data) => { /* ... */ },
    categories: async () => { /* ... */ },
  },
  
  pos: {
    getCategories: async (storeId) => { /* ... */ },
    getProducts: async (storeId, category, search) => { /* ... */ },
    createSale: async (saleData) => { /* ... */ },
  },
  
  reminders: {
    list: async (storeId) => { /* ... */ },
    create: async (data) => { /* ... */ },
  },
};
```

---

## 7. State Management Strategy

### 7.1 Server State (TanStack Query)
- Dashboard stats, inventory, products → `useQuery`
- Mutations (create, update, delete) → `useMutation` with invalidation
- POS cart → Local state (not server)

### 7.2 Client State (React Context)
- `AuthContext` → User, store, permissions
- `CartContext` → POS billing items
- `UIContext` → Sidebar collapse, theme, modals

### 7.3 POS Cart State

```typescript
interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  discount: number;
  tax: number;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  paymentMode: 'cash' | 'card' | 'digital';
  additionalCharges: number;
  discount: number;
}
```

---

## 8. Responsive Design Strategy

### 8.1 Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, sidebar hidden, bottom nav |
| Tablet | 640-1024px | 2-column grids, collapsible sidebar |
| Desktop | > 1024px | Full layout, 3-column POS grid |

### 8.2 Mobile Considerations
- Sidebar → Hamburger menu or bottom tab bar
- POS grid → Single column cards
- Billing panel → Bottom sheet
- Tables → Horizontal scroll or card list view
- Modals → Full-screen sheets

---

## 9. Testing Strategy

### 9.1 Component Testing
- [ ] Storybook for UI component isolation
- [ ] Vitest for unit tests
- [ ] React Testing Library for component tests

### 9.2 Integration Testing
- [ ] POS flow: Add items → Update qty → Checkout
- [ ] Inventory: Add item → Verify in list → Update stock
- [ ] Sales: Create sale → Verify in history → Check ledger

### 9.3 E2E Testing
- [ ] Playwright for critical user flows
- [ ] Auth flow: Login → Dashboard → POS → Sale → Logout
- [ ] Data integrity: Stock updates reflect across pages

---

## 10. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Phase 1** | Week 1 | Design tokens, layout, base components |
| **Phase 2** | Week 2 | Dashboard redesign |
| **Phase 3** | Week 2-3 | Inventory & Products |
| **Phase 4** | Week 3-4 | Quick POS (highest priority) |
| **Phase 5** | Week 4 | Sales & Purchase |
| **Phase 6** | Week 4-5 | Expense & Finance |
| **Phase 7** | Week 5 | Settings & Reports |
| **Polish** | Week 6 | Animations, responsive, testing |

**Total Estimated Duration: 6 weeks**

---

## 11. File Structure

```
src/
├── app/
│   ├── App.tsx
│   ├── AuthGuard.tsx
│   ├── LoginPage.tsx
│   └── QueryProvider.tsx
├── components/
│   ├── ui/                    # Base UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopHeader.tsx
│   │   └── PageHeader.tsx
│   ├── data-display/
│   │   ├── DataTable.tsx
│   │   ├── TableFilters.tsx
│   │   ├── MetricCard.tsx
│   │   └── EmptyState.tsx
│   └── pos/
│       ├── ProductCard.tsx
│       ├── BillingPanel.tsx
│       ├── QuantityStepper.tsx
│       └── CategoryPill.tsx
├── features/
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── pos/
│   │   ├── QuickPosPage.tsx
│   │   ├── CheckoutModal.tsx
│   │   └── useCart.ts
│   ├── products/
│   │   ├── ProductListPage.tsx
│   │   ├── ProductAddModal.tsx
│   │   └── ProductEditDrawer.tsx
│   ├── inventory/
│   │   ├── InventoryListPage.tsx
│   │   └── StockHistoryPage.tsx
│   ├── sales/
│   │   └── SalesHistoryPage.tsx
│   ├── purchase/
│   │   └── PurchaseEntryPage.tsx
│   ├── expenses/
│   │   ├── ExpenseListPage.tsx
│   │   └── ExpenseAddModal.tsx
│   ├── finance/
│   │   ├── SupplierLedgerPage.tsx
│   │   └── CustomerLedgerPage.tsx
│   ├── collections/
│   │   └── CollectionsWorkspace.tsx
│   └── settings/
│       └── SettingsPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useNotification.ts
│   └── useDebounce.ts
├── lib/
│   ├── api.ts
│   ├── supabase.ts
│   ├── AuthContext.tsx
│   └── utils.ts
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   └── components.css
└── types/
    └── index.ts
```

---

## 12. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **CSS Variables over Tailwind config** | Easier theming, runtime theme switching |
| **React Context for cart** | Simple, no need for Redux/Zustand |
| **Modal over Drawer for add/edit** | Matches Karbar screenshots |
| **Inline styles + Tailwind** | Gradual migration, existing pattern |
| **RPC-first for data** | Leverages existing Supabase functions |
| **Lucide icons** | Already in dependencies, consistent style |

---

## 13. Success Criteria

- [ ] All screenshots from the Karbar UI are reproducible
- [ ] Dark sidebar with emerald active states
- [ ] Dashboard with 5 metric cards and cashflow chart
- [ ] POS with category pills, product grid, billing panel
- [ ] Inventory with filters, sort, and action buttons
- [ ] Add/Edit modals with two-column forms
- [ ] Responsive on tablet and mobile
- [ ] All existing functionality preserved
- [ ] Zero console errors
- [ ] Lighthouse score > 90

---

## 14. Next Steps

1. **Approve plan** and prioritize phases
2. **Set up Storybook** for component development
3. **Begin Phase 1** (Design tokens + Layout)
4. **Create component checklist** in project management tool
5. **Schedule daily standups** for progress tracking

---

*Document Version: 1.0*
*Last Updated: May 1, 2026*
*Author: AI Assistant*
