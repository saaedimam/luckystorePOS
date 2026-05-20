import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, order_id, callback_url } = await req.json()

    // 1. Get bKash Auth Token
    // MOCK: In production, fetch from https://checkout.sandbox.bka.sh/v1.2.0-beta/checkout/token/grant
    const token = "mock_token_123"

    // 2. Create bKash Payment
    // MOCK: In production, POST to https://checkout.sandbox.bka.sh/v1.2.0-beta/checkout/payment/create
    const bkashURL = `https://bkash-sandbox-checkout.example.com/pay?token=${token}&amount=${amount}&order=${order_id}`

    return new Response(JSON.stringify({
      success: true,
      bkashURL,
      paymentID: "TRX-" + Math.random().toString(36).substring(7).toUpperCase()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    })
  }
})
