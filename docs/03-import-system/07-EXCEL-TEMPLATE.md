# Complete Excel Template for Extended Import

## Overview
Full Excel template compatible with the extended importer (stock, batches, images).

---

## Template Structure

### Column Headers (Row 1)

```
name | barcode | sku | category | supplier | batch_code | expiry_date | cost | price | stock_qty | store_code | image_url
```

### Example Data (Rows 2-4)

| name | barcode | sku | category | supplier | batch_code | expiry_date | cost | price | stock_qty | store_code | image_url |
|------|---------|-----|----------|----------|------------|-------------|------|-------|-----------|------------|-----------|
| Parachute Oil 200ml | 1234567890123 | SKU-PO200 | Cosmetics | Marico | BATCH-001 | 2025-12-30 | 90 | 120 | 50 | BR1 | https://example.com/po200.jpg |
| Danish Cookies 300g | (auto) | SKU-DC300 | Snacks | Danish | B001 | 2025-10-10 | 180 | 240 | 20 | BR1 | |
| Sunsilk Pink Shampoo | 8901234509876 | SKU-SPINK | Personal Care | Unilever | HS-20 | 2026-01-15 | 130 | 180 | 35 | BR2 | |

---

## CSV Format (Copy-Paste Ready)

```csv
name,barcode,sku,category,supplier,batch_code,expiry_date,cost,price,stock_qty,store_code,image_url
Parachute Oil 200ml,1234567890123,SKU-PO200,Cosmetics,Marico,BATCH-001,2025-12-30,90,120,50,BR1,https://example.com/po200.jpg
Danish Cookies 300g,,SKU-DC300,Snacks,Danish,B001,2025-10-10,180,240,20,BR1,
Sunsilk Pink Shampoo,8901234509876,SKU-SPINK,Personal Care,Unilever,HS-20,2026-01-15,130,180,35,BR2,
```

---

## Column Specifications

### Required Columns

| Column | Required | Type | Format | Notes |
|--------|----------|------|--------|-------|
| `name` | ✅ Yes | Text | Any | Product name |

### Optional Columns

| Column | Required | Type | Format | Notes |
|--------|----------|------|--------|-------|
| `barcode` | ❌ No | Text | EAN-13 | Auto-generated if blank |
| `sku` | ❌ No | Text | Any | SKU code |
| `category` | ❌ No | Text | Any | Auto-created if new |
| `supplier` | ❌ No | Text | Any | Supplier name |
| `batch_code` | ❌ No | Text | Any | Batch identifier |
| `expiry_date` | ❌ No | Date | YYYY-MM-DD | Or Excel date |
| `cost` | ❌ No | Number | Decimal | Cost price |
| `price` | ❌ No | Number | Decimal | Selling price |
| `stock_qty` | ❌ No | Integer | Number | Requires store_code |
| `store_code` | ⚠️ If stock | Text | BR1, BR2, etc. | Must exist in stores |
| `image_url` | ❌ No | URL | http://... | Or local path |

---

## Usage Notes

### Barcode
- **Leave blank** → Auto-generated EAN-13 barcode
- **Provide value** → Uses provided barcode
- **Format:** 13 digits (EAN-13)

### Expiry Date
- **Excel date:** Can use Excel date format
- **Text format:** YYYY-MM-DD (e.g., 2025-12-30)
- **Empty:** No expiry date set

### Store Code
- **Must match** existing store codes (BR1, BR2, BR3)
- **Required** if `stock_qty` > 0
- **Case-sensitive:** Use exact code

### Stock Quantity
- **0 or empty:** No stock imported
- **Positive number:** Adds stock to store
- **Requires:** `store_code` must be provided

### Image URL
- **HTTP/HTTPS URL:** Direct link to image
- **Local path:** Use with image upload feature
- **Empty:** No image

---

## Template Variations

### Minimal Template (Items Only)
**Columns:** `name, barcode, category, cost, price`

