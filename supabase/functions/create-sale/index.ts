// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaleItem {
  item_id: string
  quantity: number
  price: number
}

interface CreateSaleRequest {
  store_id: string | null
  items: SaleItem[]
  discount: number
  payment_method: string
  payment_meta: {
    cash_paid: number
    change: number
  }
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
    const { store_id, items, discount, payment_method, payment_meta } = body

    // Validate input
    if (!items || items.length === 0) {
      throw new Error('No items in sale')
    }

    if (!store_id) {
      throw new Error('Store ID is required')
    }

    // Start a transaction by doing all operations in sequence
    // 1. Generate receipt number
    const { data: receiptData, error: receiptError } = await supabase
      .rpc('get_new_receipt', { store: store_id })

    if (receiptError) {
      console.error('Receipt generation error:', receiptError)
      throw new Error('Failed to generate receipt number')
    }

    const receiptNumber = receiptData as string

    // 2. Get item details and check stock availability
    const itemIds = items.map(item => item.item_id)
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('id, name, cost, price')
      .in('id', itemIds)

    if (itemsError || !itemsData) {
      throw new Error('Failed to fetch item details')
    }

    // Check stock levels
    const { data: stockData, error: stockError } = await supabase
      .from('stock_levels')
      .select('item_id, qty')
      .eq('store_id', store_id)
      .in('item_id', itemIds)

    if (stockError) {
      throw new Error('Failed to check stock levels')
    }

    // Verify stock availability
    const stockMap = new Map<string, number>(
      (stockData ?? []).map((s: { item_id: string; qty: number }) => [s.item_id, s.qty]),
    )
    for (const item of items) {
      const availableQty = stockMap.get(item.item_id) ?? 0
      if (availableQty < item.quantity) {
        const itemName = itemsData.find(i => i.id === item.item_id)?.name || 'Unknown item'
        throw new Error(`Insufficient stock for ${itemName}. Available: ${availableQty}, Required: ${item.quantity}`)
      }
    }

    // 3. Calculate subtotal and total
    const subtotal = items.reduce((sum, item) => {
      const itemData = itemsData.find(i => i.id === item.item_id)
      return sum + (item.price * item.quantity)
    }, 0)

    const total = subtotal - discount

    // 4. Create sale record
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        store_id,
        cashier_id: profile.id,
        receipt_number: receiptNumber,
        subtotal,
        discount,
        total,
        payment_method,
        payment_meta,
        status: 'completed'
      })
      .select()
      .single()

    if (saleError) {
      console.error('Sale creation error:', saleError)
      throw new Error('Failed to create sale record')
    }

    // 5. Create sale items
    const saleItems = items.map(item => {
      const itemData = itemsData.find(i => i.id === item.item_id)
      return {
        sale_id: saleData.id,
        item_id: item.item_id,
        price: item.price,
        cost: itemData?.cost || 0,
        qty: item.quantity,
        line_total: item.price * item.quantity
      }
    })

    const { error: saleItemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (saleItemsError) {
      console.error('Sale items error:', saleItemsError)
      throw new Error('Failed to create sale items')
    }

    // 6. Update stock levels and create stock movements
    for (const item of items) {
      // Decrement stock
      const { error: stockUpdateError } = await supabase
        .rpc('decrement_stock', {
          p_store_id: store_id,
          p_item_id: item.item_id,
          p_quantity: item.quantity
        })

      if (stockUpdateError) {
        console.error('Stock update error:', stockUpdateError)
        // Log but don't fail the sale - we'll handle this manually
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          store_id,
          item_id: item.item_id,
          delta: -item.quantity,
          reason: 'sale',
          meta: {
            sale_id: saleData.id,
            receipt_number: receiptNumber
          },
          performed_by: profile.id
        })

      if (movementError) {
        console.error('Stock movement error:', movementError)
        // Log but don't fail the sale
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        receipt_number: receiptNumber,
        sale_id: saleData.id,
        total,
        items: saleItems.length
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

