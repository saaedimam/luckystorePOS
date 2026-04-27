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
