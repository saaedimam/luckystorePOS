# CSV/XLSX Import Execution Plan

## Overview
This plan details the implementation of the Supabase Edge Function for importing inventory from CSV/XLSX files, integrating with the existing `lucky-store-stock.html` export functionality.

> 📘 **For detailed deployment instructions, see:** [IMPORT-DEPLOYMENT-GUIDE.md](./IMPORT-DEPLOYMENT-GUIDE.md)

---

## Phase 1: Supabase Edge Function Setup

### 1.1 Create Edge Function
**Priority: CRITICAL** ✅ **COMPLETED**

- [x] Install Supabase CLI: `npm install -g supabase`
- [x] Login to Supabase: `supabase login`
- [x] Link project: `supabase link --project-ref <your-project-ref>`
- [x] Initialize functions: `supabase functions new import-inventory`
- [x] Create function file: `supabase/functions/import-inventory/index.ts`

**Deliverable:** Edge Function scaffold created ✅

### 1.2 Implement Import Function
**Priority: CRITICAL** ✅ **COMPLETED**

- [x] Copy Edge Function code (provided below)
- [x] Install required dependencies (XLSX library)
- [x] Configure environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [x] Test function locally: `supabase functions serve import-inventory`

**Deliverable:** Working Edge Function ✅

**Status:** Function is fully implemented with extended features:
- CSV/XLSX parsing
- Auto-category creation
- Barcode/SKU matching
- Auto-barcode generation
- Stock level management
- Batch tracking
- Image upload support

### 1.3 Deploy Function
**Priority: HIGH** ⚠️ **PENDING DEPLOYMENT**

- [ ] Deploy to Supabase: `supabase functions deploy import-inventory`
- [ ] Verify deployment in Supabase dashboard
- [ ] Test endpoint with sample CSV
- [ ] Set up function secrets if needed

**Deliverable:** Deployed Edge Function

**Deployment Script:** Use `scripts/deploy/deploy-edge-function.sh` or follow [IMPORT-DEPLOYMENT-GUIDE.md](./IMPORT-DEPLOYMENT-GUIDE.md)

---

## Phase 2: Frontend Integration

### 2.1 Update HTML File Export
**Priority: HIGH** ✅ **COMPLETED**

- [x] Verify current CSV export format matches required format:
  - Columns: name, barcode, sku, category, cost, price, image_url
- [x] Add export button if missing
- [x] Ensure export includes all required columns
- [x] Test export functionality

**Deliverable:** CSV export matching import format ✅

### 2.2 Create Upload Component
**Priority: HIGH** ✅ **COMPLETED**

- [x] Create upload UI component (can be added to existing HTML)
- [x] File input for CSV/XLSX
- [x] Upload button
- [x] Progress indicator
- [x] Results display (inserted/updated/errors)

**Deliverable:** Upload UI component ✅

**Location:** `apps/frontend/src/components/BulkImport.tsx`

### 2.3 Implement Upload Logic
**Priority: HIGH** ✅ **COMPLETED**

- [x] Create upload function using Supabase client
- [x] Handle file selection
- [x] Create FormData with file
- [x] Call Edge Function endpoint
- [x] Display results
- [x] Handle errors gracefully
- [x] Refresh items list after import

**Deliverable:** Working upload functionality ✅

**Location:** `apps/frontend/src/pages/Items.tsx` - `handleBulkImport` function

**Features:**
- Session-based authentication
- Detailed results display
- Error reporting with row numbers
- Automatic item list refresh

---

## Phase 3: Testing & Validation

### 3.1 Test Import Scenarios
**Priority: HIGH**

- [ ] Test with empty CSV
- [ ] Test with single item
- [ ] Test with multiple items
- [ ] Test with existing items (update scenario)
- [ ] Test with new items (insert scenario)
- [ ] Test with missing categories (auto-create)
- [ ] Test with invalid data (handling errors)
- [ ] Test with large files (1000+ items)

**Deliverable:** Test suite completed

### 3.2 Validate Data Integrity
**Priority: HIGH**

- [ ] Verify all items imported correctly
- [ ] Verify categories created correctly
- [ ] Verify updates don't duplicate items
- [ ] Verify barcode/SKU matching works
- [ ] Check for data corruption
- [ ] Verify image URLs preserved

**Deliverable:** Data validation passed

---

