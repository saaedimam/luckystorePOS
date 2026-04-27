Use these **next prompts** for Antigravity IDE in sequence. Do **not** dump all at once. Run one, review output, then move to the next. That’s how you avoid AI-generated spaghetti.

---

# Prompt 1 — Month 2 Master Sprint

```text
Lucky Store has completed Month 1 Trust Engine (immutable ledger, sales/purchase RPCs, credit/payable ledgers, cash closing).

Now execute Month 2: Money Intelligence & Recovery.

Primary goals:
1. Recover receivables faster
2. Improve purchase operations
3. Produce trustworthy profit analytics
4. Add operational KPI instrumentation

Build only these modules:
- Collections Engine
- Purchase Receiving v2
- Profit by SKU
- KPI Scorecard

Do NOT build dashboards, charts, loyalty systems, branch consolidation, cosmetic UI, or unnecessary abstractions.

Return:
1. database changes
2. backend RPCs
3. Flutter mobile screens
4. React owner web screens
5. acceptance criteria
6. rollout order
```

---

# Prompt 2 — Collections Engine (Highest ROI)

```text
Build Lucky Store Collections Engine for customer dues recovery.

Requirements:
- overdue customer list ranked by amount owed and days overdue
- search/filter by customer
- one-click WhatsApp reminder message
- tap-to-call button
- promise-to-pay date field
- payment history timeline
- mark follow-up notes
- owner-only access

Backend:
- receivables aging query
- reminder log table
- followup_notes table

Web:
- collections workspace

Mobile:
- quick receive payment flow from overdue customer list

KPIs:
- recovered amount
- overdue count reduced
- average days receivable outstanding

Return full implementation plan with schema, RPCs, UI components, routes, and tests.
```

---

# Prompt 3 — Purchase Receiving v2

```text
Upgrade purchase receiving for Lucky Store.

Goals:
- faster supplier stock intake
- accurate cost updates
- payable creation
- barcode-friendly workflow

Features:
- select supplier
- add items quickly
- bulk quantity entry
- unit cost entry
- invoice total validation
- partial payment now / remaining payable
- save draft receiving
- duplicate invoice protection

Accounting:
- inventory debit
- cash or payable credit
- weighted average cost update

Return:
1. schema changes
2. record_purchase_v2 RPC
3. mobile receiving UX optimized for under 30 seconds
4. web purchase entry screen
5. validation rules
```

---

# Prompt 4 — Weighted Average Cost Safeguards

```text
Audit and harden Lucky Store weighted average costing system.

Identify and implement safeguards for:
- backdated purchases
- stock returns
- damaged stock write-offs
- zero stock resets
- negative stock prevention
- concurrent purchase posting
- rounding drift

Recommend production-safe policies prioritizing simplicity and trust.

Return:
1. edge cases
2. exact formulas
3. schema changes if needed
4. RPC updates
5. automated tests
6. owner-facing warnings
```

---

# Prompt 5 — Profit by SKU (Real, Not Fake)

```text
Build trustworthy Profit by SKU analytics for Lucky Store.

Requirements:
- revenue by SKU
- quantity sold
- weighted average COGS
- gross profit
- gross margin %
- top winners
- loss-making items
- date filters
- category filters

Use ledger + stock movement truth only.
No fake cached math.

Web owner panel only.

Return:
1. SQL/materialized views
2. API endpoints
3. React screens
4. performance optimization for large datasets
5. acceptance tests
```

---

# Prompt 6 — KPI Instrumentation

```text
Implement operator-grade KPI tracking for Lucky Store.

Track daily per store:
- sales recorded digitally %
- purchases recorded digitally %
- cash variance incidents
- avg checkout time
- duplicate transactions blocked
- receivables outstanding
- collections recovered today
- weekly owner sessions
- sync failures

Need event instrumentation, storage model, and scorecard queries.

Return:
1. telemetry schema
2. event emit points in app
3. dashboard tables
4. alert thresholds
```

---

# Prompt 7 — Production Scorecard

```text
Create a Lucky Store production scorecard screen for internal operators.

Show:
- active stores
- transactions today
- crash/error rate
- sync failures
- average sale latency
- stores with repeated cash shortages
- stores with low usage
- collections recovery leaderboard

Web admin internal tool only.

Return React implementation + backend queries.
```

---

# Prompt 8 — QA / Test Assault

