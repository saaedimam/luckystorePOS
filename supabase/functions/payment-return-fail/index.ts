import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const appBaseUrl = Deno.env.get('FRONTEND_BASE_URL') || Deno.env.get('APP_BASE_URL') || 'http://localhost:5173'

  try {
    const reqUrl = new URL(req.url)
    const queryParams = reqUrl.searchParams
    const formParams = new URLSearchParams()

    if (req.method === 'POST') {
      const form = await req.formData()
      form.forEach((value, key) => formParams.set(key, String(value)))
    }

    const params = formParams.get('tran_id') ? formParams : queryParams
    const target = new URL('/pos/checkout/fail', appBaseUrl)
    const tranId = params.get('tran_id')
    const error = params.get('failedreason') || params.get('error')
    if (tranId) target.searchParams.set('tran_id', tranId)
    if (error) target.searchParams.set('error', error)

    return Response.redirect(target.toString(), 302)
  } catch {
    return Response.redirect(new URL('/pos/checkout/error', appBaseUrl).toString(), 302)
  }
})
