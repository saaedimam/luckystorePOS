# Frontend Import Integration Guide

## Overview
This guide shows how to integrate the Supabase CSV/XLSX import functionality into your existing `lucky-store-stock.html` file or new React application.

---

## Option A: Add to Existing HTML File

### Step 1: Add Supabase Client

Add to `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Step 2: Initialize Supabase Client

Add after other script variables:

```javascript
// Supabase configuration
const SUPABASE_URL = 'https://<your-project>.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Step 3: Add Upload Function

Add this function to your JavaScript:

```javascript
async function uploadInventoryToSupabase(file) {
  if (!file) {
    alert('Please select a file');
    return;
  }

  // Check file type
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
    alert('Please select a CSV or Excel file');
    return;
  }

  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    alert('Please login first to import data');
    // Optionally redirect to login
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    showExcelStatus('Uploading...', 'success');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-inventory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    
    if (result.error) {
      showExcelStatus('Import failed: ' + result.error, 'error');
      return;
    }

    // Show success message
    let message = `Import complete!\n\nInserted: ${result.inserted} items\nUpdated: ${result.updated} items`;
    if (result.errors && result.errors.length > 0) {
      message += `\n\nErrors: ${result.errors.length}`;
      if (result.errors.length <= 10) {
        message += '\n' + result.errors.map(e => `Row ${e.row}: ${e.error}`).join('\n');
      } else {
        message += '\n(First 10 errors shown in console)';
        console.error('All import errors:', result.errors);
      }
    }
    
    showExcelStatus(message, result.errors.length > 0 ? 'error' : 'success');
    
    // Refresh items list if using Supabase
    // loadItems(); // Uncomment when connected to Supabase

  } catch (error) {
    console.error('Upload error:', error);
    showExcelStatus('Upload failed: ' + error.message, 'error');
  }
}
```

### Step 4: Add Upload UI to Import Modal

Modify the Excel Import Modal section:

```html
<!-- Excel Import Modal -->
<div class="modal" id="excelImportModal">
  <div class="modal-content" style="max-width: 700px;" role="dialog" aria-modal="true" aria-labelledby="excelImportTitle">
    <div class="modal-header">
      <h2 id="excelImportTitle">Import from Excel/CSV</h2>
      <button class="close-btn" onclick="closeExcelImportModal()" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <!-- Existing Excel import section -->
      <div class="form-group">
        <label for="excelFile">Select Excel or CSV File (.xlsx, .xls, .csv)</label>
        <input type="file" id="excelFile" accept=".xlsx,.xls,.csv" onchange="handleExcelFile(event)">
      </div>
      
      <!-- Add Supabase import option -->
      <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
        <h4 style="margin-bottom: 10px;">Import to Supabase (Cloud)</h4>
        <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
          Import directly to cloud database. Requires login.
        </p>
        <input type="file" id="supabaseFile" accept=".xlsx,.xls,.csv" style="margin-bottom: 10px;">
        <button class="btn btn-primary" onclick="handleSupabaseUpload()" style="width: 100%;">
          📤 Upload to Supabase
        </button>
      </div>
      
      <!-- Rest of existing modal content -->
      <!-- ... -->
    </div>
  </div>
</div>
```

### Step 5: Add Upload Handler

```javascript
function handleSupabaseUpload() {
  const fileInput = document.getElementById('supabaseFile');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file first');
    return;
  }
  
  uploadInventoryToSupabase(file);
}
```

---

## Option B: React Component (For New App)

### Component: `ImportInventory.tsx`

```typescript
import { useState } from 'react';
import { supabase } from '../services/supabase';

interface ImportResult {
  inserted: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
}

export function ImportInventory() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Please login first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-inventory`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: formData,
        }
      );

      const data = await response.json();
      setResult(data);
      
      if (data.inserted > 0 || data.updated > 0) {
        // Refresh items list
        window.location.reload(); // Or call your items refresh function
      }
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="import-container">
      <h2>Import Inventory</h2>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {result && (
        <div className="import-results">
          <p>Inserted: {result.inserted}</p>
          <p>Updated: {result.updated}</p>
          {result.errors.length > 0 && (
            <div className="errors">
              <p>Errors: {result.errors.length}</p>
              <ul>
                {result.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>Row {err.row}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## CSV Format Helper

### Export Function for Current HTML File

Add this to export data in the correct format:

```javascript
function exportToSupabaseFormat() {
  const transaction = db.transaction(['items'], 'readonly');
  const objectStore = transaction.objectStore('items');
  const request = objectStore.getAll();

  request.onsuccess = () => {
    const items = request.result;
    
    // Convert to Supabase format
    const csvData = [
      ['name', 'barcode', 'sku', 'category', 'cost', 'price', 'image_url']
    ];
    
    items.forEach(item => {
      // Handle image URL - if it's a Blob, we can't export it directly
      // User will need to upload images separately or use existing URLs
      const imageUrl = item.image instanceof Blob ? '' : (item.image || '');
      
      csvData.push([
        item.name || '',
        item.barcode || '',
        '', // SKU - can be added later
        item.category || '',
        (item.cost || 0).toFixed(2),
        (item.price || 0).toFixed(2),
        imageUrl
      ]);
    });
    
    // Convert to CSV string
    const csv = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lucky-store-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
}
```

---

## Testing Checklist

### HTML Integration
- [ ] Supabase client loads correctly
- [ ] File input accepts CSV/XLSX
- [ ] Upload button triggers upload
- [ ] Progress indicator shows during upload
- [ ] Results display correctly
- [ ] Errors are shown to user
- [ ] Items list refreshes after import

### React Integration
- [ ] Component renders correctly
- [ ] File selection works
- [ ] Upload function calls API
- [ ] Loading state displays
- [ ] Results display
- [ ] Error handling works
- [ ] Items refresh after import

---

## Authentication Flow

### Option 1: Email/Password (Recommended)
```javascript
// Login function
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    alert('Login failed: ' + error.message);
    return false;
  }
  
  return true;
}

// Check if logged in before import
async function checkAuthBeforeImport() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const email = prompt('Email:');
    const password = prompt('Password:');
    return await login(email, password);
  }
  return true;
}
```

### Option 2: Anonymous Access (Not Recommended for Production)
- Use service role key (NOT recommended - security risk)
- Only for testing/development

---

## Error Handling

### Common Errors

1. **"File missing"**
   - Check file input has file selected
   - Verify FormData includes file

2. **"Unauthorized"**
   - Check user is logged in
   - Verify JWT token is valid
   - Check token hasn't expired

3. **"Function not found"**
   - Verify function is deployed
   - Check function URL is correct
   - Verify project reference

4. **"No data rows found"**
   - Check CSV has data rows (not just headers)
   - Verify file format is correct

---

## Next Steps

1. Add authentication UI to HTML file
2. Test import with sample CSV
3. Verify data appears in Supabase
4. Add error logging/monitoring
5. Create user documentation