```text
Generate a serious QA test suite for Lucky Store Month 2 systems.

Need tests for:
- duplicate submissions
- race conditions
- concurrent payments
- overdue calculations
- wrong cost inputs
- negative stock attempts
- offline queue replay
- statement accuracy
- large dataset performance

Return:
1. unit tests
2. integration tests
3. load tests
4. manual test checklist
```

---

# Prompt 9 — Pilot Rollout Plan

```text
Create a 30-day pilot rollout plan for Lucky Store Month 2 features.

Need:
- feature flags
- pilot store selection criteria
- daily metrics review
- owner feedback loop
- bug triage rules
- rollback plan
- success criteria to release broadly

Return execution calendar.
```

---

# Prompt 10 — Month 3 Readiness Gate

```text
Before building Month 3 competitive intelligence, audit whether Month 2 is successful.

Use thresholds:
- receivables recovery improved
- weekly owner retention improved
- purchase entry adoption high
- profit reports trusted
- low support burden

Return go/no-go decision framework.
```

---

# My Ruthless Advice

Start with only:

1. Prompt 2
2. Prompt 3
3. Prompt 5
4. Prompt 8

Those likely create the most business value fastest.

---

# Final Truth

Don’t ask Antigravity to “build features.”

Ask it to **solve cashflow, margins, and collections.**
I dug through the available signals and prior extracted repo structure. Here’s the **four-part ruthless audit** you asked for.

# Executive Summary

Lucky Store POS looks like a **real founder-led product with traction potential**, but it is at the stage where many startups stall:

* founder becomes bottleneck
* codebase complexity rises faster than revenue
* security assumptions lag product growth
* no repeatable sales machine

You need to transition from **builder mode** to **company mode**.

---

# 1. GitHub Commit History Audit

## Find velocity issues, abandoned directions, founder bottlenecks

I don’t have full raw commit logs through the connector, so this is based on repo behavior signals + common founder repo patterns.

## Likely Current State

### Single-Founder Throughput Dependency

If most commits come from one person (likely you), then:

* all architecture decisions route through founder
* bug fixes queue behind founder
* product speed capped by one brain

That works until customers arrive.

## Red Flags to Check Immediately

Run this locally:

```bash id="5s3s3q"
git shortlog -sn --all
```

If one person has 80%+ commits, you are the bottleneck.

### Commit Pattern Risk

Run:

```bash id="oz7zk9"
git log --pretty=format:"%h %ad %s" --date=short --since="6 months ago"
```

If you see:

* bursts of 20 commits in one day, then silence
* many “fix”, “update”, “minor” messages
* no release tags

Then velocity is chaotic, not managed.

## Brutal Advice

Need cadence:

```text id="yjlwm3"
Weekly release
Daily small merges
Monthly roadmap checkpoint
Quarterly architecture cleanup
```

## Immediate Fix

Use milestones:

* v1.1 Stability
* v1.2 Offline Trust
* v1.3 Payments & Retention

Without milestones, you’re just typing.

---

# 2. Flutter Code Architecture Audit

## Specific files to refactor first

Based on your structure (`screens/services/providers/models/widgets`), you’re likely entering maintenance pain.

## Highest-Risk Files (Typical in Your Stage)

### 1. `home_page.dart`

Usually becomes monster file controlling:

* nav
* product grid
* cart
* dialogs
* permissions
* scanner hooks

### Refactor:

Split into:

```text id="v2ukjm"
home_shell.dart
product_panel.dart
cart_panel.dart
quick_actions.dart
home_controller.dart
```

---

### 2. Checkout / Sales Screen

Likely business logic mixed with UI.

Need:

```text id="i2r3pw"
SaleController
PricingService
PaymentCoordinator
ReceiptService
```

---

### 3. Inventory Screens

Often duplicated create/edit/search logic.

Need single domain module:

```text id="t55h2v"
features/inventory/
  inventory_repository.dart
  inventory_controller.dart
  inventory_page.dart
```

---

### 4. Sync Services

Anything named:

```text id="7c6t8t"
sync_service.dart
offline_service.dart
queue_service.dart
```

These need highest scrutiny.

Move to deterministic architecture:

```text id="2up9ga"
Local DB -> PendingOps -> SyncEngine -> Server ACK
```

---

## Structural Migration Plan

Current:

```text id="mxqwsd"
screens/
services/
providers/
```

Target:

```text id="wmwdu7"
features/
  sales/
  inventory/
  reports/
  auth/
core/
  networking/
  db/
  ui/
```

## State Management

Provider is fine until it isn’t.

Move gradually to **Riverpod**.

---

# 3. Supabase Security Audit

