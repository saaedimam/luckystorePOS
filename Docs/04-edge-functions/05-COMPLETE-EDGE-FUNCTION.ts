/**
 * COMPLETE SUPABASE EDGE FUNCTION - EXTENDED INVENTORY IMPORTER
 * 
 * Features:
 * - CSV/XLSX import
 * - Stock quantities per store
 * - Batch tracking (supplier, batch_code, expiry_date)
 * - Auto-barcode generation (EAN-13)
 * - Image upload to Supabase Storage
 * - Complete audit trail
 * 
 * File: supabase/functions/import-inventory/index.ts
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============== HELPER FUNCTIONS ===============

/**
 * Generates a valid EAN-13 barcode
 * EAN-13 format: 12 digits + 1 checksum digit
 */
function generateEAN13(): string {
  const base = Array.from({ length: 12 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return base + checksum.toString();
}

/**
 * Uploads an image file to Supabase Storage
 */
async function uploadImageToStorage(
  supabaseClient: any,
  file: File,
  itemName: string
): Promise<string> {
  const bucket = "item-images";
  
  const ext = file.name.split(".").pop() || "jpg";
  const sanitizedName = itemName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase()
    .substring(0, 50);
  const storagePath = `items/${sanitizedName}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type || `image/${ext}`,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

// =============== MAIN FUNCTION ===============

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST allowed" }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const contentType = req.headers.get("content-type") ?? "";
    
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data or JSON" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "File missing" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get image files if uploaded
    const imageFiles = new Map<string, File>();
    for (const [key, value] of form.entries()) {
      if (key.startsWith("image_") && value instanceof File) {
        const itemName = key.replace("image_", "");
        imageFiles.set(itemName, value);
      }
    }

    // Parse CSV/Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    });

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data rows found" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const summary = {
      items_inserted: 0,
      items_updated: 0,
      batches_created: 0,
      stock_created: 0,
      stock_updated: 0,
      stock_movements: 0,
      barcodes_generated: 0,
      images_uploaded: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = String(row.name || row.Name || "").trim();
        if (!name || name.length === 0) {
          summary.errors.push({ row: i + 2, error: "Missing name" });
          continue;
        }

        // Parse fields
        let barcode = row.barcode || row.Barcode 
          ? String(row.barcode || row.Barcode).trim() 
          : null;
        
        // Auto-generate barcode if missing
        if (!barcode || barcode.length === 0) {
          barcode = generateEAN13();
          summary.barcodes_generated++;
        }

        const sku = row.sku || row.SKU ? String(row.sku || row.SKU).trim() : null;
        const categoryName = row.category || row.Category ? String(row.category || row.Category).trim() : null;
        const supplier = row.supplier || row.Supplier ? String(row.supplier || row.Supplier).trim() : null;
        const batch_code = row.batch_code || row["batch_code"] || row["Batch Code"] 
          ? String(row.batch_code || row["batch_code"] || row["Batch Code"]).trim() 
          : null;
        
        // Handle expiry_date
        let expiry_date = null;
        if (row.expiry_date || row["expiry_date"] || row["Expiry Date"]) {
          const expiryValue = row.expiry_date || row["expiry_date"] || row["Expiry Date"];
          if (typeof expiryValue === 'number') {
            const excelDate = XLSX.SSF.parse_date_code(expiryValue);
            expiry_date = new Date(excelDate.y, excelDate.m - 1, excelDate.d).toISOString().split('T')[0];
          } else {
            const parsed = new Date(expiryValue);
            if (!isNaN(parsed.getTime())) {
              expiry_date = parsed.toISOString().split('T')[0];
            }
          }
        }

        let image_url = row.image_url || row.imageUrl || row["Image URL"] 
          ? String(row.image_url || row.imageUrl || row["Image URL"]).trim() 
          : null;

        // Handle image upload
        if (imageFiles.has(name)) {
          try {
            const imageFile = imageFiles.get(name)!;
            image_url = await uploadImageToStorage(supabaseClient, imageFile, name);
            summary.images_uploaded++;
          } catch (err: any) {
            console.error(`Failed to upload image for ${name}:`, err);
            // Continue without image
          }
        }

        const cost = parseFloat(row.cost || row.Cost || 0) || 0;
        const price = parseFloat(row.price || row.Price || 0) || 0;
        const stock_qty = parseInt(row.stock_qty || row["stock_qty"] || row["Stock Qty"] || 0) || 0;
        const store_code = row.store_code || row["store_code"] || row["Store Code"] 
          ? String(row.store_code || row["store_code"] || row["Store Code"]).trim() 
          : null;

        // Validate stock_qty requires store_code
        if (stock_qty > 0 && !store_code) {
          throw new Error("stock_qty provided but store_code missing");
        }

        // 1 — CATEGORY
        let category_id = null;
        if (categoryName && categoryName.length > 0) {
          const { data: existingCategory, error: catError } = await supabaseClient
            .from("categories")
            .select("id")
            .eq("name", categoryName)
            .maybeSingle();

          if (catError && catError.code !== 'PGRST116') {
            throw catError;
          }

          if (existingCategory) {
            category_id = existingCategory.id;
          } else {
            const { data: newCategory, error: newCatError } = await supabaseClient
              .from("categories")
              .insert({ name: categoryName })
              .select("id")
              .single();

            if (newCatError) {
              throw newCatError;
            }
            category_id = newCategory.id;
          }
        }

        // 2 — ITEM UPSERT
        let existingItem = null;
        if (barcode || sku) {
          const conditions: string[] = [];
          if (barcode) conditions.push(`barcode.eq.${barcode}`);
          if (sku) conditions.push(`sku.eq.${sku}`);
          
          const { data: existing, error: checkError } = await supabaseClient
            .from("items")
            .select("id")
            .or(conditions.join(","))
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }
          existingItem = existing;
        }

        let item_id;
        if (existingItem) {
          item_id = existingItem.id;
          const { error: updateError } = await supabaseClient
            .from("items")
            .update({
              name,
              barcode: barcode || null,
              sku: sku || null,
              category_id,
              cost,
              price,
              image_url: image_url || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item_id);

          if (updateError) {
            throw updateError;
          }
          summary.items_updated++;
        } else {
          const { data: newItem, error: insertError } = await supabaseClient
            .from("items")
            .insert({
              name,
              barcode: barcode || null,
              sku: sku || null,
              category_id,
              cost,
              price,
              image_url: image_url || null,
            })
            .select("id")
            .single();

          if (insertError) {
            throw insertError;
          }
          item_id = newItem.id;
          summary.items_inserted++;
        }

        // 3 — STORE lookup if stock exists
        let store_id = null;
        if (store_code) {
          const { data: store, error: storeError } = await supabaseClient
            .from("stores")
            .select("id")
            .eq("code", store_code)
            .maybeSingle();

          if (storeError && storeError.code !== 'PGRST116') {
            throw storeError;
          }

          if (!store) {
            throw new Error(`Store code '${store_code}' not found. Available stores: Run SELECT code FROM stores;`);
          }
          store_id = store.id;
        }

        // 4 — BATCH creation
        let batch_id = null;
        if (batch_code || expiry_date || supplier) {
          const { data: batch, error: batchError } = await supabaseClient
            .from("batches")
            .insert({
              item_id,
              batch_code: batch_code || null,
              supplier: supplier || null,
              expiry_date: expiry_date || null,
              qty: stock_qty > 0 ? stock_qty : 0,
            })
            .select("id")
            .single();

          if (batchError) {
            throw batchError;
          }
          batch_id = batch.id;
          summary.batches_created++;
        }

        // 5 — STOCK LEVELS
        if (stock_qty > 0 && store_id) {
          const { data: stockRow, error: stockCheckError } = await supabaseClient
            .from("stock_levels")
            .select("qty")
            .eq("store_id", store_id)
            .eq("item_id", item_id)
            .maybeSingle();

          if (stockCheckError && stockCheckError.code !== 'PGRST116') {
            throw stockCheckError;
          }

          if (stockRow) {
            const { error: updateStockError } = await supabaseClient
              .from("stock_levels")
              .update({
                qty: stockRow.qty + stock_qty,
              })
              .eq("store_id", store_id)
              .eq("item_id", item_id);

            if (updateStockError) {
              throw updateStockError;
            }
            summary.stock_updated++;
          } else {
            const { error: insertStockError } = await supabaseClient
              .from("stock_levels")
              .insert({
                store_id,
                item_id,
                qty: stock_qty,
              });

            if (insertStockError) {
              throw insertStockError;
            }
            summary.stock_created++;
          }

          // 6 — STOCK MOVEMENT AUDIT
          const { error: movementError } = await supabaseClient
            .from("stock_movements")
            .insert({
              store_id,
              item_id,
              batch_id,
              delta: stock_qty,
              reason: "import",
              meta: { source: "CSV importer", row: i + 2 },
              performed_by: null,
            });

          if (movementError) {
            throw movementError;
          }
          summary.stock_movements++;
        }
      } catch (err: any) {
        summary.errors.push({
          row: i + 2,
          error: err?.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

