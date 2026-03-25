# Import System Deployment Guide

## Overview
This guide covers the complete deployment and testing of the CSV/XLSX import system for Lucky Store POS.

---

## Phase 1: Supabase Edge Function Setup

### 1.1 Prerequisites

**Required:**
- Node.js (v18 or higher)
- Supabase CLI installed globally
- Access to Supabase project
- Project reference ID
- Service role key

**Install Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### 1.2 Authentication & Project Linking

**Step 1: Login to Supabase**
```bash
supabase login
```
This will open your browser for authentication.

**Step 2: Link Your Project**
```bash
supabase link --project-ref <your-project-ref>
```
Replace `<your-project-ref>` with your actual project reference ID (found in Supabase dashboard URL).

**Verify Link:**
Check that `.supabase/config.toml` was created with your project configuration.

### 1.3 Edge Function Status

✅ **Already Implemented:** The edge function is already created at:
- `supabase/functions/import-inventory/index.ts`

**Features:**
- CSV/XLSX file parsing
- Auto-category creation
- Barcode/SKU matching for updates
- Auto-barcode generation (EAN-13)
- Stock level management
- Batch tracking
- Image upload support
- Comprehensive error handling

### 1.4 Configure Environment Variables

**Set Service Role Key:**
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Note:** The service role key bypasses RLS policies. Keep it secure and never commit it to version control.

**Verify Secrets:**
```bash
supabase secrets list
```

### 1.5 Deploy Edge Function

**Deploy to Production:**
```bash
supabase functions deploy import-inventory
```

**Or use the deployment script:**
```bash
chmod +x scripts/deploy/deploy-edge-function.sh
./scripts/deploy/deploy-edge-function.sh
```

**Verify Deployment:**
1. Check Supabase Dashboard → Edge Functions
2. Verify function appears in the list
3. Check function logs for any errors

**Function URL:**
```
https://<your-project-ref>.supabase.co/functions/v1/import-inventory
```

### 1.6 Test Function Locally (Optional)

**Start Local Development:**
```bash
supabase start
supabase functions serve import-inventory
```

**Test with curl:**
```bash
curl -X POST http://localhost:54321/functions/v1/import-inventory \
  -H "Authorization: Bearer <anon-key>" \
  -H "apikey: <anon-key>" \
  -F "file=@test-import-comprehensive.csv"
```

---

## Phase 2: Frontend Integration

### 2.1 Frontend Status

✅ **Already Implemented:** The frontend integration is complete:

**Components:**
- `apps/frontend/src/components/BulkImport.tsx` - Upload UI component
- `apps/frontend/src/pages/Items.tsx` - Integration with Items page

**Features:**
- File upload (CSV/XLSX)
- Progress indicator
- Detailed results display
- Error reporting
- Automatic item list refresh

### 2.2 Environment Variables

**Required in `apps/frontend/.env.local`:**
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Verify Configuration:**
The app will log configuration status in the browser console during development.

### 2.3 Test Frontend Integration

1. **Start Development Server:**
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

2. **Navigate to Items Page:**
   - Login to the application
   - Go to Items Management page
   - Click "Bulk Import" button

3. **Upload Test File:**
   - Select `test-import-comprehensive.csv`
   - Click "Import Items"
   - Review results

---

## Phase 3: Testing & Validation

### 3.1 Test Scenarios

**Test File:** `test-import-comprehensive.csv`

**Scenarios Covered:**
- ✅ Items with barcodes
- ✅ Items without barcodes (auto-generation)
- ✅ Items with SKUs
- ✅ New categories (auto-creation)
- ✅ Existing items (updates)
- ✅ Stock levels with store codes
- ✅ Batch tracking
- ✅ Expiry dates
- ✅ Image URLs

### 3.2 Manual Testing Checklist

#### Basic Functionality
- [ ] Upload CSV with 10 items → All imported
- [ ] Upload CSV with existing barcode → Item updated
- [ ] Upload CSV with new category → Category created
- [ ] Upload CSV with missing name → Row skipped with error

#### Edge Cases
- [ ] Upload empty CSV → Error message
- [ ] Upload CSV with 1000+ items → All processed
- [ ] Upload CSV with special characters → Handled correctly
- [ ] Upload XLSX file → Works correctly
- [ ] Upload with network error → Error handled gracefully

#### Data Validation
- [ ] Verify items appear in database
- [ ] Verify categories created
- [ ] Verify updates don't create duplicates
- [ ] Verify barcode/SKU matching works
- [ ] Verify image URLs preserved
- [ ] Verify prices formatted correctly
- [ ] Verify stock levels created
- [ ] Verify batches created

### 3.3 Automated Testing (Future)

Consider adding:
- Unit tests for edge function
- Integration tests for import flow
- E2E tests for frontend upload

---

## CSV Format Specification