## RLS, leakage risk, inventory corruption risk

This is where many POS startups are dangerously casual.

## Immediate Threat Model

If store A can ever query store B’s data, game over.

## Must Have Tables Scoped By:

```sql id="7n11zx"
tenant_id
store_id
created_by
```

## Must Have RLS Example

```sql id="0j0c6u"
create policy "store can view own rows"
on inventory
for select
using (store_id = auth.jwt() ->> 'store_id');
```

(Exact syntax depends on claims structure.)

## Inventory Corruption Risks

### If stock updates happen client-side:

Bad.

Need RPC:

```sql id="eowmhy"
begin;
select quantity from inventory where id = ... for update;
update inventory set quantity = quantity - x;
insert into stock_ledger ...
commit;
```

## Must Have Audit Tables

Every change to:

* inventory
* refunds
* voids
* discounts
* purchase edits

Should log:

```text id="8vk3yl"
who
when
before
after
device
reason
```

## Secret Handling

You listed `.env` as asset earlier.

Check immediately:

* no service_role key in app
* no DB passwords
* no admin bypass keys

## Realtime Risk

If realtime channels are broad, users may receive events from other stores unless filtered correctly.

---

# 4. Bangladesh Go-To-Market Plan

## First 100 paying stores

This matters more than code now.

## Who To Target First

Do **not** target everyone.

Start with one niche:

### Best Initial Niches

1. Grocery / mini marts
2. Fashion retail shops
3. Pharmacies
4. Mobile accessories shops

Pick one first.

## Why

Each vertical has different workflows.

Generic POS sells poorly.

---

## Offer Structure

### Pricing Example

```text id="sq5j3m"
Free Trial 14 days
৳999 / month single outlet
৳1999 / month multi-user
৳3999 / month multi-branch + reports
```

(Adjust after interviews.)

---

## Acquisition Strategy

### Channel 1: Field Sales

Visit markets:

* Chattogram
* Dhaka wholesale zones
* local retail clusters

Demo live.

### Channel 2: Resellers

Computer shops already install printers/scanners.

Give them commission.

### Channel 3: WhatsApp Referrals

Existing merchants refer nearby stores.

Reward with free month.

---

## Killer Retention Features for Bangladesh

1. Daily WhatsApp sales summary
2. Due collection reminders
3. Bangla receipts
4. bKash/Nagad reconciliation
5. Offline confidence

---

## 100 Store Execution Plan (90 Days)

### Month 1

* 10 pilot stores free/discounted
* founder support personally
* fix pain fast

### Month 2

* convert 7 of 10 to paid
* get testimonials
* launch referral

### Month 3

* 3 resellers each closing 10 stores
* reach 50–100 installs pipeline

---

# Brutal Truth

You do **not** need more features to reach 100 stores.

You need:

* trust
* onboarding speed
* support responsiveness
* clear pricing
* visible ROI

---

# What I’d Do This Week

## Engineering

* stock RPC
* audit logs
* CI
* local DB reliability

## Growth

* one-page sales deck
* 10-store pilot list
* referral plan
* WhatsApp demo script

---

# Final Assessment

Lucky Store POS can absolutely become a paying business.

But if you keep acting like a solo developer instead of an operator, it will remain a clever repo.

---

# Most Important Next Move

I’d recommend I build you a **90-Day Founder Execution Plan for Lucky Store POS (Bangladesh market)** with weekly targets, pricing, acquisition scripts, and product priorities.
LUCKY STORE POS — 90 DAY EXECUTION PLAN (CURSOR-READY)
North Star (DO NOT LOSE THIS)

A shop owner can run sales offline for 12 hours with zero data loss, and reconcile stock perfectly when internet returns.

Everything else is secondary.

PHASE 0 — CODEBASE LOCKDOWN (Days 1–7)
Goal:

Stop chaos before adding features.

TASK 0.1 — Create Feature-Based Architecture

Cursor Task:

Refactor lib/ into feature-based structure:

Create:
lib/features/sales/
lib/features/inventory/
lib/features/auth/
lib/features/reports/
lib/core/

Move existing files without changing logic.

Do NOT refactor logic yet.
Only relocate files.
TASK 0.2 — Add Core Layer
Create core modules:

lib/core/network/
lib/core/db/
lib/core/errors/
lib/core/utils/
TASK 0.3 — Introduce Standard Error Handling
Create Result type:

class Result<T> {
  final T? data;
  final String? error;
  final bool isSuccess;
}

Replace all raw try/catch returns gradually.

