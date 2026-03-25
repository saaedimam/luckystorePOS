# Lucky POS - Execution Plan

## Overview
This plan converts the current single-file HTML POS (`lucky-store-stock.html`) into a production-ready, cloud-synced, multi-device POS system using Supabase, React, and modern web technologies.

## 📊 Progress Summary

**Phase 0: Foundation & Setup** - ✅ **COMPLETED**

- Supabase project setup complete
- Database schema deployed
- Project repository initialized
- Frontend React app configured
- Supabase client configured

**Phase 1: Data Migration & Import** - 🟡 **IN PROGRESS**

- CSV import function deployed and tested ✅
- Test data imported successfully ✅
- Full data migration pending ⏳

**Phase 2-10: Remaining Phases** - ⏳ **PENDING**

---

## Phase 0: Foundation & Setup (Week 1)

### 0.1 Supabase Project Setup
**Priority: CRITICAL - Must do first**

- [x] Create Supabase account and project
- [x] Run SQL schema from `docs/02-setup/02-SUPABASE-SCHEMA.md` in Supabase SQL Editor
- [x] Verify all tables created successfully
- [x] Set up Supabase Storage bucket for product images
- [x] Configure environment variables (.env files)

**Deliverable:** Working Supabase database with schema

### 0.2 Project Repository Setup
**Priority: CRITICAL**

- [x] Initialize Git repository
- [x] Create folder structure:

  ```
  lucky-pos/
├─ apps/frontend/          (React + Vite)
  ├─ functions/         (Supabase Edge Functions)
  ├─ scripts/           (Migration & import scripts)
  ├─ infra/            (Infrastructure configs)
  └─ docs/              (Documentation)
  ```
- [x] Set up frontend with Vite + React + TypeScript
- [x] Install dependencies: Tailwind CSS, Supabase client, shadcn/ui
- [x] Configure ESLint, Prettier, TypeScript
- [ ] Set up GitHub Actions CI/CD pipeline

**Deliverable:** Project repository with build system

### 0.3 Supabase Client Configuration
**Priority: HIGH**

- [x] Install `@supabase/supabase-js`
- [x] Create `apps/frontend/src/services/supabase.ts` with client initialization
- [x] Set up environment variables for Supabase URL and anon key
- [x] Test connection to Supabase

**Deliverable:** Working Supabase client connection

---

## Phase 1: Data Migration & Import (Week 1-2)

### 1.1 Export Current Data
**Priority: HIGH**

- [ ] Use existing CSV export from `lucky-store-stock.html` OR
- [ ] Create migration script to export IndexedDB data to CSV
- [ ] Verify CSV format matches Supabase import requirements
- [ ] Clean and validate exported data

**Deliverable:** CSV file with all current items ready for import

### 1.2 CSV Import Function
**Priority: HIGH**

- [x] Create Supabase Edge Function: `import-inventory` (deployed and tested)
- [x] Function accepts CSV file, parses rows
- [x] Upserts into `items` table (ON CONFLICT handling)
- [x] Creates categories if missing
- [x] Handles image URLs from CSV
- [x] Returns import summary (success/errors)

**Deliverable:** Working CSV import function

### 1.3 Import Current Data
**Priority: HIGH**

- [x] Upload CSV files to Supabase Storage (test data imported successfully)
- [x] Run import function for each CSV (tested with 2 items)
- [ ] Verify all items imported correctly (test data only, full migration pending)
- [ ] Create initial store record
- [ ] Create test user accounts (admin, cashier)

**Deliverable:** All current items migrated to Supabase

---

## Phase 2: Core Admin Interface (Week 2-3)

### 2.1 Authentication Setup
**Priority: HIGH**

- [x] Implement Supabase Auth login page
- [x] Create user registration (admin only)
- [x] Set up role-based routing
- [x] Implement session management
- [x] Add logout functionality

**Deliverable:** Working authentication system ✅

### 2.2 Items Management (Admin)
**Priority: HIGH**

- [x] Create Items list page (table view)
- [x] Implement search and filtering
- [x] Create Add/Edit Item modal/form
- [x] Image upload to Supabase Storage
- [x] Category management (CRUD)
- [x] Barcode validation and uniqueness check
- [x] Bulk import UI (use existing CSV import function)

**Deliverable:** Full items management interface matching current HTML functionality ✅

### 2.3 Stores Management
**Priority: MEDIUM**

- [ ] Create Stores list page
- [ ] Add/Edit Store form
- [ ] Store selection for current session
- [ ] Store-specific settings

**Deliverable:** Multi-store management interface

---

## Phase 3: POS Client - Basic (Week 3-4)

### 3.1 POS Layout & UI
**Priority: CRITICAL**

- [ ] Create POS page layout (3-column: items, bill, payment)
- [ ] Implement keyboard-first navigation
- [ ] Barcode input field (always focused)
- [ ] Item search with autocomplete
- [ ] Category grid display
- [ ] Bill table with editable quantities/prices
- [ ] Payment summary panel
- [ ] Number pad component

