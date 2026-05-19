import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MESSAGES: Record<string, string> = {
  confirmed: "আপনার অর্ডারটি গ্রহণ করা হয়েছে! আমাদের টিম এখন পণ্যগুলো সংগ্রহ করছে।",
  preparing: "সুখবর! আপনার অর্ডারটি এখন প্যাকিং করা হচ্ছে।",
  out_for_delivery: "আপনার অর্ডারটি এখন ডেলিভারির জন্য বের হয়েছে। আমাদের রাইডার কিছুক্ষণের মধ্যেই পৌঁছে যাবে।",
  delivered: "আপনার অর্ডারটি সফলভাবে ডেলিভারি করা হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ!",
  cancelled: "দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।"
}

serve(async (req) => {
  try {
    const { type, table, record, old_record } = await req.json()

    // Only process status updates for online_orders
    if (table !== 'online_orders' || type !== 'UPDATE') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const newStatus = record.status
    const oldStatus = old_record.status

    if (newStatus === oldStatus || !MESSAGES[newStatus]) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const customerName = record.customer_name
    const customerPhone = record.customer_phone
    const orderId = record.id.substring(0, 8).toUpperCase()
    const trackingUrl = `https://store.luckystore.com/order/${record.id}`

    const banglaMessage = `আসসালামু আলাইকুম ${customerName},\n\n${MESSAGES[newStatus]}\n\nঅর্ডার আইডি: #${orderId}\nট্র্যাকিং লিঙ্ক: ${trackingUrl}\n\nধন্যবাদ,\nলাকি স্টোর`

    console.log(`[WHATSAPP NOTIFY] To: ${customerPhone}, Message: ${banglaMessage}`)

    // In a real scenario, call WhatsApp API here:
    /*
    await fetch('https://api.whatsapp.com/v1/messages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('WHATSAPP_API_TOKEN')}` },
      body: JSON.stringify({
        to: customerPhone,
        message: banglaMessage
      })
    })
    */

    return new Response(JSON.stringify({ success: true, message_logged: true }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
