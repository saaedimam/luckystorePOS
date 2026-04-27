# Lucky Store Month 2 - QA Test Suite Manual Checklist

## Overview
This checklist covers manual testing scenarios for the Lucky Store Month 2 systems:
- POS Sales & Payments
- Offline Queue & Sync
- Purchase Receiving
- Customer Ledger & Collections
- Overdue Management

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

### 1.4 Offline Queue Duplicate Detection
- [ ] Enqueue the same `clientTransactionId` twice while offline
- [ ] **Expected**: Second enqueue is silently ignored
- [ ] **Check**: Queue file (`offline_transaction_queue.json`) has only one entry

---

## 2. RACE CONDITIONS & CONCURRENT OPERATIONS

### 2.1 Concurrent Sales - Same Item
- [ ] Open two POS sessions (two devices or browsers)
- [ ] Both add the same item with quantity = available stock (e.g., 5 units each, but only 8 in stock)
- [ ] Complete both sales simultaneously (within 1 second)
- [ ] **Expected**: At least one sale should fail with `INSUFFICIENT_STOCK` or `CONFLICT`
- [ ] **Check**: Stock level is never negative

### 2.2 Concurrent Payments - Same Customer
- [ ] Customer balance = 500
- [ ] Two cashiers process payments of 300 each simultaneously
- [ ] **Expected**: One should succeed, the other might overpay (which is OK) or be rejected
- [ ] **Check**: Final balance is correct (should be -100 if both succeed, or 200 if one rejected)

### 2.3 Session State Consistency
- [ ] Try to open two sessions for the same cashier simultaneously
- [ ] **Expected**: Only one session should be active
- [ ] **Check**: `pos_sessions` table has only one `status = 'open'` for this cashier

### 2.4 Offline Sync Race
- [ ] While sync is in progress (`_isSyncing = true`), trigger another sync
- [ ] **Expected**: Second sync is skipped (guard clause)
- [ ] **Check**: No concurrent RPC calls to `complete_sale`

---

## 3. CONCURRENT PAYMENT HANDLING

### 3.1 Split Payment - Multiple Methods
- [ ] Add items totaling 500
- [ ] Add payment: Cash 200
- [ ] Add payment: Card 300
- [ ] Complete sale
- [ ] **Expected**: Sale completes with two payment records
- [ ] **Check**: `sale_payments` has two rows for this sale

### 3.2 Overpayment Handling
- [ ] Customer balance = 200
- [ ] Record payment of 300
- [ ] **Expected**: Payment accepted, new balance = -100 (credit)
- [ ] **Check**: Customer does NOT appear in receivables (balance_due > 0 filter)

### 3.3 Exact Payment
- [ ] Sale total = 485
- [ ] Use "Exact Cash" button to populate 485
- [ ] Complete sale
- [ ] **Expected**: No change due, sale completes cleanly

### 3.4 Change Calculation
- [ ] Sale total = 450
- [ ] Pay 500 via Cash
- [ ] **Expected**: Change = 50, displayed correctly
- [ ] **Check**: Receipt shows correct change amount

---

## 4. OVERDUE CALCULATIONS

### 4.1 Days Overdue Accuracy
- [ ] Create a credit sale for customer on 2026-03-01
- [ ] Check receivables on 2026-04-27
- [ ] **Expected**: Days overdue = 57 (March has 31 days: 30 + 27)
- [ ] **Check**: `get_receivables_aging` returns correct `days_overdue`

### 4.2 Aging Buckets
- [ ] Create customers with various `days_overdue`:
  - Customer A: 15 days → Bucket 0-30
  - Customer B: 45 days → Bucket 31-60
  - Customer C: 75 days → Bucket 61-90
  - Customer D: 120 days → Bucket 90+
- [ ] **Expected**: Each customer appears in correct aging bucket

### 4.3 Future Date Edge Case
- [ ] Create a sale with `effective_date` in the future
- [ ] **Expected**: `days_overdue` = 0 (or negative, treated as 0)
- [ ] **Check**: Customer does not incorrectly appear as overdue

### 4.4 Zero Balance Filter
- [ ] Customer with balance = 0
- [ ] **Expected**: Does NOT appear in `get_receivables_aging` results
- [ ] **Check**: HAVING clause filters out zero/negative balances

---