Use for:
- Adding products without stock
- Initial product catalog setup
- Price updates only

### Standard Template (With Stock)
**Columns:** `name, barcode, category, cost, price, stock_qty, store_code`

Use for:
- Adding products with initial stock
- Single store imports
- Basic inventory setup

### Full Template (Complete)
**All columns included**

Use for:
- Complete inventory setup
- Batch tracking needed
- Supplier tracking needed
- Expiry date tracking
- Multi-store setup

---

## Excel Setup Tips

### 1. Format Headers
- Bold Row 1
- Background color: Light blue
- Freeze panes on Row 2

### 2. Data Validation

**Store Code Dropdown:**
1. Select column K (store_code)
2. Data → Data Validation
3. Allow: List
4. Source: `BR1,BR2,BR3`

**Category Dropdown:**
1. Select column D (category)
2. Data → Data Validation
3. Allow: List
4. Source: `Grocery,Cosmetics,Snacks,Personal Care,Beverages`

**Date Format:**
1. Select column G (expiry_date)
2. Format Cells → Date
3. Choose: YYYY-MM-DD

### 3. Formulas (Optional)

**Auto Batch Code:**
```
=CONCATENATE("BATCH-",TEXT(TODAY(),"YYYYMMDD"),"-",ROW()-1)
```

**Expiry Date (30 days):**
```
=TEXT(TODAY()+30,"YYYY-MM-DD")
```

**Expiry Date (90 days):**
```
=TEXT(TODAY()+90,"YYYY-MM-DD")
```

---

## Example Scenarios

### Scenario 1: New Products Only
```csv
name,barcode,category,cost,price
New Product 1,1111111111111,Grocery,50,75
New Product 2,2222222222222,Snacks,30,45
```

### Scenario 2: Products with Stock
```csv
name,barcode,category,cost,price,stock_qty,store_code
Product A,1111111111111,Grocery,50,75,100,BR1
Product B,2222222222222,Snacks,30,45,200,BR1
```

### Scenario 3: Products with Batches
```csv
name,barcode,category,supplier,batch_code,expiry_date,cost,price,stock_qty,store_code
Product C,3333333333333,Grocery,Supplier X,BATCH001,2025-12-31,40,60,150,BR1
```

### Scenario 4: Complete Entry
```csv
name,barcode,sku,category,supplier,batch_code,expiry_date,cost,price,stock_qty,store_code,image_url
Product D,4444444444444,SKU-D,Snacks,Supplier Y,BATCH002,2026-01-15,25,35,75,BR2,https://example.com/product-d.jpg
```

---

## Common Mistakes

### ❌ Wrong Store Code
```
store_code: br1  (lowercase - wrong)
store_code: BR1  (correct)
```

### ❌ Stock Without Store
```
stock_qty: 100, store_code: (empty)  (wrong)
stock_qty: 100, store_code: BR1  (correct)
```

### ❌ Invalid Date Format
```
expiry_date: 12/30/2025  (wrong)
expiry_date: 2025-12-30  (correct)
```

### ❌ Missing Name
```
name: (empty)  (wrong - name is required)
name: Product Name  (correct)
```

---

## Download Template

### Create Template File

Save as `templates/lucky-store-import-template.csv`:

```csv
name,barcode,sku,category,supplier,batch_code,expiry_date,cost,price,stock_qty,store_code,image_url
```

Or create Excel file: `templates/lucky-store-import-template.xlsx`

---

## Next Steps

1. ✅ Download/copy template
2. ✅ Fill in your product data
3. ✅ Verify store codes match
4. ✅ Check date formats
5. ✅ Test with small sample first
6. ✅ Import full file

---

## Template Reference Card

Keep this handy:

```
Required: name
Optional: barcode (auto if blank), sku, category, supplier, batch_code, expiry_date, cost, price, stock_qty, store_code, image_url

Store Codes: BR1, BR2, BR3
Date Format: YYYY-MM-DD
Stock: Requires store_code
```

