# Extended Import Testing Guide

## Overview
Comprehensive testing guide for the extended importer with stock, batches, and audit functionality.

---

## Pre-Testing Checklist

- [ ] Supabase database schema deployed
- [ ] At least one store created (e.g., BR1)
- [ ] Extended Edge Function deployed
- [ ] Test CSV files prepared
- [ ] Access to Supabase dashboard for verification

---

## Test Suite 1: Basic Item Import

### Test 1.1: Items Only (No Stock)
**File:** `test-items-only.csv`

```csv
name,barcode,sku,category,cost,price
Test Product 1,1111111111111,SKU001,Test Category,10,15
Test Product 2,2222222222222,SKU002,Test Category,20,25
```

**Expected:**
- ✅ 2 items inserted
- ✅ Category created
- ✅ No stock levels created
- ✅ No batches created

**Verify:**
```sql
SELECT name, barcode FROM items WHERE name LIKE 'Test Product%';
SELECT name FROM categories WHERE name = 'Test Category';
```

---

### Test 1.2: Items with Stock
**File:** `test-items-with-stock.csv`

```csv
name,barcode,category,cost,price,stock_qty,store_code
Test Product 3,3333333333333,Test Category,30,40,100,BR1
Test Product 4,4444444444444,Test Category,40,50,200,BR1
```

**Expected:**
- ✅ 2 items inserted
- ✅ Stock levels created (100, 200)
- ✅ Stock movements logged (2 entries)
- ✅ Store linked correctly

**Verify:**
```sql
SELECT i.name, sl.qty, s.code 
FROM items i
JOIN stock_levels sl ON sl.item_id = i.id
JOIN stores s ON s.id = sl.store_id
WHERE i.name LIKE 'Test Product%';
```

---

## Test Suite 2: Batch Import

### Test 2.1: Batch with Code Only
**File:** `test-batch-code.csv`

```csv
name,barcode,batch_code,stock_qty,store_code
Test Product 5,5555555555555,BATCH001,50,BR1
```

**Expected:**
- ✅ Item created
- ✅ Batch created with code BATCH001
- ✅ Stock level created
- ✅ Stock movement linked to batch

**Verify:**
```sql
SELECT b.batch_code, b.qty, i.name
FROM batches b
JOIN items i ON i.id = b.item_id
WHERE b.batch_code = 'BATCH001';
```

---

### Test 2.2: Batch with Supplier
**File:** `test-batch-supplier.csv`

```csv
name,barcode,supplier,batch_code,stock_qty,store_code
Test Product 6,6666666666666,ABC Suppliers,BATCH002,75,BR1
```

**Expected:**
- ✅ Batch created with supplier
- ✅ Supplier name stored

**Verify:**
```sql
SELECT batch_code, supplier FROM batches WHERE batch_code = 'BATCH002';
```

---

### Test 2.3: Batch with Expiry Date
**File:** `test-batch-expiry.csv`

```csv
name,barcode,batch_code,expiry_date,stock_qty,store_code
Test Product 7,7777777777777,BATCH003,2025-12-31,100,BR1
```

**Expected:**
- ✅ Batch created with expiry date
- ✅ Date parsed correctly

**Verify:**
```sql
SELECT batch_code, expiry_date FROM batches WHERE batch_code = 'BATCH003';
```

---

### Test 2.4: Full Batch (All Fields)
**File:** `test-batch-full.csv`

```csv
name,barcode,supplier,batch_code,expiry_date,stock_qty,store_code
Test Product 8,8888888888888,XYZ Corp,BATCH004,2026-06-30,150,BR1
```

**Expected:**
- ✅ All batch fields populated
- ✅ Linked to item correctly

**Verify:**
```sql
SELECT b.*, i.name 
FROM batches b
JOIN items i ON i.id = b.item_id
WHERE b.batch_code = 'BATCH004';
```

---

## Test Suite 3: Stock Management

### Test 3.1: Add Stock to Existing Item
**File:** `test-add-stock.csv`

```csv
name,barcode,stock_qty,store_code
Test Product 3,3333333333333,50,BR1
```

**Expected:**
- ✅ Stock increased from 100 to 150
- ✅ Stock movement logged (+50)
- ✅ Item not duplicated

**Verify:**
```sql
SELECT qty FROM stock_levels 
WHERE item_id = (SELECT id FROM items WHERE barcode = '3333333333333')
AND store_id = (SELECT id FROM stores WHERE code = 'BR1');
```

---

### Test 3.2: Stock in Multiple Stores
**File:** `test-multi-store.csv`

```csv
name,barcode,stock_qty,store_code
Test Product 9,9999999999999,100,BR1
Test Product 9,9999999999999,200,BR2
```

**Expected:**
- ✅ Same item, different stock levels
- ✅ Two stock_levels entries
- ✅ Two stock movements

**Verify:**
```sql
SELECT s.code, sl.qty
FROM stock_levels sl
JOIN stores s ON s.id = sl.store_id
JOIN items i ON i.id = sl.item_id
WHERE i.barcode = '9999999999999';
```

---

## Test Suite 4: Update Scenarios

### Test 4.1: Update Existing Item
**File:** `test-update-item.csv`

```csv
name,barcode,price
Test Product 1,1111111111111,20
```

**Expected:**
- ✅ Price updated from 15 to 20
- ✅ Item not duplicated
- ✅ Updated_at timestamp changed

**Verify:**
```sql
SELECT name, price, updated_at FROM items WHERE barcode = '1111111111111';
```

---

### Test 4.2: Update with Stock
**File:** `test-update-stock.csv`

```csv
name,barcode,stock_qty,store_code
Test Product 1,1111111111111,25,BR1
```

**Expected:**
- ✅ Stock level created/updated
- ✅ Stock movement logged

