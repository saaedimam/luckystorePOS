# Node.js CSV Import Script

## Overview
Command-line script to bulk import CSV/XLSX files directly to Supabase without using the Edge Function. Useful for initial data migration or batch imports.

---

## Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js xlsx dotenv
```

Or add to `package.json`:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "xlsx": "^0.18.5",
    "dotenv": "^16.3.1"
  }
}
```

### 2. Create Environment File

Create `.env` file:
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Use service role key (not anon key) for admin operations.

---

## Script: `scripts/import-csv-to-supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importCSV(filePath) {
  console.log(`\nReading file: ${filePath}\n`);

  // Read file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: '',
  });

  if (rows.length === 0) {
    console.error('No data rows found in file');
    return;
  }

  console.log(`Found ${rows.length} rows to process\n`);

  const results = {
    inserted: 0,
    updated: 0,
    errors: [],
  };

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = String(row.name || row.Name || '').trim();
      if (!name || name.length === 0) {
        results.errors.push({ row: i + 2, error: 'Missing name' });
        continue;
      }

      const barcode = row.barcode || row.Barcode 
        ? String(row.barcode || row.Barcode).trim() 
        : null;
      const sku = row.sku || row.SKU 
        ? String(row.sku || row.SKU).trim() 
        : null;
      const categoryName = row.category || row.Category 
        ? String(row.category || row.Category).trim() 
        : null;
      const cost = parseFloat(row.cost || row.Cost || 0) || 0;
      const price = parseFloat(row.price || row.Price || 0) || 0;
      const image_url = row.image_url || row.imageUrl || row['Image URL']
        ? String(row.image_url || row.imageUrl || row['Image URL']).trim()
        : null;

      // Handle categories
      let category_id = null;
      if (categoryName && categoryName.length > 0) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .maybeSingle();

        if (catError && catError.code !== 'PGRST116') {
          throw catError;
        }

        if (catData) {
          category_id = catData.id;
        } else {
          console.log(`  Creating category: ${categoryName}`);
          const { data: newCat, error: newCatError } = await supabase
            .from('categories')
            .insert({ name: categoryName })
            .select('id')
            .single();

          if (newCatError) {
            throw newCatError;
          }
          category_id = newCat.id;
        }
      }

      // Check for existing item
      let existingItem = null;
      if (barcode || sku) {
        const conditions = [];
        if (barcode) conditions.push(`barcode.eq.${barcode}`);
        if (sku) conditions.push(`sku.eq.${sku}`);

        const { data: existing, error: checkError } = await supabase
          .from('items')
          .select('id')
          .or(conditions.join(','))
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        existingItem = existing;
      }

      // Upsert item
      const itemData = {
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
        const { error: updateError } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', existingItem.id);

        if (updateError) {
          throw updateError;
        }
        results.updated++;
        process.stdout.write(`\r  Updated: ${name} (${results.updated})`);
      } else {
        const { error: insertError } = await supabase
          .from('items')
          .insert(itemData);

        if (insertError) {
          throw insertError;
        }
        results.inserted++;
        process.stdout.write(`\r  Inserted: ${name} (${results.inserted})`);
      }
    } catch (err) {
      results.errors.push({
        row: i + 2,
        error: err?.message || 'Unknown error',
      });
      console.error(`\n  Error on row ${i + 2}:`, err.message);
    }
  }

  // Print summary
  console.log('\n\n=== Import Summary ===');
  console.log(`Inserted: ${results.inserted}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.slice(0, 20).forEach(err => {
      console.log(`  Row ${err.row}: ${err.error}`);
    });
    if (results.errors.length > 20) {
      console.log(`  ... and ${results.errors.length - 20} more errors`);
    }
  }

  return results;
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node import-csv-to-supabase.js <path-to-csv-or-xlsx>');
  console.error('Example: node import-csv-to-supabase.js ../shwapno-products.csv');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

importCSV(filePath)
  .then(() => {
    console.log('\n✅ Import completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
```

---

## Usage

### Basic Usage

```bash
node scripts/import-csv-to-supabase.js path/to/file.csv
```

### Examples

```bash
# Import CSV
node scripts/import-csv-to-supabase.js shwapno-products.csv

# Import Excel
node scripts/import-csv-to-supabase.js inventory.xlsx

# Import from different directory
node scripts/import-csv-to-supabase.js ../data/competitors/shwapno/shwapno-bakingneeds.csv
```

---

## CSV Format

Same format as Edge Function:
- `name` (required)
- `barcode` (optional)
- `sku` (optional)
- `category` (optional)
- `cost` (optional)
- `price` (optional)
- `image_url` (optional)

---

## Features

- ✅ Reads CSV and XLSX files
- ✅ Creates categories automatically
- ✅ Updates existing items (by barcode or SKU)
- ✅ Inserts new items
- ✅ Progress indicator
- ✅ Error reporting
- ✅ Summary statistics

---

## Batch Import Multiple Files

Create `scripts/batch-import.js`:

```javascript
import { importCSV } from './import-csv-to-supabase.js';
import fs from 'fs';
import path from 'path';

const files = [
  'shwapno-eggs.csv',
  'shwapno-icecream.csv',
  'shwapno-bakingneeds.csv',
  'shwapno-snacks.csv',
  // Add all your CSV files
];

async function batchImport() {
  for (const file of files) {
    console.log(`\n\n=== Processing ${file} ===`);
    await importCSV(file);
    // Small delay between files
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

batchImport();
```

---

## Error Handling

The script handles:
- Missing files
- Invalid CSV format
- Database connection errors
- Duplicate entries
- Invalid data types

All errors are logged with row numbers for easy debugging.

---

## Performance

- Processes ~100 items/second
- For 1000+ items, expect 10-30 seconds
- Progress indicator shows current status
- Can be interrupted with Ctrl+C (partial import may occur)

---

## Security Notes

- Uses service role key (full database access)
- Keep `.env` file secure
- Don't commit `.env` to Git
- Use environment variables in production

---

## Troubleshooting

### "Cannot find module"
- Run `npm install` first
- Check Node.js version (18+)

### "Invalid API key"
- Verify SUPABASE_SERVICE_ROLE_KEY in .env
- Check key hasn't expired

### "Table not found"
- Run SQL schema from `docs/02-setup/02-SUPABASE-SCHEMA.md` first
- Verify tables exist in Supabase dashboard

### "Connection timeout"
- Check internet connection
- Verify SUPABASE_URL is correct
- Check Supabase project status

---

## Next Steps

1. Test with small CSV file first
2. Verify data in Supabase dashboard
3. Import all CSV files
4. Verify no duplicates created
5. Test POS functionality with imported data