## 5. WRONG COST INPUTS

### 5.1 Negative Cost Rejection
- [ ] In Purchase Receiving, enter unit cost = -10
- [ ] **Expected**: Validation error, cannot submit
- [ ] **Check**: Form shows error message

### 5.2 Zero Cost Allowed
- [ ] Enter unit cost = 0 (free item / sample)
- [ ] **Expected**: Accepted (valid case)
- [ ] **Check**: Purchase receipt saves with cost = 0

### 5.3 Extremely Large Cost
- [ ] Enter unit cost = 999999.99
- [ ] **Expected**: Accepted but flagged for review (if validation exists)
- [ ] **Check**: Consider adding a max cost validation

### 5.4 Cost Precision
- [ ] Enter unit cost = 10.12345
- [ ] **Expected**: Should be rounded to 4 decimal places (10.1235)
- [ ] **Check**: `NUMERIC(15,4)` in database stores correctly

---

## 6. NEGATIVE STOCK ATTEMPTS

### 6.1 Sale Exceeding Stock
- [ ] Item has 5 units in stock
- [ ] Try to sell 10 units
- [ ] **Expected**: Sale rejected with `INSUFFICIENT_STOCK` or adjusted to 5
- [ ] **Check**: Stock never goes negative

### 6.2 Negative Quantity in Cart
- [ ] Try to set quantity = -1 in cart
- [ ] **Expected**: Item removed from cart (or error)
- [ ] **Check**: `setQty` with qty <= 0 calls `removeItem`

### 6.3 Zero Quantity Sale
- [ ] Try to complete sale with qty = 0 for all items
- [ ] **Expected**: Cannot complete (cart is empty)
- [ ] **Check**: `completeSale` throws "Cart is empty"

### 6.4 Stock Validation Before Sale
- [ ] Call `validate_sale_intent` with item qty > stock
- [ ] **Expected**: Returns `validation_status = 'INSUFFICIENT_STOCK'`
- [ ] **Check**: Sale does not proceed

---

## 7. OFFLINE QUEUE REPLAY

### 7.1 Basic Offline → Online Flow
- [ ] Enable offline mode (or turn off network)
- [ ] Complete 3 sales offline
- [ ] **Expected**: Sales are queued (not sent to server)
- [ ] **Check**: `offline_transaction_queue.json` has 3 entries with `state = 'pending'`

### 7.2 Sync When Online
- [ ] Restore network connection
- [ ] Trigger sync (or wait for auto-sync)
- [ ] **Expected**: All 3 sales are synced
- [ ] **Check**: Queue states change to `synced`, `ledger_entries` created

### 7.3 Conflict Detection
- [ ] While offline, change item price in admin panel
- [ ] Sync offline sale (snapshot has old price)
- [ ] **Expected**: Conflict detected (`PRICE_CHANGED`)
- [ ] **Check**: Queue item gets `state = 'conflict'`, `requiresManagerReview = true`

### 7.4 Failed Sync Retry
- [ ] Simulate server error (turn off server)
- [ ] Trigger sync
- [ ] **Expected**: State changes to `failed`, `retryCount` incremented
- [ ] **Check**: `nextRetryAt` is set to future time (exponential backoff)

### 7.5 Queue Persistence Across App Restart
- [ ] Add items to offline queue
- [ ] Force close the app
- [ ] Reopen app
- [ ] **Expected**: Queue is still there (loaded from file)
- [ ] **Check**: `_loadQueue()` restores all pending items

### 7.6 Large Queue Replay (50+ items)
- [ ] Queue 50 sales offline
- [ ] Sync all at once
- [ ] **Expected**: All sync successfully (or fail gracefully)
- [ ] **Check**: Monitor performance, no timeouts

---

## 8. STATEMENT ACCURACY

### 8.1 Ledger Double-Entry Balance
- [ ] Record a customer payment of 500
- [ ] **Expected**: Two ledger entries created:
  - Debit: Cash account 500
  - Credit: Accounts Receivable 500
- [ ] **Check**: Total debits = Total credits in `journal_batches`

### 8.2 Running Balance Calculation
- [ ] Customer has entries:
  - Sale 1: +500
  - Sale 2: +300
  - Payment 1: -200
