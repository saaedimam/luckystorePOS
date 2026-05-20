import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const payload = await req.json()
    const order = payload.record

    if (!order || !order.customer_whatsapp) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    const message = `আপনার অর্ডার #${order.order_number} পাওয়া গেছে। মোট: ৳${order.total}। আমরা শীঘ্রই নিশ্চিত করব। Lucky Store`
    
    const whatsappToken = Deno.env.get("WHATSAPP_TOKEN")
    
    if (whatsappToken) {
      // Send via Meta Cloud API if token is present
      const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_ID")
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `88${order.customer_whatsapp.replace(/^0+/, '')}`,
          type: "text",
          text: { body: message }
        })
      })
      
      const result = await response.json()
      return new Response(JSON.stringify({ success: true, result }), { status: 200 })
    } else {
      // Just log the wa.me link generation (since Edge Functions don't open browser tabs for the user)
      const waUrl = `https://wa.me/88${order.customer_whatsapp.replace(/^0+/, '')}?text=${encodeURIComponent(message)}`
      console.log(`Generated WhatsApp Link: ${waUrl}`)
      return new Response(JSON.stringify({ success: true, link: waUrl }), { status: 200 })
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
