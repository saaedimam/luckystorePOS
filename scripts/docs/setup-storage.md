# Storage Bucket Setup Guide

## Quick Setup (Manual - Recommended)

The easiest way to create the storage bucket is through the Supabase Dashboard:

1. **Go to Storage:**
   https://app.supabase.com/project/cckschiexzvysvdracvc/storage/buckets

2. **Click "New bucket"**

3. **Configure:**
   - **Name:** `item-images`
   - **Public bucket:** ✅ **Yes** (Important!)
   - **File size limit:** 50 MB (optional)
   - **Allowed MIME types:** image/jpeg, image/png, image/webp, image/gif (optional)

4. **Click "Create bucket"**

## Automated Setup (Alternative)

If you prefer to use a script:

```bash
cd "/Users/mac.alvi/Desktop/Projects/Lucky Store"
node scripts/create-storage-bucket.js
```

**Note:** The script may not work if you don't have the service role key properly configured. The manual method above is more reliable.

## Verify Setup

After creating the bucket, verify it exists:

1. Go to: https://app.supabase.com/project/cckschiexzvysvdracvc/storage/buckets
2. You should see `item-images` in the list
3. Make sure it shows as **Public**

## Import Prerequisites Runbook

Before running inventory imports:

1. Confirm `item-images` bucket exists and is public.
2. Ensure importer function is deployed with JWT verification enabled.
3. Log in to the app as `admin` or `manager` (required to run import).
4. Keep `SUPABASE_SERVICE_ROLE_KEY` out of source files. Use environment variables or `supabase secrets set` only.
5. Run a small test import first, then verify item rows and stock quantities.

## Why This Bucket?

The `item-images` bucket is used by the `import-inventory` edge function to:
- Store product images uploaded during CSV import
- Provide public URLs for product images
- Support image uploads from the admin interface

## Storage Policies

The bucket should allow:
- **Public read access** - So product images can be displayed
- **Authenticated write access** - So only authorized users can upload

These policies are typically set automatically when you create a public bucket.

