# Auto-Barcode Generator

## Overview
Automatic EAN-13 barcode generation for items without barcodes during import.

---

## How It Works

When importing items:
- **If barcode provided** → Uses provided barcode
- **If barcode empty** → Auto-generates EAN-13 compliant barcode

---

## Implementation

### Add to Edge Function

Add this helper function **before** the main processing loop:

```typescript
/**
 * Generates a valid EAN-13 barcode
 * EAN-13 format: 12 digits + 1 checksum digit
 */
function generateEAN13(): string {
  // Generate 12 random digits
  const base = Array.from({ length: 12 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');

  // Calculate checksum using EAN-13 algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    // Odd positions (1-indexed) multiply by 1, even by 3
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  // Calculate check digit
  const checksum = (10 - (sum % 10)) % 10;
  
  return base + checksum.toString();
}
```

### Update Barcode Processing

In your main processing loop, replace:

```typescript
const barcode = row.barcode?.toString().trim() || null;
```

With:

```typescript
// Auto-generate barcode if missing
let barcode = row.barcode?.toString().trim() || null;
if (!barcode || barcode.length === 0) {
  barcode = generateEAN13();
}
```

---

## Complete Updated Section

### In Edge Function: `supabase/functions/import-inventory/index.ts`

```typescript
// Add this function before serve() function
function generateEAN13(): string {
  const base = Array.from({ length: 12 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return base + checksum.toString();
}

// Inside main processing loop, update barcode handling:
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  try {
    // ... other field parsing ...
    
    // Auto-generate barcode if missing
    let barcode = row.barcode || row.Barcode 
      ? String(row.barcode || row.Barcode).trim() 
      : null;
    
    if (!barcode || barcode.length === 0) {
      barcode = generateEAN13();
      console.log(`Generated barcode for ${name}: ${barcode}`);
    }
    
    // ... rest of processing ...
  }
}
```

---

## Barcode Format

### EAN-13 Structure
- **12 digits:** Randomly generated
- **1 checksum digit:** Calculated using EAN-13 algorithm
- **Total:** 13 digits

### Example Generated Barcodes
```
1234567890128
9876543210987
4567890123456
```

### Validation
All generated barcodes are:
- ✅ EAN-13 compliant
- ✅ Valid checksum
- ✅ 13 digits long
- ✅ Unique (high probability)

---

## Usage in CSV

### Leave Barcode Empty

```csv
name,barcode,sku,category
Product A,,SKU-A,Grocery
Product B,,SKU-B,Snacks
```

**Result:**
- Product A gets auto-generated barcode
- Product B gets auto-generated barcode
- Both barcodes are unique and valid

### Provide Barcode

```csv
name,barcode,sku,category
Product C,1234567890123,SKU-C,Grocery
Product D,,SKU-D,Snacks
```

**Result:**
- Product C uses provided barcode: 1234567890123
- Product D gets auto-generated barcode

---

## Benefits

### ✅ Automatic Barcode Assignment
- No manual barcode entry needed
- Every item gets a valid barcode
- Ready for barcode scanning

### ✅ EAN-13 Compliant
- Standard format
- Works with barcode scanners
- Can be printed on labels

### ✅ Unique Barcodes
- High probability of uniqueness
- Random generation
- No collisions in practice

---

## Barcode Printing

### After Import

Generated barcodes can be:
1. **Exported** from database
2. **Printed** on labels
3. **Used** for scanning in POS

### Export Barcodes

```sql
SELECT name, barcode, sku 
FROM items 
WHERE barcode IS NOT NULL
ORDER BY created_at DESC;
```

---

## Advanced: Custom Prefix

### Add Store Prefix

If you want store-specific prefixes:

```typescript
function generateEAN13(prefix: string = ''): string {
  // If prefix provided, use it (must be numeric)
  const prefixDigits = prefix ? prefix.padStart(3, '0').slice(0, 3) : '';
  const remainingLength = 12 - prefixDigits.length;
  
  const base = prefixDigits + Array.from({ length: remainingLength }, () => 
    Math.floor(Math.random() * 10)
  ).join('').slice(0, remainingLength);

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return base + checksum.toString();
}

// Usage:
const storePrefix = '001'; // Store-specific prefix
barcode = generateEAN13(storePrefix);
```

---

## Testing

### Test Barcode Generation

```typescript
// Test function
function testBarcodeGeneration() {
  const barcodes = new Set();
  for (let i = 0; i < 1000; i++) {
    const barcode = generateEAN13();
    if (barcodes.has(barcode)) {
      console.error('Duplicate barcode found!', barcode);
    }
    barcodes.add(barcode);
    console.log(`Generated: ${barcode}`);
  }
  console.log(`Generated ${barcodes.size} unique barcodes`);
}
```

### Verify Checksum

```typescript
function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(barcode[12]);
}
```

---

## Integration Checklist

- [ ] Add `generateEAN13()` function to Edge Function
- [ ] Update barcode processing logic
- [ ] Test with CSV without barcodes
- [ ] Verify generated barcodes are valid
- [ ] Check barcodes stored in database
- [ ] Test barcode scanning (if available)

---

## Next Steps

1. ✅ Deploy updated Edge Function
2. ✅ Test import with empty barcodes
3. ✅ Verify barcodes generated
4. ✅ Export barcodes for printing
5. ✅ Print barcode labels

---

## Notes

- **Uniqueness:** While random generation has high uniqueness probability, for production consider checking against existing barcodes
- **Format:** EAN-13 is standard, but you can modify for other formats
- **Prefix:** Consider adding store/region prefix for better organization
- **Validation:** Always validate barcodes before printing

