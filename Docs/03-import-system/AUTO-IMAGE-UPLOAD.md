# Auto-Image Upload to Supabase Storage

## Overview
Automatically upload product images to Supabase Storage during CSV import, replacing local file paths with public URLs.

---

## Prerequisites

### 1. Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New bucket**
3. Name: `item-images`
4. **Public bucket:** ✅ Yes (or use signed URLs)
5. Click **Create**

### 2. Set Bucket Policies (Optional)

```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'item-images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'item-images' AND
  auth.role() = 'authenticated'
);
```

---

## Implementation

### Add Helper Function

Add this function to your Edge Function **before** the main processing:

```typescript
/**
 * Uploads an image file to Supabase Storage
 * @param file - File object from form data
 * @param itemName - Product name (for naming)
 * @returns Public URL of uploaded image
 */
async function uploadImageToStorage(
  file: File,
  itemName: string
): Promise<string> {
  const bucket = "item-images";
  
  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const sanitizedName = itemName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase()
    .substring(0, 50);
  const storagePath = `items/${sanitizedName}-${crypto.randomUUID()}.${ext}`;

  // Upload file
  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type || `image/${ext}`,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}
```

---

## Updated Edge Function

### Handle Multiple Files

If uploading CSV + images together:

```typescript
serve(async (req) => {
  try {
    // ... existing code ...
    
    const form = await req.formData();
    const file = form.get("file") as File; // CSV/Excel file
    
    // Get image files (if uploaded)
    const imageFiles = new Map<string, File>();
    for (const [key, value] of form.entries()) {
      if (key.startsWith("image_") && value instanceof File) {
        const itemName = key.replace("image_", "");
        imageFiles.set(itemName, value);
      }
    }
    
    // ... process CSV rows ...
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row.name || "").trim();
      
      // Handle image upload
      let image_url = row.image_url || row.imageUrl || null;
      
      // If image file uploaded for this item
      if (imageFiles.has(name)) {
        const imageFile = imageFiles.get(name)!;
        try {
          image_url = await uploadImageToStorage(imageFile, name);
          console.log(`Uploaded image for ${name}: ${image_url}`);
        } catch (err) {
          console.error(`Failed to upload image for ${name}:`, err);
          // Continue without image
        }
      }
      // If image_url is a local path, skip (can't upload from path)
      else if (image_url && (
        image_url.startsWith("file://") || 
        image_url.startsWith("C:\\") ||
        image_url.startsWith("./") ||
        image_url.startsWith("../")
      )) {
        console.warn(`Local image path detected for ${name}, skipping: ${image_url}`);
        image_url = null; // Skip local paths
      }
      
      // ... rest of processing ...
    }
  }
});
```

---

## Frontend Integration

### HTML Form with Images

```html
<form id="importForm" enctype="multipart/form-data">
  <input type="file" id="csvFile" name="file" accept=".csv,.xlsx,.xls" required>
  
  <!-- Optional: Upload images -->
  <div id="imageUploads">
    <h4>Product Images (Optional)</h4>
    <input type="file" id="images" name="images" multiple accept="image/*">
    <small>Upload images matching product names</small>
  </div>
  
  <button type="submit">Import</button>
</form>
```

### JavaScript Upload Handler

```javascript
async function uploadWithImages() {
  const csvFile = document.getElementById('csvFile').files[0];
  const imageFiles = document.getElementById('images').files;
  
  const formData = new FormData();
  formData.append('file', csvFile);
  
  // Add images with item name as key
  // Note: This requires matching filenames to product names
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const itemName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    formData.append(`image_${itemName}`, file);
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/import-inventory`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: formData,
    }
  );
  
  const result = await response.json();
  console.log('Import result:', result);
}
```

---

## Alternative: ZIP File Support

### Upload ZIP with CSV + Images

If you want to upload a ZIP file containing:
- `inventory.xlsx`
- `images/product1.jpg`
- `images/product2.jpg`

**Enhanced Edge Function:**

```typescript
import { unzip } from "https://deno.land/x/zip@v1.2.3/mod.ts";

