# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Lucky Store POS system.

## Functions

### `import-inventory`

**Location:** `supabase/functions/import-inventory/index.ts`

**Purpose:** Import inventory items from CSV/XLSX files with extended features:
- CSV/XLSX file parsing
- Stock quantities per store
- Batch tracking (supplier, batch_code, expiry_date)
- Auto-barcode generation (EAN-13)
- Image upload to Supabase Storage
- Complete audit trail

**Setup Instructions:**

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   Get your project reference ID from Supabase Dashboard → Settings → General

4. **Deploy the function:**
   ```bash
   supabase functions deploy import-inventory
   ```

5. **Set environment variables:**
   The function automatically uses:
   - `SUPABASE_URL` (auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

**Usage:**

After deployment, your function URL will be:
```
https://<project-ref>.supabase.co/functions/v1/import-inventory
```

**Test the function:**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/import-inventory \
  -H "Authorization: Bearer <anon-key>" \
  -H "apikey: <anon-key>" \
  -F "file=@test.csv"
```

**Local Development:**

```bash
supabase functions serve import-inventory
```

Then test locally:
```bash
curl -X POST http://localhost:54321/functions/v1/import-inventory \
  -H "Authorization: Bearer <anon-key>" \
  -F "file=@test.csv"
```

**View Logs:**

```bash
supabase functions logs import-inventory
```

Or in Supabase Dashboard:
- Go to Edge Functions → import-inventory → Logs

## Storage Bucket

Make sure you have created the storage bucket:
- Bucket name: `item-images`
- Set to public for image access

## CSV/Excel Format

The function accepts CSV or Excel files with the following columns (case-insensitive):

**Required:**
- `name` or `Name` - Product name

**Optional:**
- `barcode` or `Barcode` - Product barcode (auto-generated if missing)
- `sku` or `SKU` - SKU code
- `category` or `Category` - Category name (created if doesn't exist)
- `cost` or `Cost` - Cost price
- `price` or `Price` - Selling price
- `image_url` or `Image URL` - Image URL
- `stock_qty` or `Stock Qty` - Stock quantity (requires `store_code`)
- `store_code` or `Store Code` - Store code (must exist in `stores` table)
- `supplier` or `Supplier` - Supplier name
- `batch_code` or `Batch Code` - Batch code
- `expiry_date` or `Expiry Date` - Expiry date (YYYY-MM-DD or Excel date)

## Response Format

The function returns a summary object:

```json
{
  "items_inserted": 10,
  "items_updated": 2,
  "batches_created": 5,
  "stock_created": 8,
  "stock_updated": 4,
  "stock_movements": 12,
  "barcodes_generated": 3,
  "images_uploaded": 2,
  "errors": [
    {
      "row": 5,
      "error": "Missing name"
    }
  ]
}
```

## Notes

- The function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
- Use for admin operations only
- Secure the service role key
- The function handles errors gracefully and continues processing other rows

