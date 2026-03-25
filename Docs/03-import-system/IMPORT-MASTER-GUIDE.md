# CSV/XLSX Import - Master Guide

## Quick Navigation

This guide provides a complete implementation plan for importing inventory data from CSV/XLSX files into Supabase.

### 📚 Documentation Index

1. **[IMPORT-EXECUTION-PLAN.md](./IMPORT-EXECUTION-PLAN.md)** - Complete implementation plan with phases
2. **[EDGE-FUNCTION-SETUP.md](./EDGE-FUNCTION-SETUP.md)** - Step-by-step Edge Function setup
3. **[FRONTEND-IMPORT-INTEGRATION.md](./FRONTEND-IMPORT-INTEGRATION.md)** - Frontend integration guide
4. **[NODE-IMPORT-SCRIPT.md](./NODE-IMPORT-SCRIPT.md)** - Command-line import script

---

## 🚀 Quick Start (Choose Your Path)

### Path A: Edge Function (Recommended for Production)
**Best for:** Web-based imports, user-facing features

1. Follow [EDGE-FUNCTION-SETUP.md](./EDGE-FUNCTION-SETUP.md)
2. Deploy Edge Function
3. Integrate with frontend using [FRONTEND-IMPORT-INTEGRATION.md](./FRONTEND-IMPORT-INTEGRATION.md)

**Time:** 2-3 hours  
**Complexity:** Medium

---

### Path B: Node.js Script (Recommended for Migration)
**Best for:** One-time imports, bulk data migration

1. Follow [NODE-IMPORT-SCRIPT.md](./NODE-IMPORT-SCRIPT.md)
2. Set up environment variables
3. Run script with CSV file

**Time:** 30 minutes  
**Complexity:** Low

---

## 📋 Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Supabase project created
- [ ] SQL schema deployed (from `supabaseplan.md`)
- [ ] Supabase CLI installed
- [ ] Project linked via CLI

### Phase 2: Choose Import Method
- [ ] **Option A:** Edge Function setup
  - [ ] Function created
  - [ ] Function deployed
  - [ ] Function tested
- [ ] **Option B:** Node.js script setup
  - [ ] Script created
  - [ ] Dependencies installed
  - [ ] Environment configured

### Phase 3: Prepare Data
- [ ] Export current data from `lucky-store-stock.html`
- [ ] Verify CSV format matches requirements
- [ ] Clean data if needed
- [ ] Test with small sample (10 items)

### Phase 4: Import Data
- [ ] Import test file
- [ ] Verify data in Supabase dashboard
- [ ] Import all CSV files
- [ ] Verify no duplicates
- [ ] Check for errors

### Phase 5: Integration (If using Edge Function)
- [ ] Add upload UI to frontend
- [ ] Test upload functionality
- [ ] Add error handling
- [ ] Add success notifications

---

## 📊 CSV Format Requirements

### Required Columns
| Column | Required | Type | Description |
|--------|----------|------|-------------|
| `name` | ✅ Yes | Text | Product name |
| `barcode` | ❌ No | Text | Barcode (for matching) |
| `sku` | ❌ No | Text | SKU code (for matching) |
| `category` | ❌ No | Text | Category name (auto-created) |
| `cost` | ❌ No | Number | Cost price (default: 0) |
| `price` | ❌ No | Number | Selling price (default: 0) |
| `image_url` | ❌ No | URL | Product image URL |

### Example CSV
```csv
name,barcode,sku,category,cost,price,image_url
Parachute Oil,1234567890123,SKU101,Cosmetics,90,120,https://example.com/oil.jpg
Egg Loose,,EGG001,Eggs,8,10.25,https://example.com/egg.jpg
```

### Matching Logic
- If `barcode` matches → **UPDATE** existing item
- Else if `sku` matches → **UPDATE** existing item
- Else → **INSERT** new item

---

## 🔧 Technical Details

### Edge Function Endpoint
```
POST https://<project>.supabase.co/functions/v1/import-inventory
```

**Headers:**
- `Authorization: Bearer <jwt-token>`
- `apikey: <anon-key>`

**Body:**
- `multipart/form-data`
- Field name: `file`

**Response:**
```json
{
  "inserted": 92,
  "updated": 12,
  "errors": [
    { "row": 5, "error": "Missing name" }
  ]
}
```

---

## 🧪 Testing Guide

### Test Scenarios

1. **Basic Import**
   - [ ] Upload CSV with 10 items → All imported
   - [ ] Verify items in Supabase dashboard
   - [ ] Check categories created

2. **Update Existing**
   - [ ] Upload CSV with existing barcode → Item updated
   - [ ] Verify price/cost updated
   - [ ] Verify no duplicate created

3. **Error Handling**
   - [ ] Upload CSV with missing name → Row skipped
   - [ ] Upload empty CSV → Error message
   - [ ] Upload invalid file → Error message

4. **Large Files**
   - [ ] Upload CSV with 1000+ items → All processed
   - [ ] Check processing time
   - [ ] Verify no data loss

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Function not found | Verify deployment, check URL |
| Unauthorized | Check JWT token, verify login |
| No data imported | Check CSV format, verify headers |
| Categories not created | Check RLS policies |
| Duplicate items | Verify matching logic (barcode/SKU) |

### Debug Steps

1. Check Supabase function logs
2. Verify CSV format matches requirements
3. Test with small sample file
4. Check RLS policies
5. Verify service role key (for Node script)

---

## 📈 Performance

### Edge Function
- ~50-100 items/second
- Handles files up to 10MB
- Timeout: 60 seconds

### Node.js Script
- ~100 items/second
- No file size limit
- Can process multiple files

---

## 🔒 Security Considerations

### Edge Function
- Uses user JWT token
- Respects RLS policies
- Validates file type
- Sanitizes input

### Node.js Script
- Uses service role key (full access)
- Bypasses RLS
- **Keep `.env` secure**
- Don't commit to Git

---

## 🎯 Next Steps After Import

1. ✅ Verify all items imported
2. ✅ Set up stock levels if needed
3. ✅ Test POS functionality
4. ✅ Configure RLS policies
5. ✅ Set up automated backups

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **SQL Schema:** See `supabaseplan.md`
- **Execution Plan:** See `EXECUTION-PLAN.md`

---

## 🎓 Learning Path

1. **Beginner:** Start with Node.js script (easier)
2. **Intermediate:** Implement Edge Function
3. **Advanced:** Add frontend integration
4. **Expert:** Extend with stock/batch import

---

## ✅ Success Criteria

Your import is successful when:
- ✅ All items imported without errors
- ✅ Categories created automatically
- ✅ Existing items updated correctly
- ✅ No duplicate items created
- ✅ Data visible in Supabase dashboard
- ✅ POS can use imported items

---

## 📝 Notes

- Always test with small sample first
- Keep backup of original CSV files
- Verify data after import
- Document any custom changes
- Update this guide if you extend functionality

---

**Last Updated:** Based on Supabase Edge Function implementation  
**Status:** Ready for implementation  
**Next Review:** After first successful import

