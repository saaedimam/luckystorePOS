import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Message templates in Bangla with placeholders
const MESSAGE_TEMPLATES: Record<string, { body: string; buttons?: any[] }> = {
  confirmed: {
    body: "আসসালামু আলাইকুম {{customer_name}},\n\n✅ আপনার অর্ডার #{{order_number}} গ্রহণ করা হয়েছে!\n\n📦 পণ্যগুলো সংগ্রহ করা হচ্ছে। আপনাকে আপডেট জানানো হবে।\n\n📋 অর্ডার সারাংশ:\n{{order_summary}}\n\n💰 মোট: ৳{{total}}\n\nধন্যবাদ,\nলাকি স্টোর 🏪"
  },
  preparing: {
    body: "আসসালামু আলাইকুম {{customer_name}},\n\n📦 আপনার অর্ডার #{{order_number}} এখন প্রস্তুত করা হচ্ছে!\n\n✨ আমাদের টিম আপনার পণ্যগুলো যত্ন সহকারে প্যাক করছে।\n\n🚚 শীঘ্রই ডেলিভারির জন্য পাঠানো হবে।\n\nধন্যবাদ,\nলাকি স্টোর 🏪"
  },
  out_for_delivery: {
    body: "আসসালামু আলাইকুম {{customer_name}},\n\n🚚 আপনার অর্ডার #{{order_number}} ডেলিভারির জন্য বের হয়েছে!\n\n📍 {{delivery_address}}\n\n💡 ট্র্যাক করুন: {{tracking_url}}\n\n🙏 অনুগ্রহ করে প্রস্তুত থাকুন।\n\nধন্যবাদ,\nলাকি স্টোর 🏪"
  },
  delivered: {
    body: "আসসালামু আলাইকুম {{customer_name}},\n\n🎉 আপনার অর্ডার #{{order_number}} সফলভাবে ডেলিভারি করা হয়েছে!\n\n🙏 আমাদের সাথে থাকার জন্য ধন্যবাদ। আপনার অভিজ্ঞতা কেমন ছিল জানাতে রিভিউ দিন:\n\n⭐ {{review_url}}\n\nধন্যবাদ,\nলাকি স্টোর 🏪"
  },
  cancelled: {
    body: "আসসালামু আলাইকুম {{customer_name}},\n\n❌ আপনার অর্ডার #{{order_number}} বাতিল করা হয়েছে।\n\n🙏 দুঃখিত এই অসুবিধার জন্য। প্রশ্ন থাকলে যোগাযোগ করুন:\n\n📞 {{store_phone}}\n\nধন্যবাদ,\nলাকি স্টোর 🏪"
  }
}

interface OrderRecord {
  id: string
  order_number: string
  customer_name: string
  customer_whatsapp: string
  customer_address: string
  status: string
  subtotal: number
  delivery_fee: number
  total: number
  tenant_id: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook payload
    const { type, table, record, old_record } = await req.json()

    // Only process updates for online_orders
    if (table !== 'online_orders' || type !== 'UPDATE') {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'not_order_update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const newStatus = record.status?.toLowerCase()
    const oldStatus = old_record?.status?.toLowerCase()

    // Only notify on actual status changes to tracked statuses
    if (newStatus === oldStatus || !MESSAGE_TEMPLATES[newStatus]) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_notification_status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const order = record as OrderRecord

    // Validate required fields
    if (!order.customer_whatsapp) {
      console.error('[WHATSAPP NOTIFY] Missing customer_whatsapp for order:', order.id)
      return new Response(
        JSON.stringify({ error: 'Missing customer WhatsApp number' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get order items for summary
    const { data: orderItems, error: itemsError } = await supabase
      .from('online_order_items')
      .select('quantity, unit_price, products(name_en, name_bn)')
      .eq('order_id', order.id)

    if (itemsError) {
      console.error('[WHATSAPP NOTIFY] Error fetching order items:', itemsError)
    }

    // Build order summary
    const orderSummary = orderItems?.map((item: any) =>
      `• ${item.products?.name_bn || item.products?.name_en || 'Product'} x${item.quantity}`
    ).join('\n') || 'Order details unavailable'

    // Prepare message variables
    const messageVars = {
      customer_name: order.customer_name?.split(' ')[0] || 'Customer',
      order_number: order.order_number,
      order_summary: orderSummary,
      total: order.total?.toLocaleString('en-IN') || '0',
      delivery_address: order.customer_address?.substring(0, 50) || 'Your address',
      tracking_url: `https://store.luckystore.com/order/${order.order_number}`,
      store_phone: '+8801XXXXXXXXX',
      review_url: `https://store.luckystore.com/review/${order.order_number}`
    }

    // Replace template variables
    const template = MESSAGE_TEMPLATES[newStatus]
    let messageBody = template.body

    Object.entries(messageVars).forEach(([key, value]) => {
      messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    })

    // Get WhatsApp credentials
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

    if (!phoneNumberId || !accessToken) {
      console.error('[WHATSAPP NOTIFY] WhatsApp credentials not configured')

      // Log to whatsapp_logs for audit
      await supabase.from('whatsapp_logs').insert({
        recipient: order.customer_whatsapp,
        template: newStatus,
        status: 'failed',
        response: { error: 'WhatsApp credentials not configured' },
        order_id: order.id,
        tenant_id: order.tenant_id
      })

      return new Response(
        JSON.stringify({
          error: 'WhatsApp integration not configured',
          message_preview: messageBody // Return message for debugging
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      )
    }

    // Clean phone number (Bangladesh format)
    const cleanPhone = order.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '880')

    // Call WhatsApp Business API
    const waResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: messageBody,
          },
        }),
      }
    )

    const waResult = await waResponse.json()

    // Log the delivery attempt
    const logEntry = {
      recipient: cleanPhone,
      template: newStatus,
      status: waResponse.ok ? 'sent' : 'failed',
      response: waResult,
      order_id: order.id,
      tenant_id: order.tenant_id,
      message_id: waResult.messages?.[0]?.id
    }

    await supabase.from('whatsapp_logs').insert(logEntry)

    if (!waResponse.ok) {
      console.error('[WHATSAPP NOTIFY] WhatsApp API error:', waResult)

      // Retry logic for specific errors
      const retryableErrors = ['rate_limit', 'temporarily_unavailable']
      const shouldRetry = retryableErrors.some(e =>
        JSON.stringify(waResult).toLowerCase().includes(e)
      )

      return new Response(
        JSON.stringify({
          error: waResult.error?.message || 'Failed to send WhatsApp message',
          code: waResult.error?.code,
          should_retry: shouldRetry,
          message_preview: messageBody
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    console.log(`[WHATSAPP NOTIFY] Sent ${newStatus} notification to ${cleanPhone} for order ${order.order_number}`)

    return new Response(
      JSON.stringify({
        success: true,
        message_id: waResult.messages?.[0]?.id,
        status: newStatus,
        recipient: cleanPhone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[WHATSAPP NOTIFY] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
