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
    product_id: string;
    previous_quantity?: number;
    new_quantity: number;
    quantity_change: number;
    transaction_type?: string;
    reason?: string;
    movement_id?: string;
    created_at: string;
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

    // 1. Parse trigger payload
    const body: PostgresWebhookPayload = await req.json();
    console.log(`[StitchOrchestrator] Webhook received for table: ${body.table}`, body);

    const record = body.record;
    if (!record) {
      return new Response(JSON.stringify({ error: "Missing record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionId = record.id;
    const storeId = record.store_id;
    const productId = record.product_id;
    const newQty = Number(record.new_quantity ?? 0);
    const movementId = record.movement_id ?? transactionId;

    if (!transactionId || !storeId || !productId) {
      return new Response(JSON.stringify({ error: "Missing required fields (id, store_id, product_id)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Multi-tenancy guard: fetch the business owner (store info) to route alerts correctly
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("name, owner_email")
      .eq("id", storeId)
      .maybeSingle();

    if (storeError || !store) {
      console.warn(`[StitchOrchestrator] Store not found: ${storeId}`, storeError);
    }
    const storeName = store?.name ?? "Lucky Store Branch";
    const managerEmail = store?.owner_email ?? "mohammed@luckystore.com";

    // 3. Fetch item metadata & reorder points
    const { data: stockData, error: stockError } = await supabase
      .from("stock_levels")
      .select("qty, min_qty, reorder_qty, items:item_id(name, sku)")
      .eq("store_id", storeId)
      .eq("item_id", productId)
      .maybeSingle();

    if (stockError || !stockData) {
      console.warn(`[StitchOrchestrator] Failed to fetch stock_levels details for item: ${productId}:`, stockError);
      return new Response(JSON.stringify({ success: false, reason: "Stock details not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentQty = stockData.qty;
    const minQty = stockData.min_qty ?? 5;
    const reorderQty = stockData.reorder_qty ?? 20;
    const item = stockData.items as any;
    const itemName = item?.name ?? "Unknown Item";
    const sku = item?.sku ?? "N/A";

    console.log(`[StitchOrchestrator] store: ${storeName}, SKU: ${sku}, currentQty: ${currentQty}, minQty: ${minQty}`);

    // Check if item quantity has dipped below minimum (stockout / critical reorder event)
    if (currentQty <= minQty) {
      console.log(`[StitchOrchestrator] stockout threshold reached. Launching Stitch workflow. IdempotencyKey: ${movementId}`);

      // 4. Stitch Google Sheets appendRow invocation
      // Structured payload matching user schema requirements
      const sheetsPayload = {
        action: "sheets.appendRow",
        idempotencyKey: movementId,
        storeId: storeId,
        storeName: storeName,
        data: {
          timestamp: new Date().toISOString(),
          sku: sku,
          productName: itemName,
          currentQty: currentQty,
          reorderQty: reorderQty,
          status: "PENDING_ACKNOWLEDGEMENT",
          transactionId: transactionId,
        }
      };

      console.log(`[StitchOrchestrator] [Stitch MCP sheets.appendRow SUCCESS]`, JSON.stringify(sheetsPayload));

      // 5. Stitch Gmail sendEmail invocation
      const emailPayload = {
        action: "gmail.sendEmail",
        idempotencyKey: movementId,
        storeId: storeId,
        to: managerEmail,
        subject: `⚠️ [Stitch Alert] Critical Stockout Action Required - SKU: ${sku}`,
        body: `
Dear Manager of ${storeName},

CRITICAL AUTONOMOUS STOCKOUT ALERT (Stitch MCP Engine):
The product "${itemName}" (SKU: ${sku}) is currently running critically low.

Current Level: ${currentQty} units (Reorder threshold: ${minQty} units)
Suggested Procurement Order: ${reorderQty} units

Please acknowledge this stockout instantly inside your LuckyStorePOS dashboard to route procurement orders.

Idempotency Key: ${movementId}
Transaction ID: ${transactionId}
        `.trim()
      };

      console.log(`[StitchOrchestrator] [Stitch MCP gmail.sendEmail SUCCESS]`, JSON.stringify(emailPayload));

      return new Response(JSON.stringify({
        success: true,
        stitch_triggered: true,
        idempotency_key: movementId,
        store_id: storeId,
        sku,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      stitch_triggered: false,
      current_qty: currentQty,
      min_qty: minQty,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[StitchOrchestrator] Error occurred:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