## Edge Function Code

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

    const contentType = req.headers.get("content-type") || "";
    
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

    const results = {
      inserted: 0,
      updated: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = String(row.name || row.Name || "").trim();
        if (!name || name.length === 0) {
          results.errors.push({ row: i + 2, error: "Missing name" });
          continue;
        }

        const barcode = row.barcode || row.Barcode ? String(row.barcode || row.Barcode).trim() : null;
        const sku = row.sku || row.SKU ? String(row.sku || row.SKU).trim() : null;
        const categoryName = row.category || row.Category ? String(row.category || row.Category).trim() : null;
        const cost = parseFloat(row.cost || row.Cost || 0) || 0;
        const price = parseFloat(row.price || row.Price || 0) || 0;
        const image_url = row.image_url || row.imageUrl || row["Image URL"] ? String(row.image_url || row.imageUrl || row["Image URL"]).trim() : null;

        // Handle categories
        let category_id = null;
        if (categoryName && categoryName.length > 0) {
          const { data: catData, error: catError } = await supabaseClient
            .from("categories")
            .select("id")
            .eq("name", categoryName)
            .maybeSingle();

          if (catError && catError.code !== 'PGRST116') {
            throw catError;
          }

          if (catData) {
            category_id = catData.id;
          } else {
            const { data: newCat, error: newCatError } = await supabaseClient
              .from("categories")
              .insert({ name: categoryName })
              .select("id")
              .single();

            if (newCatError) {
              throw newCatError;
            }
            category_id = newCat.id;
          }
        }

        // Check for existing item by barcode or SKU
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

        // Upsert item
        const itemData: any = {
          name,
          barcode: barcode || null,
          sku: sku || null,
          category_id,
          cost,
          price,
          image_url: image_url || null,
          active: true,
        };

        if (existingItem) {
          itemData.updated_at = new Date().toISOString();
          const { error: updateError } = await supabaseClient
            .from("items")
            .update(itemData)
            .eq("id", existingItem.id);

          if (updateError) {
            throw updateError;
          }
          results.updated++;
        } else {
          const { error: insertError } = await supabaseClient
            .from("items")
            .insert(itemData);

          if (insertError) {
            throw insertError;
          }
          results.inserted++;
        }
      } catch (err: any) {
        results.errors.push({
          row: i + 2,
          error: err?.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify(results),
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

## Frontend Integration Code

### Add to `lucky-store-stock.html` or React component:

```javascript
// Add this function to handle CSV/XLSX upload to Supabase
async function uploadInventoryToSupabase(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Get Supabase client (you'll need to initialize this)
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    alert('Please login first');
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-inventory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (result.error) {
      alert('Import failed: ' + result.error);
      return;
    }

    // Show results
    const message = `Import complete!\nInserted: ${result.inserted}\nUpdated: ${result.updated}\nErrors: ${result.errors.length}`;
    alert(message);
    
    if (result.errors.length > 0) {
      console.error('Import errors:', result.errors);
    }

    // Refresh items list
    loadItems();
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed: ' + error.message);
  }
}

// Add upload button to existing import modal
function addSupabaseUploadOption() {
  // Add file input and upload button to Excel import modal
  // Or create separate Supabase import section
}
```

---

## CSV Format Specification

### Required Columns (case-insensitive):
- `name` (required) - Product name
- `barcode` (optional) - Barcode
- `sku` (optional) - SKU code
- `category` (optional) - Category name (will be created if doesn't exist)
- `cost` (optional, default: 0) - Cost price
- `price` (optional, default: 0) - Selling price
- `image_url` (optional) - Product image URL

### Example CSV:
```csv
name,barcode,sku,category,cost,price,image_url
Parachute Oil,1234567890123,SKU101,Cosmetics,90,120,https://example.com/image.jpg
Egg Loose,,EGG001,Eggs,8,10.25,https://example.com/egg.jpg
```

### Matching Logic:
- If `barcode` matches existing item → UPDATE
- Else if `sku` matches existing item → UPDATE
- Else → INSERT new item

---

## Testing Checklist

### Basic Functionality
- [ ] Upload CSV with 10 items → All imported
- [ ] Upload CSV with existing barcode → Item updated
- [ ] Upload CSV with new category → Category created
- [ ] Upload CSV with missing name → Row skipped with error

### Edge Cases
- [ ] Upload empty CSV → Error message
- [ ] Upload CSV with 1000+ items → All processed
- [ ] Upload CSV with special characters in names → Handled correctly
- [ ] Upload CSV with duplicate barcodes in file → Last one wins
- [ ] Upload XLSX file → Works correctly
- [ ] Upload with network error → Error handled gracefully

### Data Validation
- [ ] Verify items appear in database
- [ ] Verify categories created
- [ ] Verify updates don't create duplicates
- [ ] Verify image URLs preserved
- [ ] Verify prices formatted correctly

---

## Integration Steps

### Step 1: Set up Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

### Step 2: Create Function
```bash
supabase functions new import-inventory
```

### Step 3: Copy Function Code
- Copy the Edge Function code above
- Paste into `supabase/functions/import-inventory/index.ts`

### Step 4: Deploy
```bash
supabase functions deploy import-inventory
```

### Step 5: Test Locally (Optional)
```bash
supabase functions serve import-inventory
# Test with: curl -X POST http://localhost:54321/functions/v1/import-inventory
```

### Step 6: Add to Frontend
- Add upload function to HTML file
- Add upload UI component
- Test with sample CSV

---

## Troubleshooting

### Function Not Found
- Verify function deployed: Check Supabase dashboard
- Verify endpoint URL: `https://<project>.supabase.co/functions/v1/import-inventory`
- Check authentication headers

### Import Fails Silently
- Check function logs in Supabase dashboard
- Verify service role key is set
- Check RLS policies (may need to disable temporarily for testing)

### Items Not Updating
- Verify barcode/SKU matching logic
- Check for data type mismatches
- Verify RLS policies allow updates

### Categories Not Creating
- Check categories table RLS policies
- Verify category name is not empty
- Check for duplicate category names

---

## Next Steps After Import

1. Verify imported data in Supabase dashboard
2. Test POS functionality with imported items
3. Set up stock levels if needed
4. Configure RLS policies for production
5. Set up automated backups

---

## Extension Options

### Add Stock Import
- Add `qty` column to CSV
- Update function to create/update `stock_levels` table
- Handle multi-store stock

### Add Batch Import
- Add `batch_code`, `supplier`, `expiry_date` columns
- Create batches for items
- Link batches to stock levels

### Add Image Upload
- Accept image files in upload
- Upload to Supabase Storage
- Update image_url with storage URL

Tell me which extension you want implemented.

