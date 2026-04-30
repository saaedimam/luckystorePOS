// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://lucky-store.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaleItem {
  item_id: string
  quantity: number
  price: number
  cost?: number
  discount?: number
}

interface CreateSaleRequest {
  store_id: string | null
  client_transaction_id: string
  items: SaleItem[]
  discount: number
  payment_method_id: string
  reference?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user profile to get cashier_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Parse request body
    const body: CreateSaleRequest = await req.json()
    const {
      store_id,
      client_transaction_id,
      items,
      discount,
      payment_method_id,
      reference,
    } = body

    // Validate input
    if (!items || items.length === 0) {
      throw new Error('No items in sale')
    }

    if (!store_id) {
      throw new Error('Store ID is required')
    }
    if (!client_transaction_id || client_transaction_id.trim().length === 0) {
      throw new Error('client_transaction_id is required')
    }
    if (!payment_method_id) {
      throw new Error('payment_method_id is required')
    }

    const rpcItems = items.map((item) => ({
      item_id: item.item_id,
      qty: item.quantity,
      unit_price: item.price,
      cost: item.cost ?? 0,
      discount: item.discount ?? 0,
    }))

    const rpcPayments = [
      {
        payment_method_id,
        amount: rpcItems.reduce((sum, line) => sum + (line.unit_price * line.qty), 0) - (discount ?? 0),
        reference: reference ?? null,
      },
    ]
    const snapshot = {
      client_transaction_id,
      store_id,
      user_id: profile.id,
      mode: 'online',
      pricing_source: 'rpc',
      inventory_source: 'rpc',
      created_at: new Date().toISOString(),
      items: items.map((item) => ({
        product_id: item.item_id,
        quantity: item.quantity,
        unit_price_snapshot: item.price,
        discount_snapshot: item.discount ?? 0,
        stock_snapshot: 0,
      })),
    }

    const { data: saleResult, error: saleError } = await supabase.rpc('complete_sale', {
      p_store_id: store_id,
      p_cashier_id: profile.id,
      p_session_id: null,
      p_items: rpcItems,
      p_payments: rpcPayments,
      p_discount: discount ?? 0,
      p_client_transaction_id: client_transaction_id,
      p_notes: null,
      p_snapshot: snapshot,
      p_fulfillment_policy: 'STRICT',
      p_override_token: null,
      p_override_reason: null,
    })

    if (saleError) {
      console.error('complete_sale RPC error:', saleError)
      throw new Error('Failed to create sale')
    }

    const result = saleResult as Record<string, unknown>
    const syncStatus = (result.sync_status as string | undefined) ?? 'synced'
    const status = (result.status as string | undefined) ?? 'REJECTED'

    // Return success response
    return new Response(
      JSON.stringify({
        success: status === 'SUCCESS' || status === 'ADJUSTED',
        status,
        sync_status: syncStatus,
        duplicate_detected: result.duplicate_detected ?? false,
        conflict_type: result.conflict_type ?? null,
        conflict_reason: result.conflict_reason ?? null,
        adjustments: result.adjustments ?? [],
        message: result.message ?? null,
        sale_id: result.sale_id,
        sale_number: result.sale_number,
        total: result.total_amount ?? 0,
        items: rpcItems.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-sale function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