---

## Test Suite 5: Error Handling

### Test 5.1: Missing Store Code
**File:** `test-error-no-store.csv`

```csv
name,barcode,stock_qty
Test Error 1,ERROR001,100
```

**Expected:**
- ❌ Error: "stock_qty provided but store_code missing"
- ✅ Row skipped
- ✅ Error logged in response

---

### Test 5.2: Invalid Store Code
**File:** `test-error-invalid-store.csv`

```csv
name,barcode,stock_qty,store_code
Test Error 2,ERROR002,100,INVALID-STORE
```

**Expected:**
- ❌ Error: "Store code 'INVALID-STORE' not found"
- ✅ Row skipped
- ✅ Error logged

---

### Test 5.3: Missing Name
**File:** `test-error-no-name.csv`

```csv
name,barcode
,ERROR003
```

**Expected:**
- ❌ Error: "Missing name"
- ✅ Row skipped

---

### Test 5.4: Invalid Date Format
**File:** `test-error-date.csv`

```csv
name,barcode,expiry_date
Test Error 4,ERROR004,invalid-date
```

**Expected:**
- ⚠️ Date ignored (not critical)
- ✅ Item still created
- ✅ Batch created without expiry

---

## Test Suite 6: Audit Trail

### Test 6.1: Verify Stock Movements
After importing with stock:

**Verify:**
```sql
SELECT 
  sm.delta,
  sm.reason,
  sm.meta,
  i.name,
  s.code as store_code
FROM stock_movements sm
JOIN items i ON i.id = sm.item_id
JOIN stores s ON s.id = sm.store_id
WHERE sm.reason = 'import'
ORDER BY sm.created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ All imports logged
- ✅ Correct delta values
- ✅ Meta contains source info
- ✅ Linked to items and stores

---

### Test 6.2: Verify Batch Links
**Verify:**
```sql
SELECT 
  sm.id,
  b.batch_code,
  i.name,
  sm.delta
FROM stock_movements sm
JOIN batches b ON b.id = sm.batch_id
JOIN items i ON i.id = sm.item_id
WHERE sm.reason = 'import';
```

**Expected:**
- ✅ Stock movements linked to batches
- ✅ Batch codes match

---

## Test Suite 7: Large File Import

### Test 7.1: 1000 Items
**File:** `test-large-import.csv` (1000 rows)

**Expected:**
- ✅ All items imported
- ✅ Processing time < 60 seconds
- ✅ No timeout errors
- ✅ Summary shows correct counts

**Monitor:**
- Function execution time
- Database query performance
- Error rate

---

## Test Suite 8: Edge Cases

### Test 8.1: Empty CSV
**File:** `test-empty.csv` (headers only)

**Expected:**
- ❌ Error: "No data rows found"

---

### Test 8.2: Special Characters
**File:** `test-special-chars.csv`

```csv
name,barcode
Product "Special" & Co,SPEC001
Product <Test> Name,SPEC002
```

**Expected:**
- ✅ Names with special characters handled
- ✅ No SQL injection

---

### Test 8.3: Very Long Names
**File:** `test-long-name.csv`

```csv
name,barcode
Very Long Product Name That Exceeds Normal Length Limits And Should Still Work Correctly,LONG001
```

**Expected:**
- ✅ Long names accepted
- ✅ No truncation

---

### Test 8.4: Zero Stock
**File:** `test-zero-stock.csv`

```csv
name,barcode,stock_qty,store_code
Test Zero,ZERO001,0,BR1
```

**Expected:**
- ✅ Item created
- ✅ No stock level created (qty = 0)
- ✅ No stock movement logged

---

## Test Results Template

### Test Execution Log

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 1.1 | Items only | ⬜ Pass/Fail | |
| 1.2 | Items with stock | ⬜ Pass/Fail | |
| 2.1 | Batch code only | ⬜ Pass/Fail | |
| 2.2 | Batch with supplier | ⬜ Pass/Fail | |
| 2.3 | Batch with expiry | ⬜ Pass/Fail | |
| 3.1 | Add stock | ⬜ Pass/Fail | |
| 3.2 | Multi-store | ⬜ Pass/Fail | |
| 4.1 | Update item | ⬜ Pass/Fail | |
| 5.1 | Missing store | ⬜ Pass/Fail | |
| 5.2 | Invalid store | ⬜ Pass/Fail | |
| 6.1 | Audit trail | ⬜ Pass/Fail | |

---

## Cleanup After Testing

### Remove Test Data

```sql
-- Delete test items
DELETE FROM items WHERE name LIKE 'Test%';

-- Delete test categories
DELETE FROM categories WHERE name = 'Test Category';

-- Delete test batches
DELETE FROM batches WHERE batch_code LIKE 'BATCH%' OR batch_code LIKE 'TEST%';

-- Delete test stock levels (cascade should handle this)
-- But verify:
SELECT COUNT(*) FROM stock_levels 
WHERE item_id IN (SELECT id FROM items WHERE name LIKE 'Test%');
```

---

## Performance Benchmarks

### Expected Performance

| Rows | Expected Time | Max Time |
|------|---------------|----------|
| 10 | < 2s | 5s |
| 100 | < 10s | 20s |
| 1000 | < 60s | 120s |

### Monitor
- Function execution time
- Database query time
- Memory usage
- Error rate

---

## Next Steps After Testing

1. ✅ All tests pass
2. ✅ Performance acceptable
3. ✅ Error handling verified
4. ✅ Audit trail complete
5. ✅ Ready for production use

---

## Reporting Issues

When reporting issues, include:
- Test case ID
- CSV file content (sample)
- Expected vs actual result
- Error message (if any)
- Function logs
- Database state (relevant queries)