**Deliverable:** POS UI matching current HTML functionality

### 3.2 POS Core Functions
**Priority: CRITICAL**

- [ ] Barcode scanning (keyboard input)
- [ ] Item search by name (debounced)
- [ ] Add item to bill
- [ ] Update quantity/price in bill
- [ ] Remove item from bill
- [ ] Calculate totals (subtotal, discount, final total)
- [ ] Payment input and balance calculation

**Deliverable:** Working POS with all core billing features

### 3.3 Checkout & Sales Creation
**Priority: CRITICAL**

- [ ] Create Supabase Edge Function: `create-sale`
- [ ] Function generates receipt number (use `get_new_receipt()`)
- [ ] Atomic stock decrement (UPDATE with WHERE qty >= required)
- [ ] Create sale record and sale_items
- [ ] Log stock movements
- [ ] Return receipt data to client
- [ ] Handle errors (insufficient stock, etc.)

**Deliverable:** Working checkout that creates sales in Supabase

---

## Phase 4: Realtime Sync (Week 4-5)

### 4.1 Realtime Subscriptions
**Priority: HIGH**

- [ ] Subscribe to `stock_levels` changes
- [ ] Subscribe to `sales` changes per store
- [ ] Update UI when stock changes occur
- [ ] Show notifications for new sales
- [ ] Handle connection/disconnection

**Deliverable:** Real-time stock and sales updates

### 4.2 Multi-Counter Sync
**Priority: HIGH**

- [ ] Test multiple browser tabs/windows
- [ ] Verify stock updates propagate instantly
- [ ] Verify sales appear on all counters
- [ ] Handle concurrent sales gracefully

**Deliverable:** Multi-counter synchronization working

---

## Phase 5: Offline Support (Week 5-6)

### 5.1 Offline Queue System
**Priority: HIGH**

- [ ] Create IndexedDB schema for operation queue
- [ ] Implement `sync.ts` service
- [ ] Queue operations when offline (sales, stock adjustments)
- [ ] Show offline indicator in UI
- [ ] Display queued operations count

**Deliverable:** Offline operation queue

### 5.2 Sync Worker
**Priority: HIGH**

- [ ] Implement sync worker that runs periodically
- [ ] Process queue when online
- [ ] Send operations to Edge Function `/sync/ops`
- [ ] Handle sync conflicts (server wins)
- [ ] Update local state after successful sync
- [ ] Exponential backoff on errors

**Deliverable:** Automatic sync when connection restored

### 5.3 Conflict Resolution
**Priority: MEDIUM**

- [ ] Handle stock conflicts (insufficient stock)
- [ ] Handle duplicate receipt numbers
- [ ] Show sync errors to user
- [ ] Allow manual retry of failed operations

**Deliverable:** Robust conflict handling

---

## Phase 6: Receipt Printing (Week 6)

### 6.1 Receipt Template
**Priority: MEDIUM**

- [ ] Design receipt layout (matching current HTML print)
- [ ] Create receipt component
- [ ] Format receipt data (items, totals, date, receipt number)
- [ ] Test print preview

**Deliverable:** Receipt template component

### 6.2 Print Integration
**Priority: MEDIUM**

**Option A: WebUSB (Simpler)**
- [ ] Implement ESC/POS commands via WebUSB
- [ ] Test with thermal printer
- [ ] Handle printer errors

**Option B: Local Print Agent (More Reliable)**
- [ ] Create Node.js print agent
- [ ] Listen on localhost:3001/print
- [ ] Send ESC/POS commands to printer
- [ ] Handle USB/serial printer connections
- [ ] Create installer/startup script

**Deliverable:** Working receipt printing

---

## Phase 7: Advanced Features (Week 7-8)

### 7.1 Returns & Refunds
**Priority: MEDIUM**

- [ ] Create returns page
- [ ] Search sale by receipt number
- [ ] Select items to return
- [ ] Process refund (create return record)
- [ ] Restore stock levels
- [ ] Print return receipt

**Deliverable:** Returns/refunds workflow

### 7.2 Reports & Analytics
**Priority: MEDIUM**

- [ ] Daily sales report (Z-report)
- [ ] Sales by date range
- [ ] Top selling items
- [ ] Profit/loss reports
- [ ] Export reports to CSV/PDF
- [ ] Low stock alerts

**Deliverable:** Reporting dashboard

### 7.3 Hold & Resume Bills
**Priority: LOW**

- [ ] Save bill to IndexedDB
- [ ] List held bills
- [ ] Resume held bill
- [ ] Delete held bill

**Deliverable:** Bill hold/resume functionality

---

## Phase 8: Security & Hardening (Week 8-9)

### 8.1 Row Level Security (RLS)
**Priority: CRITICAL**

