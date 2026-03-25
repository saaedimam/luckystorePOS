# 🚀 POS System Deployment Checklist

## Pre-Deployment Setup

### 1. Database Migration ⏱️ 2 minutes

Run in **Supabase Dashboard → SQL Editor**:

```sql
-- Copy and paste contents from:
-- supabase/migrations/20231118_add_stock_functions.sql

-- This creates:
-- ✓ decrement_stock() function
-- ✓ upsert_stock_level() function  
-- ✓ store_id column in users table
-- ✓ Performance indexes
```

**Verification**:
```sql
-- Should return 2 rows
SELECT proname FROM pg_proc WHERE proname IN ('decrement_stock', 'upsert_stock_level');
```

---

### 2. Initialize Data ⏱️ 3 minutes

Run in **Supabase Dashboard → SQL Editor**:

```sql
-- Copy and paste contents from:
-- scripts/setup-pos-data.sql

-- This creates:
-- ✓ Main store
-- ✓ Links users to store
-- ✓ Initializes stock_levels
-- ✓ Adds sample stock
```

**Verification**:
```sql
-- Should show your store and stock counts
SELECT 
  'Stores' as entity, COUNT(*) as count FROM stores
UNION ALL
SELECT 'Users with store_id', COUNT(*) FROM users WHERE store_id IS NOT NULL
UNION ALL
SELECT 'Stock levels', COUNT(*) FROM stock_levels;
```

---

### 3. Deploy Edge Function ⏱️ 2 minutes

**Option A: Using Script** (Recommended)
```bash
chmod +x deploy-create-sale.sh
./deploy-create-sale.sh
```

**Option B: Manual**
```bash
supabase functions deploy create-sale --no-verify-jwt
```

**Verification**:
Check in **Supabase Dashboard → Edge Functions**
- Should see: `create-sale` with status "Deployed"

---

### 4. Test Edge Function ⏱️ 1 minute

```bash
# Get your project URL and anon key from .env.local
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-sale' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "store_id": "YOUR_STORE_ID",
    "items": [
      {
        "item_id": "YOUR_ITEM_ID",
        "quantity": 1,
        "price": 100
      }
    ],
    "discount": 0,
    "payment_method": "cash",
    "payment_meta": {
      "cash_paid": 100,
      "change": 0
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "receipt_number": "...",
  "sale_id": "...",
  "total": 100,
  "items": 1
}
```

---

## Frontend Deployment

### 5. Environment Variables ⏱️ 1 minute

Ensure `frontend/.env.local` exists with:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### 6. Install & Build ⏱️ 3 minutes

```bash
cd frontend
npm install
npm run build
```

**Verification**:
- Should create `frontend/dist/` folder
- No TypeScript errors
- No linting errors

---

### 7. Run Development Server ⏱️ 1 minute

```bash
cd frontend
npm run dev
```

**Expected**:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 8. Test POS Interface ⏱️ 5 minutes

1. **Navigate**: http://localhost:5173/pos
2. **Login**: Use your credentials
3. **Test Workflow**:
   - [ ] Barcode input is auto-focused
   - [ ] Enter a barcode → item added to bill
   - [ ] Search by name → suggestions appear
   - [ ] Click category → items display
   - [ ] Click item → added to bill
   - [ ] Edit quantity → total updates
   - [ ] Edit price → total updates
   - [ ] Enter discount → total updates
   - [ ] Enter cash payment → change calculates
   - [ ] Click checkout → receipt appears
   - [ ] Receipt prints (browser print dialog)
   - [ ] Bill clears after receipt close

---

## Production Deployment

### 9. Deploy to Vercel/Netlify ⏱️ 5 minutes

**For Vercel**:
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Environment Variables** (Add in Vercel dashboard):
- `VITE_SUPABASE_URL`: Your Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your anon key

**For Netlify**:
```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod
```

---

### 10. Configure Custom Domain (Optional) ⏱️ 10 minutes

