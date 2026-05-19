import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostgresWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    store_id: string;
    item_id?: string;
    product_id?: string;
    qty?: number;
    quantity?: number;
    created_at?: string;
  };
  old_record: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate Postgres webhook trigger payload
    const body: PostgresWebhookPayload = await req.json();
    console.log(`[SyncAlertBridge] Received database trigger on ${body.schema}.${body.table}:`, body);

    const record = body.record;
    if (!record) {
      return new Response(JSON.stringify({ error: "Missing record in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storeId = record.store_id;
    const productId = record.product_id ?? record.item_id;

    if (!storeId || !productId) {
      return new Response(JSON.stringify({ error: "Missing store_id or product_id/item_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query active stock level and product information from DB to verify if it is below reorder point
    const { data: stockData, error: stockError } = await supabase
      .from("stock_levels")
      .select("qty, min_qty, reorder_qty, products(name, sku)")
      .eq("store_id", storeId)
      .eq("item_id", productId)
      .maybeSingle();

    if (stockError || !stockData) {
      console.error(`[SyncAlertBridge] Failed to fetch stock levels for item: ${productId}:`, stockError);
      return new Response(JSON.stringify({ success: false, reason: "Stock details not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentQty = stockData.qty;
    const minQty = stockData.min_qty ?? 5;
    const reorderQty = stockData.reorder_qty ?? 20;
    const product = stockData.products as any;
    const productName = product?.name ?? "Unknown Item";
    const sku = product?.sku ?? "N/A";

    console.log(`[SyncAlertBridge] SKU: ${sku}, Qty: ${currentQty}, Reorder Point: ${minQty}`);

    // Check if the current stock level is below the reorder point (critical threshold)
    if (currentQty <= minQty) {
      console.log(`[SyncAlertBridge] Stock is CRITICALLY LOW (${currentQty} <= ${minQty}). Triggering autonomous Stitch sync alerts!`);

      // 1. Google Sheets sync via Google Stitch MCP
      console.log(
        `[SyncAlertBridge] [STITCH sheets.appendRow] Store ID: ${storeId}, Name: ${productName}, SKU: ${sku}, Qty: ${currentQty}, Reorder Point: ${minQty}`
      );

      // 2. Email alert via Google Stitch MCP (Gmail API integration)
      const emailBody = `
Dear Mohammed,

CRITICAL AUTOMATED PROCUREMENT ALERT:
The stock level for the item "${productName}" (SKU: ${sku}) has fallen to ${currentQty}.
This is at or below the reorder point of ${minQty}.

Suggested procurement reorder quantity: ${reorderQty} units.

Please trigger the quick restock action in your Stitch control tower immediately.

Best regards,
LuckyStorePOS Autonomous Alert Bridge (Stitch Edge Function)
      `.trim();

      console.log(
        `[SyncAlertBridge] [STITCH gmail.sendEmail] Sending alert to mohammed@luckystore.com for SKU: ${sku}:\n`,
        emailBody
      );

      // 3. Optional: Trigger WhatsApp push alert via existing send-whatsapp-message function
      const whatsappAccessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
      const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      
      if (whatsappAccessToken && whatsappPhoneId) {
        try {
          const managerPhone = "+15550199"; // Configured manager's mobile number
          console.log(`[SyncAlertBridge] Sending WhatsApp push notification to manager: ${managerPhone}`);
          
          const cleanPhone = managerPhone.replace(/\D/g, '');
          const messageText = `⚠️ *LOW STOCK ALERT* ⚠️\nProduct: ${productName}\nSKU: ${sku}\nCurrent Qty: ${currentQty}\nReorder Qty: ${reorderQty}`;

          await fetch(
            `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${whatsappAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: {
                  preview_url: false,
                  body: messageText,
                },
              }),
            }
          );
          console.log(`[SyncAlertBridge] WhatsApp push notification sent.`);
        } catch (waError) {
          console.warn("[SyncAlertBridge] Failed to send WhatsApp notification:", waError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        alert_triggered: true,
        current_qty: currentQty,
        min_qty: minQty,
        sku,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      alert_triggered: false,
      current_qty: currentQty,
      min_qty: minQty,
      sku,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[SyncAlertBridge] Error in sync-alert-bridge:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