- [ ] Enable RLS on all tables
- [ ] Create policies for each role:
  - Admins: full access
  - Managers: read all, modify items/sales
  - Cashiers: read items, create sales only
  - Stock: read items, modify stock only
- [ ] Test policies with different user roles
- [ ] Verify unauthorized access is blocked

**Deliverable:** Secure RLS policies implemented

### 8.2 Security Hardening
**Priority: HIGH**

- [ ] XSS protection (escape all user input)
- [ ] CSRF protection
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all forms
- [ ] Secure cookie settings
- [ ] HTTPS enforcement

**Deliverable:** Security checklist completed

### 8.3 Audit Trail
**Priority: MEDIUM**

- [ ] Ensure all stock_movements include performed_by
- [ ] Log all price changes
- [ ] Log all user actions (admin dashboard)
- [ ] Create audit log viewer

**Deliverable:** Complete audit trail

---

## Phase 9: Testing & QA (Week 9-10)

### 9.1 Unit Tests
**Priority: MEDIUM**

- [ ] Test utility functions
- [ ] Test sync logic
- [ ] Test calculation functions
- [ ] Test data validation

**Deliverable:** Unit test suite

### 9.2 E2E Tests
**Priority: HIGH**

- [ ] POS flow: scan → add → checkout
- [ ] Offline → sync flow
- [ ] Multi-counter sync
- [ ] Returns workflow
- [ ] Admin CRUD operations

**Deliverable:** E2E test suite with Playwright

### 9.3 Performance Testing
**Priority: MEDIUM**

- [ ] Test with 1000+ items
- [ ] Test with multiple concurrent users
- [ ] Test offline queue with 100+ operations
- [ ] Optimize slow queries

**Deliverable:** Performance benchmarks

---

## Phase 10: Deployment & Production (Week 10)

### 10.1 Production Setup
**Priority: CRITICAL**

- [ ] Set up production Supabase project
- [ ] Configure production environment variables
- [ ] Set up Vercel deployment
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure automated backups

**Deliverable:** Production environment ready

### 10.2 Monitoring & Observability
**Priority: HIGH**

- [ ] Set up Sentry for error tracking
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Create alerting rules
- [ ] Set up database monitoring

**Deliverable:** Monitoring system active

### 10.3 Documentation
**Priority: MEDIUM**

- [ ] User manual for cashiers
- [ ] Admin guide
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

**Deliverable:** Complete documentation

---

## Quick Start: Immediate Actions

### Today (Day 1)
1. Create Supabase account
2. Run SQL schema from `docs/02-setup/02-SUPABASE-SCHEMA.md`
3. Export current items to CSV from `lucky-store-stock.html`
4. Set up project repository structure

### This Week (Week 1)
1. Complete Phase 0 (Foundation)
2. Complete Phase 1 (Data Migration)
3. Start Phase 2 (Admin Interface)

### Next 2 Weeks (Weeks 2-3)
1. Complete Phase 2 (Admin Interface)
2. Complete Phase 3 (POS Client Basic)
3. Test core functionality

---

## Dependencies & Prerequisites

### Required Accounts
- [x] Supabase account (free tier OK for testing)
- [ ] GitHub account (for repository)
- [ ] Vercel account (for deployment, free tier OK)

### Required Tools
- [x] Node.js 18+ installed
- [x] Git installed
- [x] Code editor (VS Code recommended)
- [x] Modern browser for testing

### Optional Hardware
- [ ] Thermal printer (for testing printing)
- [ ] Barcode scanner (USB keyboard emulator)

---

## Risk Mitigation

### High Risk Items
1. **Data Loss During Migration**
   - Mitigation: Export all data to CSV first, verify import before deleting old system

2. **Offline Sync Conflicts**
   - Mitigation: Implement robust conflict resolution, test extensively

3. **Performance with Large Item Counts**
   - Mitigation: Implement pagination, indexing, cursor-based queries

4. **Printer Compatibility**
   - Mitigation: Support both WebUSB and local print agent

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] Items can be managed via admin interface
- [ ] POS can create sales
- [ ] Stock updates in real-time across devices
- [ ] Receipts can be printed
- [ ] Basic reports available

### Production Ready
- [ ] All security measures implemented
- [ ] Offline sync working reliably
- [ ] Multi-counter sync tested
- [ ] Error monitoring active
- [ ] Documentation complete
- [ ] Staff training completed

---

## Next Immediate Step

**Start with Phase 0.1: Supabase Project Setup**

1. Go to https://supabase.com and create account
2. Create new project
3. Open SQL Editor
4. Copy SQL from `docs/02-setup/02-SUPABASE-SCHEMA.md`
5. Run the SQL script
6. Verify tables created

Then proceed to Phase 0.2: Project Repository Setup

---

## Notes

- This plan assumes 1 developer working full-time
- Adjust timelines based on team size
- Each phase builds on previous phases
- Don't skip phases - they have dependencies
- Test thoroughly before moving to next phase
- Keep current HTML file as backup until migration complete