async function handleZipUpload(zipFile: File) {
  const arrayBuffer = await zipFile.arrayBuffer();
  const zip = await unzip(new Uint8Array(arrayBuffer));
  
  // Find CSV/Excel file
  let csvFile: File | null = null;
  const imageFiles = new Map<string, Uint8Array>();
  
  for (const [path, data] of Object.entries(zip)) {
    if (path.match(/\.(csv|xlsx|xls)$/i)) {
      csvFile = new File([data], path);
    } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const itemName = path.split('/').pop()?.replace(/\.[^/.]+$/, "") || "";
      imageFiles.set(itemName, data);
    }
  }
  
  if (!csvFile) {
    throw new Error("No CSV/Excel file found in ZIP");
  }
  
  // Process CSV and match images
  // ... rest of processing ...
}
```

---

## Image Matching Strategies

### Strategy 1: Filename Match
- Image: `parachute-oil.jpg`
- Product name: `Parachute Oil`
- Match by sanitized name

### Strategy 2: Barcode Match
- Image: `1234567890123.jpg`
- Product barcode: `1234567890123`
- Match by barcode

### Strategy 3: SKU Match
- Image: `SKU-PO200.jpg`
- Product SKU: `SKU-PO200`
- Match by SKU

### Implementation

```typescript
function matchImageToItem(
  itemName: string,
  barcode: string | null,
  sku: string | null,
  imageFiles: Map<string, File>
): File | null {
  // Try SKU first
  if (sku && imageFiles.has(sku)) {
    return imageFiles.get(sku)!;
  }
  
  // Try barcode
  if (barcode && imageFiles.has(barcode)) {
    return imageFiles.get(barcode)!;
  }
  
  // Try sanitized name
  const sanitizedName = itemName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();
  
  for (const [filename, file] of imageFiles.entries()) {
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    
    if (sanitizedFilename.includes(sanitizedName) || 
        sanitizedName.includes(sanitizedFilename)) {
      return file;
    }
  }
  
  return null;
}
```

---

## Storage Structure

### Recommended Folder Structure

```
item-images/
├── items/
│   ├── parachute-oil-200ml-uuid.jpg
│   ├── danish-cookies-300g-uuid.jpg
│   └── sunsilk-pink-shampoo-uuid.jpg
└── thumbnails/  (optional, for future)
    └── ...
```

---

## Image Optimization (Future Enhancement)

### Resize Before Upload

```typescript
async function optimizeAndUpload(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<string> {
  // Use image processing library
  // Resize image
  // Upload resized version
  // Return URL
}
```

---

## Testing

### Test Image Upload

1. **Create test CSV:**
```csv
name,barcode,image_url
Test Product,1234567890123,test-image.jpg
```

2. **Upload CSV + image file**
3. **Verify:**
   - Image uploaded to Storage
   - URL stored in `items.image_url`
   - Image accessible via URL

---

## Troubleshooting

### Error: "Bucket not found"
**Solution:** Create `item-images` bucket in Supabase Storage

### Error: "Upload failed"
**Solution:** Check bucket policies, verify file size limits

### Images Not Matching
**Solution:** Ensure filenames match product names/SKUs/barcodes

### Large Files
**Solution:** Implement file size limits, consider compression

---

## Next Steps

1. ✅ Create storage bucket
2. ✅ Add upload function to Edge Function
3. ✅ Test with sample images
4. ✅ Verify URLs stored correctly
5. ✅ Display images in POS/admin UI

---

## Future Enhancements

- **ZIP support:** Upload CSV + images in one ZIP
- **Image optimization:** Resize/compress before upload
- **Thumbnail generation:** Create thumbnails automatically
- **CDN integration:** Use CDN for faster image delivery
- **Bulk upload:** Upload multiple images at once

Tell me if you want ZIP support implemented!

