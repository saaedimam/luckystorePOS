# Excel Template Guide for Extended Import

## Overview
This guide helps you create Excel templates for the extended importer with stock, batches, and audit support.

---

## Template Structure

### Required Columns (in order)

| Column | Required | Type | Example | Notes |
|--------|----------|------|---------|-------|
| name | ✅ Yes | Text | Parachute Oil | Product name |
| barcode | ❌ No | Text | 1234567890123 | Barcode |
| sku | ❌ No | Text | SKU101 | SKU code |
| category | ❌ No | Text | Cosmetics | Category name |
| supplier | ❌ No | Text | ABC Suppliers | Supplier name |
| batch_code | ❌ No | Text | BATCH001 | Batch identifier |
| expiry_date | ❌ No | Date | 2025-12-31 | Format: YYYY-MM-DD |
| cost | ❌ No | Number | 90.00 | Cost price |
| price | ❌ No | Number | 120.00 | Selling price |
| stock_qty | ❌ No | Integer | 50 | Quantity (requires store_code) |
| store_code | ⚠️ If stock | Text | BR1 | Store code (required if stock_qty > 0) |
| image_url | ❌ No | URL | https://... | Product image URL |

---

## Creating Template in Excel

### Step 1: Create Headers

1. Open Excel
2. Row 1: Add column headers
3. Format as header row (bold, background color)

Example:
```
A1: name
B1: barcode
C1: sku
D1: category
E1: supplier
F1: batch_code
G1: expiry_date
H1: cost
I1: price
J1: stock_qty
K1: store_code
L1: image_url
```

### Step 2: Add Data Validation (Optional)

**Store Code Dropdown:**
1. Select column K (store_code)
2. Data → Data Validation
3. Allow: List
4. Source: `BR1,BR2,KT-A,KT-B` (your store codes)

**Category Dropdown:**
1. Select column D (category)
2. Data → Data Validation
3. Allow: List
4. Source: `Grocery,Cosmetics,Snacks,Eggs` (your categories)

**Date Format:**
1. Select column G (expiry_date)
2. Format Cells → Date
3. Choose: YYYY-MM-DD format

### Step 3: Add Example Rows

Add 2-3 example rows:

```
Row 2: Parachute Oil | 1234567890123 | SKU101 | Cosmetics | ABC Suppliers | BATCH001 | 2025-12-31 | 90 | 120 | 50 | BR1 | https://example.com/oil.jpg
Row 3: Egg Loose | | EGG001 | Eggs | Fresh Farm | EGG20250101 | 2025-01-15 | 8 | 10.25 | 200 | BR1 | https://example.com/egg.jpg
```

### Step 4: Freeze Headers

1. Select Row 2
2. View → Freeze Panes → Freeze Panes

---

## Template Variations

### Minimal Template (Items Only)
**Columns:** name, barcode, sku, category, cost, price

Use when:
- Just adding products
- No stock tracking needed
- No batches needed

### Standard Template (With Stock)
**Columns:** name, barcode, category, cost, price, stock_qty, store_code

Use when:
- Adding products with initial stock
- Single store
- No batch tracking needed

### Full Template (Complete)
**All columns:** name, barcode, sku, category, supplier, batch_code, expiry_date, cost, price, stock_qty, store_code, image_url

Use when:
- Complete inventory setup
- Batch tracking needed
- Supplier tracking needed
- Expiry date tracking needed

---

## CSV Export from Current System

### Update Export Function

Add to `lucky-store-stock.html`:

```javascript
function exportToExtendedFormat() {
  const transaction = db.transaction(['items'], 'readonly');
  const objectStore = transaction.objectStore('items');
  const request = objectStore.getAll();

  request.onsuccess = () => {
    const items = request.result;
    
    // Get current store code (you may need to add this setting)
    const storeCode = prompt('Enter store code (e.g., BR1):', 'BR1') || 'BR1';
    
    // Convert to extended format
    const csvData = [
      ['name', 'barcode', 'sku', 'category', 'supplier', 'batch_code', 'expiry_date', 'cost', 'price', 'stock_qty', 'store_code', 'image_url']
    ];
    
    items.forEach(item => {
      const imageUrl = item.image instanceof Blob ? '' : (item.image || '');
      
      csvData.push([
        item.name || '',
        item.barcode || '',
        '', // SKU - add if you track it
        item.category || '',
        '', // Supplier - add if you track it
        '', // Batch code - add if you track it
        '', // Expiry date - add if you track it
        (item.cost || 0).toFixed(2),
        (item.price || 0).toFixed(2),
        item.qty || 0, // Stock quantity from current system
        storeCode,
        imageUrl
      ]);
    });
    
    // Convert to CSV
    const csv = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky-store-export-${storeCode}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
}
```

---

## Excel Formulas (Optional)

### Auto-generate Batch Code
```
=CONCATENATE("BATCH",TEXT(TODAY(),"YYYYMMDD"),"-",ROW()-1)
```

### Calculate Expiry Date (30 days from today)
```
=TEXT(TODAY()+30,"YYYY-MM-DD")
```

### Validate Store Code
```
=IF(ISBLANK(K2),"",IF(OR(K2="BR1",K2="BR2",K2="KT-A"),"","Invalid store code"))
```

---

## Template File

### Download Template

Create `templates/inventory-import-template.xlsx` with:
- Headers in Row 1
- 2 example rows
- Data validation
- Formatted columns
- Instructions sheet

---

## Usage Instructions

### For Users

1. **Download template** from system
2. **Fill in product data**:
   - Required: name
   - Optional: All other columns
3. **For stock import**:
   - Fill `stock_qty`
   - Fill `store_code` (must match existing store)
4. **For batches**:
   - Fill `batch_code` (optional)
   - Fill `supplier` (optional)
   - Fill `expiry_date` (format: YYYY-MM-DD)
5. **Save as CSV or XLSX**
6. **Upload** via import function

---

## Common Mistakes

### ❌ Wrong Store Code
**Problem:** Store code doesn't exist  
**Solution:** Check available stores first

### ❌ Wrong Date Format
**Problem:** Expiry date not recognized  
**Solution:** Use YYYY-MM-DD format

### ❌ Stock Without Store
**Problem:** stock_qty > 0 but no store_code  
**Solution:** Add store_code column

### ❌ Missing Name
**Problem:** Empty name field  
**Solution:** Name is required

---

## Best Practices

1. ✅ Always use template (don't create from scratch)
2. ✅ Fill required fields first
3. ✅ Validate store codes before import
4. ✅ Use consistent date format
5. ✅ Test with small sample first
6. ✅ Keep backup of original file

---

## Next Steps

1. Create template file
2. Add to project repository
3. Document for users
4. Test import with template
5. Update export function

