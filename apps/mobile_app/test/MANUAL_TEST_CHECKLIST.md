# Lucky Store Month 2 - QA Test Suite Manual Checklist

## Overview
This checklist covers manual testing scenarios for the Lucky Store Month 2 systems.

---

## 1. DUPLICATE SUBMISSION TESTS

### 1.1 POS Sale Idempotency
- [ ] Complete a sale with a known `transactionTraceId`
- [ ] Immediately attempt the same sale again with the same `transactionTraceId`
- [ ] **Expected**: Second attempt returns the same result (no duplicate sale)
- [ ] **Check**: `idempotency_keys` table has entry with `completed_at` set

### 1.2 Customer Payment Idempotency
- [ ] Record a customer payment with `p_idempotency_key = 'pay_12345_party-123'`
- [ ] Immediately submit the same payment again
- [ ] **Expected**: Second payment does NOT create duplicate ledger entries
- [ ] **Check**: `journal_batches` has only one entry for this idempotency key

### 1.3 Purchase Receiving Duplicate Invoice
- [ ] Create a purchase receipt with `invoice_number = 'INV-2026-001'`
- [ ] Try to create another receipt with the same `supplier_id` + `invoice_number`
- [ ] **Expected**: Second attempt fails with UNIQUE constraint violation
- [ ] **Check**: `purchase_receipts` table has only one record for this invoice

---

## 2. RACE CONDITIONS & CONCURRENT OPERATIONS

### 2.1 Concurrent Sales - Same Item
- [ ] Open two POS sessions (two devices or browsers)
- [ ] Both add the same item with quantity = available stock (e.g., 5 units each, but only 8 in stock)
- [ ] Complete both sales simultaneously
- [ ] **Expected**: At least one sale should fail
- [ ] **Check**: Stock never negative

### 2.2 Concurrent Payments - Same Customer
- [ ] Customer balance = 500
- [ ] Two cashiers process payments of 300 each simultaneously
- [ ] **Expected**: Both succeed or one rejected, final balance correct

### 2.3 Session State Consistency
- [ ] Try to open two sessions for the same cashier simultaneously
- [ ] **Expected**: Only one session should be active

### 2.4 Offline Sync Race
- [ ] While sync is in progress, trigger another sync
- [ ] **Expected**: Second sync is skipped
- [ ] **Check**: No concurrent RPC calls

---

## 3. CONCURRENT PAYMENT HANDLING

### 3.1 Split Payment - Multiple Methods
- [ ] Add items totaling 500
- [ ] Add payment: Cash 200, Card 300
- [ ] Complete sale
- [ ] **Expected**: Sale completes with two payment records
- [ ] **Check**: `sale_payments` has two rows

### 3.2 Overpayment Handling
- [ ] Customer balance = 200, pay 300
- [ ] **Expected**: New balance = -100 (credit)
- [ ] **Check**: Does NOT appear in receivables

### 3.3 Exact Payment
- [ ] Sale total = 485, use "Exact" button
- [ ] **Expected**: Complete without error

### 3.4 Change Calculation
- [ ] Sale = 450, pay 500 via Cash
- [ ] **Expected**: Change = 50 displayed correctly

---

## 4. OVERDUE CALCULATIONS

### 4.1 Days Overdue Accuracy
- [ ] Sale on 2026-03-01, check on 2026-04-27
- [ ] **Expected**: 57 days overdue

### 4.2 Aging Buckets
- [ ] Create customers with days: 15 (0-30), 45 (31-60), 75 (61-90), 120 (90+)
- [ ] **Expected**: Each in correct bucket

### 4.3 Future Date Edge Case
- [ ] Sale with future effective_date
- [ ] **Expected**: days_overdue = 0

### 4.4 Zero Balance Filter
- [ ] Customer with balance = 0
- [ ] **Expected**: Not in `get_receivables_aging`

---

## 5. WRONG COST INPUTS

### 5.1 Negative Cost
- [ ] Enter unit cost = -10 in purchase
- [ ] **Expected**: Validation error

