# Deployment Guide - Lucky Store POS

## Prerequisites Completed ✅

- [x] Git repository initialized
- [x] Project folder structure created
- [x] Supabase Edge Function created (`supabase/functions/import-inventory/index.ts`)
- [x] Supabase CLI installed
- [x] Environment variables configured

## Next Steps

### 1. Login to Supabase CLI

You need to login to Supabase CLI first. Run this command in your terminal:

```bash
supabase login
```

This will open your browser for authentication. After logging in, you'll be able to link your project.

### 2. Link Your Project

Once logged in, link your Supabase project:

```bash
cd "/Users/mac.alvi/Desktop/Projects/Lucky Store"
supabase link --project-ref cckschiexzvysvdracvc
```

### 3. Set Service Role Key as Secret

Set your service role key as a secret for Edge Functions:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Note:** The service role key is automatically available to Edge Functions, but setting it explicitly ensures it's configured correctly.

### 4. Deploy Edge Function

Deploy the import-inventory function:

```bash
supabase functions deploy import-inventory
```

### 5. Verify Deployment

Check that the function is deployed:

```bash
supabase functions list
```

Or check in the Supabase Dashboard:
- Go to: https://app.supabase.com/project/cckschiexzvysvdracvc/functions

### 6. Test the Function

Test the deployed function with a sample CSV:

```bash
curl -X POST https://cckschiexzvysvdracvc.supabase.co/functions/v1/import-inventory \
  -H "Authorization: Bearer <user-access-token>" \
  -H "apikey: <anon-key>" \
  -F "file=@test.csv"
```

## Quick Deploy Script

You can also run this script to automate the deployment:

```bash
#!/bin/bash
# deploy-edge-function.sh

echo "🔐 Logging in to Supabase..."
supabase login

echo "🔗 Linking project..."
supabase link --project-ref cckschiexzvysvdracvc

echo "🔑 Setting service role key..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "🚀 Deploying edge function..."
supabase functions deploy import-inventory

echo "✅ Deployment complete!"
echo "Function URL: https://cckschiexzvysvdracvc.supabase.co/functions/v1/import-inventory"
```

## Storage Bucket Setup

Make sure you have created the storage bucket in Supabase Dashboard:

1. Go to: https://app.supabase.com/project/cckschiexzvysvdracvc/storage/buckets
2. Create a new bucket named: `item-images`
3. Set it to **Public**
4. This bucket is used by the import-inventory function to store product images

## Database Schema

Make sure you've run the SQL schema from `Docs/02-SUPABASE-SCHEMA.md` in your Supabase SQL Editor.

## Troubleshooting

### Issue: "Access token not provided"
**Solution:** Run `supabase login` first

### Issue: "Function not found after deployment"
**Solution:** Wait a few seconds and check the dashboard. Functions may take a moment to appear.

### Issue: "Unauthorized" when calling function
**Solution:** Make sure you're signed in as an admin/manager user and pass a valid user access token in `Authorization: Bearer <token>`.

### Issue: "Storage bucket not found"
**Solution:** Create the `item-images` bucket in Supabase Dashboard → Storage

## Function Endpoints

After deployment, your function will be available at:

- **Import Inventory:** `https://cckschiexzvysvdracvc.supabase.co/functions/v1/import-inventory`
- **Create Sale:** `https://cckschiexzvysvdracvc.supabase.co/functions/v1/create-sale` (to be created)

## Next Steps After Deployment

1. ✅ Test import with a small CSV file
2. ✅ Verify data in Supabase dashboard
3. ✅ Import all current items from `lucky-store-stock.html`
4. ✅ Set up frontend React app
5. ✅ Integrate with POS interface

