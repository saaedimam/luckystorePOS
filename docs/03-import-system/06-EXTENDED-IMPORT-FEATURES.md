# Extended Import Plan - Stock, Batches & Audit

## Overview
This plan extends the basic CSV/XLSX importer to handle:
- ✅ Per-store stock quantities
- ✅ Batch creation (supplier, batch_code, expiry_date)
- ✅ Stock movement audit entries
- ✅ Full inventory seeding

---

## Phase 1: Prerequisites & Setup

### 1.1 Database Setup
**Priority: CRITICAL**

- [ ] Verify SQL schema deployed (from `docs/02-setup/02-SUPABASE-SCHEMA.md`)
- [ ] Ensure `stores` table has entries with `code` values
- [ ] Verify `batches` table exists
- [ ] Verify `stock_levels` table exists
- [ ] Verify `stock_movements` table exists

**Deliverable:** Database ready for extended import

### 1.2 Create Default Store
**Priority: CRITICAL**

Run this SQL in Supabase:

```sql
-- Create default store if doesn't exist
INSERT INTO stores (code, name, address, timezone)
VALUES ('BR1', 'Main Branch', 'Your Address', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;
```

Or create multiple stores:
```sql
INSERT INTO stores (code, name) VALUES
  ('BR1', 'Main Branch'),
  ('BR2', 'Branch 2'),
  ('KT-A', 'Kotwali Branch A')
ON CONFLICT (code) DO NOTHING;
```

**Deliverable:** At least one store exists in database

---

## Phase 2: Extended Edge Function

### 2.1 Update Function Code
**Priority: CRITICAL**

- [ ] Replace `supabase/functions/import-inventory/index.ts` with extended version
- [ ] Verify all imports correct
- [ ] Test function syntax

**Deliverable:** Updated Edge Function code

### 2.2 Deploy Extended Function
**Priority: HIGH**

- [ ] Deploy: `supabase functions deploy import-inventory`
- [ ] Verify deployment successful
- [ ] Test with sample CSV

**Deliverable:** Extended function deployed

---

## Phase 3: CSV Format & Templates

### 3.1 Extended CSV Format

**Required Columns:**
- `name` (required) - Product name
- `barcode` (optional) - Barcode
- `sku` (optional) - SKU code
- `category` (optional) - Category name
- `supplier` (optional) - Supplier name
- `batch_code` (optional) - Batch identifier
- `expiry_date` (optional) - Format: YYYY-MM-DD
- `cost` (optional) - Cost price
- `price` (optional) - Selling price
- `stock_qty` (optional) - Quantity to add
- `store_code` (required if stock_qty > 0) - Store code (e.g., BR1)
- `image_url` (optional) - Product image URL

### 3.2 Create Excel Template
**Priority: HIGH**

- [ ] Create template file with all columns
- [ ] Add data validation
- [ ] Add example rows
- [ ] Document format requirements

**Deliverable:** Excel template file

---

## Phase 4: Testing Extended Import

### 4.1 Test Scenarios
**Priority: HIGH**

- [ ] Test with stock quantities
- [ ] Test batch creation
- [ ] Test expiry date parsing
- [ ] Test supplier tracking
- [ ] Test stock movement audit
- [ ] Test multi-store import
- [ ] Test partial data (no batches, no stock)

**Deliverable:** All test scenarios passed

### 4.2 Validate Data
**Priority: HIGH**

- [ ] Verify stock levels created
- [ ] Verify batches created
- [ ] Verify stock movements logged
- [ ] Verify per-store separation
- [ ] Verify audit trail complete

**Deliverable:** Data validation passed

---

## Phase 5: Frontend Integration

### 5.1 Update Upload UI
**Priority: MEDIUM**

- [ ] Add store selection dropdown
- [ ] Add batch fields to form (optional)
- [ ] Update CSV export to include new columns
- [ ] Add stock quantity input

**Deliverable:** Updated upload interface

### 5.2 Display Import Results
**Priority: MEDIUM**

- [ ] Show items inserted/updated
- [ ] Show batches created
- [ ] Show stock levels updated
- [ ] Show audit entries created
- [ ] Display errors with row numbers

**Deliverable:** Enhanced results display

---

## Extended Edge Function Code