### Required Columns

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `name` | ✅ Yes | Product name | "Parachute Oil" |
| `barcode` | ❌ No | Barcode (auto-generated if missing) | "1234567890123" |
| `sku` | ❌ No | SKU code | "SKU001" |
| `category` | ❌ No | Category name (auto-created) | "Cosmetics" |
| `cost` | ❌ No | Cost price (default: 0) | "90.00" |
| `price` | ❌ No | Selling price (default: 0) | "120.00" |
| `image_url` | ❌ No | Product image URL | "https://..." |
| `description` | ❌ No | Product description | "Pure coconut oil" |
| `store_code` | ❌ No | Store code for stock | "STORE001" |
| `stock_qty` | ❌ No | Stock quantity | "50" |
| `supplier` | ❌ No | Supplier name | "Parachute Ltd" |
| `batch_code` | ❌ No | Batch code | "BATCH001" |
| `expiry_date` | ❌ No | Expiry date (YYYY-MM-DD) | "2025-12-31" |

### Column Name Variations

The function accepts case-insensitive variations:
- `name` or `Name`
- `barcode` or `Barcode`
- `sku` or `SKU`
- `category` or `Category`
- `cost` or `Cost`
- `price` or `Price`
- `image_url` or `imageUrl` or `Image URL`

### Example CSV

```csv
name,barcode,sku,category,cost,price,image_url
Parachute Oil,1234567890123,SKU101,Cosmetics,90,120,https://example.com/image.jpg
Egg Loose,,EGG001,Eggs,8,10.25,https://example.com/egg.jpg
```

### Matching Logic

1. **If `barcode` matches existing item** → UPDATE
2. **Else if `sku` matches existing item** → UPDATE
3. **Else** → INSERT new item

---

## Troubleshooting

### Function Not Found
- ✅ Verify function deployed: Check Supabase dashboard
- ✅ Verify endpoint URL matches your project
- ✅ Check authentication headers

### Import Fails Silently
- ✅ Check function logs in Supabase dashboard
- ✅ Verify service role key is set correctly
- ✅ Check RLS policies (may need to disable temporarily for testing)
- ✅ Verify file format matches specification

### Items Not Updating
- ✅ Verify barcode/SKU matching logic
- ✅ Check for data type mismatches
- ✅ Verify RLS policies allow updates
- ✅ Check function logs for errors

### Categories Not Creating
- ✅ Check categories table RLS policies
- ✅ Verify category name is not empty
- ✅ Check for duplicate category names
- ✅ Verify service role key has proper permissions

### Authentication Errors
- ✅ Verify session token is being sent
- ✅ Check if user is logged in
- ✅ Verify anon key is correct
- ✅ Check CORS headers

### Large File Timeouts
- ✅ Consider splitting large files into batches
- ✅ Increase function timeout in Supabase dashboard
- ✅ Process in chunks on frontend

---

## Security Considerations

### Service Role Key
- ⚠️ **Never commit service role key to version control**
- ⚠️ **Only use in edge functions (server-side)**
- ⚠️ **Rotate keys regularly**
- ⚠️ **Use environment variables or Supabase secrets**

### RLS Policies
- ✅ Edge function uses service role key (bypasses RLS)
- ✅ Frontend uses anon key (respects RLS)
- ✅ Verify RLS policies are correctly configured

### File Upload
- ✅ Validate file types (CSV/XLSX only)
- ✅ Limit file size (configure in Supabase)
- ✅ Sanitize file names
- ✅ Validate data before import

---

## Performance Optimization

### Large File Imports
- **Current:** Processes rows sequentially
- **Future:** Consider batch processing
- **Future:** Add progress reporting for large files
- **Future:** Implement background job queue

### Database Optimization
- ✅ Indexes on `barcode` and `sku` columns
- ✅ Indexes on `categories.name`
- ✅ Consider connection pooling

---

## Next Steps

1. ✅ **Verify imported data** in Supabase dashboard
2. ✅ **Test POS functionality** with imported items
3. ✅ **Set up stock levels** if needed
4. ✅ **Configure RLS policies** for production
5. ✅ **Set up automated backups**
6. ✅ **Monitor function logs** for errors
7. ✅ **Set up alerts** for failed imports

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **Storage:** https://supabase.com/docs/guides/storage
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

---

## Deployment Checklist

### Pre-Deployment
- [ ] Supabase CLI installed
- [ ] Project linked
- [ ] Service role key set
- [ ] Edge function code reviewed
- [ ] Test CSV file prepared

### Deployment
- [ ] Edge function deployed
- [ ] Function verified in dashboard
- [ ] Environment variables configured
- [ ] Frontend updated
- [ ] Test import successful

### Post-Deployment
- [ ] Verify data integrity
- [ ] Test all import scenarios
- [ ] Monitor function logs
- [ ] Document any issues
- [ ] Update team on new feature

---

**Last Updated:** 2025-01-27
**Status:** ✅ Ready for Production