In Vercel/Netlify:
1. Go to Domain Settings
2. Add your domain
3. Configure DNS records
4. Wait for SSL certificate

---

## Post-Deployment Verification

### ✅ Checklist

- [ ] Database functions exist (`decrement_stock`, `upsert_stock_level`)
- [ ] Store created and users linked
- [ ] Stock levels initialized
- [ ] Edge function deployed
- [ ] Edge function responds to test call
- [ ] Frontend builds without errors
- [ ] POS page loads
- [ ] Barcode scanning works
- [ ] Search works
- [ ] Category browsing works
- [ ] Bill management works
- [ ] Checkout creates sale
- [ ] Receipt prints
- [ ] Stock decrements after sale
- [ ] Production site accessible
- [ ] Custom domain working (if configured)

---

## Monitoring & Maintenance

### Health Check URLs

Add to your monitoring tool:

```
Frontend: https://your-domain.com/pos
Edge Function: https://your-project-ref.supabase.co/functions/v1/create-sale
Database: Supabase Dashboard → Database Health
```

---

### Common Issues & Solutions

#### Issue: Edge function returns 500
**Solution**:
1. Check logs: `supabase functions logs create-sale`
2. Verify environment variables in Supabase
3. Check RLS policies

#### Issue: Stock not decrementing
**Solution**:
1. Check if function exists: `SELECT proname FROM pg_proc WHERE proname = 'decrement_stock'`
2. Check stock_movements table for logs
3. Verify stock_levels has rows for items

#### Issue: Receipt not printing
**Solution**:
1. Check browser pop-up blocker
2. Allow print dialogs
3. Test with `window.print()` in console

#### Issue: Barcode input not auto-focusing
**Solution**:
1. Check for JavaScript errors in console
2. Verify no other modals are open
3. Try manual focus

---

## Rollback Plan

If issues occur in production:

1. **Frontend**: Revert to previous Vercel/Netlify deployment
2. **Edge Function**: 
   ```bash
   supabase functions deploy create-sale --version previous
   ```
3. **Database**: Restore from Supabase automatic backup

---

## Support & Documentation

### 📚 Documentation
- **Full Guide**: `Docs/12-POS-IMPLEMENTATION.md`
- **Quick Start**: `POS-QUICK-START.md`
- **Phase Summary**: `PHASE-3-COMPLETE.md`

### 🔧 Key Files
- **POS Component**: `frontend/src/pages/POS.tsx`
- **Receipt**: `frontend/src/components/Receipt.tsx`
- **Edge Function**: `supabase/functions/create-sale/index.ts`
- **Migration**: `supabase/migrations/20231118_add_stock_functions.sql`

### 🐛 Debugging
- Edge Function Logs: `supabase functions logs create-sale`
- Frontend Console: Browser DevTools → Console
- Database Queries: Supabase Dashboard → SQL Editor

---

## Estimated Total Time

- **Pre-Deployment Setup**: 8 minutes
- **Frontend Deployment**: 9 minutes
- **Testing**: 5 minutes
- **Production Deploy**: 5 minutes
- **Custom Domain** (optional): 10 minutes

**Total**: ~27 minutes (37 with custom domain)

---

## Success Criteria

✅ POS page loads in production  
✅ Barcode scanning works  
✅ Search functionality works  
✅ Checkout completes successfully  
✅ Receipt prints  
✅ Stock decrements  
✅ No console errors  
✅ Mobile responsive  

---

## Next Phase

After successful deployment, you can move to:

**Phase 4: Realtime Sync**
- Multi-counter synchronization
- Real-time stock updates
- Sales visible across devices

**Phase 5: Offline Support**
- Queue sales when offline
- Sync when connection restored

**Phase 6: Receipt Printing**
- Thermal printer integration
- ESC/POS commands

---

**Status**: Ready for Deployment 🚀  
**Confidence Level**: Production Ready ✅  
**Last Updated**: November 2023