### File: `supabase/functions/import-inventory/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST allowed" }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const contentType = req.headers.get("content-type") ?? "";
    
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data or JSON" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "File missing" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    });

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data rows found" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const summary = {
      items_inserted: 0,
      items_updated: 0,
      batches_created: 0,
      stock_created: 0,
      stock_updated: 0,
      stock_movements: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = String(row.name || row.Name || "").trim();
        if (!name || name.length === 0) {
          summary.errors.push({ row: i + 2, error: "Missing name" });
          continue;
        }

        const barcode = row.barcode || row.Barcode ? String(row.barcode || row.Barcode).trim() : null;
        const sku = row.sku || row.SKU ? String(row.sku || row.SKU).trim() : null;
        const categoryName = row.category || row.Category ? String(row.category || row.Category).trim() : null;
        const supplier = row.supplier || row.Supplier ? String(row.supplier || row.Supplier).trim() : null;
        const batch_code = row.batch_code || row["batch_code"] || row["Batch Code"] 
          ? String(row.batch_code || row["batch_code"] || row["Batch Code"]).trim() 
          : null;
        
        // Handle expiry_date - can be Excel date number or YYYY-MM-DD string
        let expiry_date = null;
        if (row.expiry_date || row["expiry_date"] || row["Expiry Date"]) {
          const expiryValue = row.expiry_date || row["expiry_date"] || row["Expiry Date"];
          if (typeof expiryValue === 'number') {
            // Excel date number - convert to Date
            expiry_date = XLSX.SSF.parse_date_code(expiryValue);
            expiry_date = new Date(expiry_date.y, expiry_date.m - 1, expiry_date.d).toISOString().split('T')[0];
          } else {
            // String date - try to parse
            const parsed = new Date(expiryValue);
            if (!isNaN(parsed.getTime())) {
              expiry_date = parsed.toISOString().split('T')[0];
            }
          }
        }

        const image_url = row.image_url || row.imageUrl || row["Image URL"] 
          ? String(row.image_url || row.imageUrl || row["Image URL"]).trim() 
          : null;
        const cost = parseFloat(row.cost || row.Cost || 0) || 0;
        const price = parseFloat(row.price || row.Price || 0) || 0;
        const stock_qty = parseInt(row.stock_qty || row["stock_qty"] || row["Stock Qty"] || 0) || 0;
        const store_code = row.store_code || row["store_code"] || row["Store Code"] 
          ? String(row.store_code || row["store_code"] || row["Store Code"]).trim() 
          : null;

        // Validate stock_qty requires store_code
        if (stock_qty > 0 && !store_code) {
          throw new Error("stock_qty provided but store_code missing");
        }

        // 1 — CATEGORY
        let category_id = null;
        if (categoryName && categoryName.length > 0) {
          const { data: existingCategory, error: catError } = await supabaseClient
            .from("categories")
            .select("id")
            .eq("name", categoryName)
            .maybeSingle();

          if (catError && catError.code !== 'PGRST116') {
            throw catError;
          }

          if (existingCategory) {
            category_id = existingCategory.id;
          } else {
            const { data: newCategory, error: newCatError } = await supabaseClient
              .from("categories")
              .insert({ name: categoryName })
              .select("id")
              .single();

            if (newCatError) {
              throw newCatError;
            }
            category_id = newCategory.id;
          }
        }

        // 2 — ITEM UPSERT
        let existingItem = null;
        if (barcode || sku) {
          const conditions: string[] = [];
          if (barcode) conditions.push(`barcode.eq.${barcode}`);
          if (sku) conditions.push(`sku.eq.${sku}`);
          
          const { data: existing, error: checkError } = await supabaseClient
            .from("items")
            .select("id")
            .or(conditions.join(","))
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }
          existingItem = existing;
        }

        let item_id;
        if (existingItem) {
          item_id = existingItem.id;
          const { error: updateError } = await supabaseClient
            .from("items")
            .update({
              name,
              barcode: barcode || null,
              sku: sku || null,
              category_id,
              cost,
              price,
              image_url: image_url || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item_id);

          if (updateError) {
            throw updateError;
          }
          summary.items_updated++;
        } else {
          const { data: newItem, error: insertError } = await supabaseClient
            .from("items")
            .insert({
              name,
              barcode: barcode || null,
              sku: sku || null,
              category_id,
              cost,
              price,
              image_url: image_url || null,
            })
            .select("id")
            .single();

          if (insertError) {
            throw insertError;
          }
          item_id = newItem.id;
          summary.items_inserted++;
        }

        // 3 — STORE lookup if stock exists
        let store_id = null;
        if (store_code) {
          const { data: store, error: storeError } = await supabaseClient
            .from("stores")
            .select("id")
            .eq("code", store_code)
            .maybeSingle();

          if (storeError && storeError.code !== 'PGRST116') {
            throw storeError;
          }

          if (!store) {
            throw new Error(`Store code '${store_code}' not found. Available stores: Run SELECT code FROM stores;`);
          }
          store_id = store.id;
        }

        // 4 — BATCH creation (only if batch_code, supplier, or expiry_date provided)
        let batch_id = null;
        if (batch_code || expiry_date || supplier) {
          const { data: batch, error: batchError } = await supabaseClient
            .from("batches")
            .insert({
              item_id,
              batch_code: batch_code || null,
              supplier: supplier || null,
              expiry_date: expiry_date || null,
              qty: stock_qty > 0 ? stock_qty : 0,
            })
            .select("id")
            .single();

          if (batchError) {
            throw batchError;
          }
          batch_id = batch.id;
          summary.batches_created++;
        }

        // 5 — STOCK LEVELS
        if (stock_qty > 0 && store_id) {
          const { data: stockRow, error: stockCheckError } = await supabaseClient
            .from("stock_levels")
            .select("qty")
            .eq("store_id", store_id)
            .eq("item_id", item_id)
            .maybeSingle();

          if (stockCheckError && stockCheckError.code !== 'PGRST116') {
            throw stockCheckError;
          }

          if (stockRow) {
            const { error: updateStockError } = await supabaseClient
              .from("stock_levels")
              .update({
                qty: stockRow.qty + stock_qty,
              })
              .eq("store_id", store_id)
              .eq("item_id", item_id);

            if (updateStockError) {
              throw updateStockError;
            }
            summary.stock_updated++;
          } else {
            const { error: insertStockError } = await supabaseClient
              .from("stock_levels")
              .insert({
                store_id,
                item_id,
                qty: stock_qty,
              });

            if (insertStockError) {
              throw insertStockError;
            }
            summary.stock_created++;
          }

          // 6 — STOCK MOVEMENT AUDIT
          const { error: movementError } = await supabaseClient
            .from("stock_movements")
            .insert({
              store_id,
              item_id,
              batch_id,
              delta: stock_qty,
              reason: "import",
              meta: { source: "CSV importer", row: i + 2 },
              performed_by: null, // Can be set from auth context if needed
            });

          if (movementError) {
            throw movementError;
          }
          summary.stock_movements++;
        }
      } catch (err: any) {
        summary.errors.push({
          row: i + 2,
          error: err?.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## CSV Format Examples

### Minimal (Items Only)
```csv
name,barcode,sku,category,cost,price
Parachute Oil,1234567890123,SKU101,Cosmetics,90,120
```

### With Stock
```csv
name,barcode,category,cost,price,stock_qty,store_code
Parachute Oil,1234567890123,Cosmetics,90,120,50,BR1
Egg Loose,,Eggs,8,10.25,200,BR1
```

### Full (With Batches)
```csv
name,barcode,sku,category,supplier,batch_code,expiry_date,cost,price,stock_qty,store_code,image_url
Parachute Oil,1234567890123,SKU101,Cosmetics,ABC Suppliers,BATCH001,2025-12-31,90,120,50,BR1,https://example.com/oil.jpg
Egg Loose,,EGG001,Eggs,Fresh Farm,EGG20250101,2025-01-15,8,10.25,200,BR1,https://example.com/egg.jpg
```

---

## Testing Checklist

### Basic Import
- [ ] Import items without stock → Items created
- [ ] Import items with stock → Stock levels created
- [ ] Import with batches → Batches created
- [ ] Import with expiry dates → Dates parsed correctly

### Stock Management
- [ ] Import same item twice → Stock adds up
- [ ] Import to different stores → Separate stock levels
- [ ] Verify stock movements logged

### Batch Management
- [ ] Create batch with code only
- [ ] Create batch with supplier
- [ ] Create batch with expiry date
- [ ] Verify batch linked to item

### Error Handling
- [ ] Missing store_code with stock_qty → Error
- [ ] Invalid store_code → Error
- [ ] Invalid expiry_date format → Handled gracefully

---

## Next Steps

1. Deploy extended function
2. Create Excel template
3. Test with sample data
4. Import all inventory
5. Verify stock levels and batches
6. Check audit trail

---

## Extension Options

Tell me which to implement next:
- **A)** Excel template generator
- **B)** Auto-barcode generator
- **C)** Image upload to Supabase Storage
- **D)** Multi-file batch import
- **E)** Stock adjustment import (negative quantities)