- [ ] Open customer ledger
- [ ] **Expected**: Running balance shown correctly:
  - After Sale 1: 500
  - After Sale 2: 800
  - After Payment 1: 600
- [ ] **Check**: `balanceAtPoint` calculation is correct

### 8.3 Statement vs Current Balance
- [ ] Check customer in admin panel
- [ ] Compare `parties.current_balance` with ledger calculation
- [ ] **Expected**: Both values match
- [ ] **Check**: Run SQL: `SELECT SUM(debit_amount - credit_amount) FROM ledger_entries WHERE party_id = '...'`

### 8.4 Debit/Credit Column Display
- [ ] Open customer ledger in admin web
- [ ] **Expected**: 
  - Debit column shows only debit amounts
  - Credit column shows only credit amounts
  - Empty cells show "-"
- [ ] **Check**: UI displays correctly

### 8.5 Voided Sale Reversal
- [ ] Void a previous sale
- [ ] **Expected**: Reversal entries created (debit ↔ credit swapped)
- [ ] **Check**: Customer balance returns to pre-sale amount

---

## 9. LARGE DATASET PERFORMANCE

### 9.1 Inventory Search (1000+ items)
- [ ] Load POS with 1000+ items in inventory
- [ ] Search for an item
- [ ] **Expected**: Results appear within 1 second
- [ ] **Check**: Use browser DevTools / Flutter Performance overlay

### 9.2 Customer List (500+ customers)
- [ ] Open receivables aging report with 500+ customers
- [ ] **Expected**: Page loads within 3 seconds
- [ ] **Check**: RPC `get_receivables_aging` performance

### 9.3 Ledger Display (1000+ entries)
- [ ] Customer has 1000+ ledger entries
- [ ] Open their statement
- [ ] **Expected**: Statement renders without lag
- [ ] **Check**: Pagination or virtual scrolling works

### 9.4 Offline Queue with 500 Items
- [ ] Simulate 500 queued transactions
- [ ] **Expected**: Queue file saves/loads quickly (< 2 seconds)
- [ ] **Check**: JSON serialization performance

---

## 10. ADDITIONAL EDGE CASES

### 10.1 Cart Discount Exceeds Subtotal
- [ ] Subtotal = 100
- [ ] Try to apply discount = 150
- [ ] **Expected**: Discount clamped to 100 (subtotal)
- [ ] **Check**: `setCartDiscount` uses `.clamp(0, subtotal)`

### 10.2 Multiple Devices Same Cashier
- [ ] Login same cashier on two devices
- [ ] Open POS session on both
- [ ] **Expected**: Behavior depends on business rule (allow or prevent?)
- [ ] **Check**: Document expected behavior

### 10.3 Purchase Receiving - Partial Payment
- [ ] Total cost = 1000
- [ ] Pay only 600
- [ ] **Expected**: Payable = 400, supplier balance created
- [ ] **Check**: `purchase_receipts.amount_paid` = 600, balance tracked

### 10.4 WhatsApp Reminder Logging
- [ ] Click WhatsApp button for overdue customer
- [ ] **Expected**: `customer_reminders` table gets new row
- [ ] **Check**: `log_customer_reminder` RPC is called

### 10.5 Follow-up Note with Promise Date
- [ ] Add follow-up note with promise date = 2026-05-15
- [ ] **Expected**: Note saved, appears in customer details
- [ ] **Check**: `followup_notes` table has correct data

---

## 11. SECURITY & PERMISSIONS

### 11.1 RLS - Customer Data Isolation
- [ ] Login as Store A user
- [ ] Try to access Store B customer data via API
- [ ] **Expected**: RLS blocks access (empty result)
- [ ] **Check**: RPC returns only tenant's data

### 11.2 Manager-Only Operations
- [ ] Login as cashier (role = 'cashier')
- [ ] Try to resolve follow-up note
- [ ] **Expected**: Permission denied (403)
- [ ] **Check**: RLS policy `fn_update` checks role IN ('admin', 'manager')

---

## Test Sign-off

**Tested By**: ___________________  
**Date**: ___________________  
**Environment**: [ ] Dev  [ ] Staging  [ ] Production  
**Version**: Month 2 - Build ___________

### Summary
- Total Tests: ~60
- Passed: ___
- Failed: ___
- Blocked: ___

### Notes
_________________________________________________  
_________________________________________________  
_________________________________________________
