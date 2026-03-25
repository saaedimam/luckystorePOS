# Quick Test Guide - Import Inventory Function

## The 401 Error

If you're getting `{"code":401,"message":"Missing authorization header"}`, you need to include authentication headers when calling the function.

## Correct Way to Call the Function

### Using curl:

```bash
curl -X POST https://cckschiexzvysvdracvc.supabase.co/functions/v1/import-inventory \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNja3NjaGlleHp2eXN2ZHJhY3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDA3NjMsImV4cCI6MjA3ODk3Njc2M30.1htIKuXVNs9mtRSktS2cBk2QvAriXpYgipIYuVuI3T8" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNja3NjaGlleHp2eXN2ZHJhY3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDA3NjMsImV4cCI6MjA3ODk3Njc2M30.1htIKuXVNs9mtRSktS2cBk2QvAriXpYgipIYuVuI3T8" \
  -F "file=@your-file.csv"
```

### Using the test script:

```bash
./test-import-function.sh your-file.csv
```

## Required Headers

You **MUST** include both headers:

1. **Authorization header:**
   ```
   Authorization: Bearer <your-anon-key>
   ```

2. **apikey header:**
   ```
   apikey: <your-anon-key>
   ```

Both should use your Supabase **anon/public key** (not the service role key).

## CSV File Format

Your CSV file should have these columns (case-insensitive):

**Required:**
- `name` or `Name` - Product name

**Optional:**
- `barcode` or `Barcode` - Product barcode (auto-generated if missing)
- `sku` or `SKU` - SKU code
- `category` or `Category` - Category name
- `cost` or `Cost` - Cost price
- `price` or `Price` - Selling price
- `stock_qty` or `Stock Qty` - Stock quantity (requires `store_code`)
- `store_code` or `Store Code` - Store code (must exist in `stores` table)
- `supplier` or `Supplier` - Supplier name
- `batch_code` or `Batch Code` - Batch code
- `expiry_date` or `Expiry Date` - Expiry date
- `image_url` or `Image URL` - Image URL

## Example CSV

```csv
name,category,cost,price,stock_qty,store_code
Parachute Oil,Cosmetics,90,120,50,BR1
Rice 1kg,Grocery,80,100,100,BR1
```

## Troubleshooting

### Still getting 401?
1. Make sure you're using the **anon key**, not service role key
2. Check that both `Authorization` and `apikey` headers are included
3. Verify the function is deployed: `supabase functions list`

### Getting other errors?
- Check function logs: `supabase functions logs import-inventory`
- Verify storage bucket `item-images` exists
- Ensure database schema is set up correctly