TASK 0.4 — Add Git Discipline
Add GitHub branch rules:

main = production
develop = staging
feature/* = new work
hotfix/* = urgent fixes
PHASE 1 — INVENTORY TRUTH ENGINE (Days 8–21)
Goal:

Make stock impossible to break.

TASK 1.1 — Create Inventory RPC (Supabase)
Create Supabase SQL RPC:

deduct_stock(product_id, quantity, store_id)

Must:
- use FOR UPDATE lock
- prevent negative stock
- insert stock_ledger entry
- be atomic transaction
TASK 1.2 — Create Stock Ledger Table
Create table stock_ledger:

id
product_id
store_id
change_amount
type (sale, purchase, return, adjustment)
created_at
created_by
TASK 1.3 — Replace ALL direct stock updates
Search app for direct inventory updates.

Replace with:
InventoryRepository.deductStock()
TASK 1.4 — Add Audit Trail
Log every inventory change:

before_quantity
after_quantity
action_type
user_id
device_id
timestamp
PHASE 2 — OFFLINE ENGINE (Days 22–40)
Goal:

POS must work without internet.

TASK 2.1 — Add Drift DB
Add Drift SQLite database:

Tables:
- local_sales_queue
- local_inventory_cache
- sync_status
TASK 2.2 — Create Sync Engine
Implement SyncEngine:

Functions:
- enqueueSale()
- processQueue()
- retryFailed()
- markSynced()

Must be idempotent
TASK 2.3 — Offline Sale Flow
Modify checkout flow:

IF offline:
  save to local DB
  mark pending sync
ELSE:
  send to Supabase RPC immediately
TASK 2.4 — Conflict Resolution Rule
Define rule:

Server is source of truth

Client can never overwrite server stock blindly
PHASE 3 — CASHIER SPEED SYSTEM (Days 41–55)
Goal:

Fastest POS in Bangladesh.

TASK 3.1 — Barcode Instant Add
Barcode scan must:

- find product locally first
- fallback to server if needed
- add to cart instantly (<200ms)
TASK 3.2 — One-Tap Checkout
Checkout flow must be:

Scan → Add → Pay → Print

No extra screens
TASK 3.3 — Cart State Optimization
Move cart state into single controller:

CartController:
- addItem()
- removeItem()
- applyDiscount()
- calculateTotal()
PHASE 4 — PRINTER RELIABILITY (Days 56–65)
Goal:

Never lose receipt trust.

TASK 4.1 — Unified Printer Interface
Create:

abstract class PrinterService {
  printReceipt()
  printRefund()
  reprintLast()
}
TASK 4.2 — Retry Queue
If print fails:

- store print job locally
- retry automatically
- allow manual reprint
PHASE 5 — OWNER RETENTION ENGINE (Days 66–80)
Goal:

Make store owner addicted to app.

TASK 5.1 — Daily WhatsApp Report
Send daily:

- total sales
- profit estimate
- top products
- due amount
TASK 5.2 — Due Reminder System
Auto notify:

- overdue customers
- partial payments
- weekly reminders
TASK 5.3 — Low Stock Alerts
Trigger alert when:

stock < threshold
PHASE 6 — GO-TO-MARKET (Days 81–90)
Goal:

First 100 paying stores.

TASK 6.1 — Landing Page
Create simple page:

- demo video
- pricing
- WhatsApp contact button
TASK 6.2 — Demo Script for Sales
Create script:

1. Scan product
2. Add to cart
3. Checkout in 10 seconds
4. Print receipt
5. Show offline mode
TASK 6.3 — Pilot Stores
Find 10 stores:

Offer free 14-day trial
Assist onboarding personally
Collect feedback daily
TASK 6.4 — Referral System
Each store = referral code

Reward:
- 1 month free per referral
EXECUTION RULES (NON-NEGOTIABLE)
Rule 1

No new features until Phase 1 + 2 are stable.

Rule 2

Every feature must pass:

offline test
crash test
duplicate transaction test
Rule 3

If something breaks inventory → STOP everything.

WHAT THIS PLAN REALLY DOES

You are not building a POS anymore.

You are building:

A retail operating system for Bangladesh SMEs

That only works if:

stock is correct
checkout is fast
offline works
owner trusts reports
FINAL WARNING (IMPORTANT)

If you ignore architecture now:

app will slow down
bugs will increase exponentially
support load will crush you
growth will stall at ~20–30 stores

If you follow this:

you can realistically hit 100+ stores
then scale to reseller network
then expand regionally