### 5.2 Zero Cost
- [ ] Enter unit cost = 0
- [ ] **Expected**: Accepted

### 5.3 Large Cost
- [ ] Enter unit cost = 999999.99
- [ ] **Expected**: Accepted but may flag for review

### 5.4 Cost Precision
- [ ] Enter 10.12345, should round to 10.1235

---

## 6. NEGATIVE STOCK ATTEMPTS

### 6.1 Sale Exceeding Stock
- [ ] Item has 5 units, try to sell 10
- [ ] **Expected**: Rejected with `INSUFFICIENT_STOCK`

### 6.2 Negative Quantity in Cart
- [ ] Try to set quantity = -1
- [ ] **Expected**: Item removed

### 6.3 Zero Quantity Sale
- [ ] Try to complete sale with qty = 0
- [ ] **Expected**: Cannot complete (cart empty)

---

## 7. OFFLINE QUEUE REPLAY

### 7.1 Basic Offline → Online
- [ ] Enable offline mode, complete 3 sales
- [ ] **Expected**: 3 items in queue with state = 'pending'
- [ ] Restore network, trigger sync
- [ ] **Expected**: All 3 synced, state = 'synced'

### 7.3 Conflict Detection
- [ ] While offline, change item price in admin
- [ ] Sync offline sale (snapshot has old price)
- [ ] **Expected**: Conflict detected, state = 'conflict'

### 7.4 Failed Sync Retry
- [ ] Simulate server error, trigger sync
- [ ] **Expected**: State = 'failed', retryCount incremented, nextRetryAt set

### 7.5 Queue Persistence Across Restart
- [ ] Add items to offline queue, force close app, reopen
- [ ] **Expected**: Queue still there

---

## 8. STATEMENT ACCURACY

### 8.1 Double-Entry Balance
- [ ] Record customer payment of 500
- [ ] **Expected**: Debit Cash 500, Credit AR 500
- [ ] **Check**: Total debits = total credits

### 8.2 Running Balance
- [ ] Customer: Sale1+500, Sale2+300, Payment1-200
- [ ] **Expected**: Balances: 500 → 800 → 600

### 8.3 Statement vs Current Balance
- [ ] Check `parties.current_balance` vs ledger sum
- [ ] **Expected**: Both match

---

## 9. LARGE DATASET PERFORMANCE

### 9.1 Inventory Search (1000+ items)
- [ ] Load POS with 1000 items, search
- [ ] **Expected**: Results within 1 second

### 9.2 Customer List (500+ customers)
- [ ] Open receivables aging with 500+ customers
- [ ] **Expected**: Page loads within 3 seconds

### 9.3 Ledger Display (1000+ entries)
- [ ] Customer with 1000+ ledger entries
- [ ] **Expected**: Renders without lag

### 9.4 Offline Queue with 500 Items
- [ ] Simulate 500 queued transactions
- [ ] **Expected**: Saves/loads < 2 seconds

---

## 10. ADDITIONAL EDGE CASES

### 10.1 Cart Discount Exceeds Subtotal
- [ ] Subtotal = 100, try discount = 150
- [ ] **Expected**: Discount clamped to 100

### 10.2 Purchase Partial Payment
- [ ] Total cost = 1000, pay 600
- [ ] **Expected**: Payable = 400, supplier balance tracked

### 10.3 WhatsApp Reminder Logging
- [ ] Click WhatsApp button
- [ ] **Expected**: `customer_reminders` gets new row

### 10.4 Follow-up Note with Promise Date
- [ ] Add note with promise date = 2026-05-15
- [ ] **Expected**: Note saved, appears in customer details

---

## 11. SECURITY & PERMISSIONS

### 11.1 RLS - Customer Data Isolation
- [ ] Login as Store A user
- [ ] Try to access Store B customer data via API
- [ ] **Expected**: RLS blocks access

### 11.2 Manager-Only Operations
- [ ] Login as cashier, try to resolve follow-up note
- [ ] **Expected**: Permission denied (403)

---

**Total Tests**: ~60
**Tested By**: ________________
**Date**: ________________
**Version**: Month 2 Build ___________
