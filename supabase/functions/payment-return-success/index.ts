import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildRedirect(baseUrl: string, path: string, params: URLSearchParams) {
  const target = new URL(path, baseUrl)
  const tranId = params.get('tran_id')
  if (tranId) target.searchParams.set('tran_id', tranId)
  return target.toString()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const appBaseUrl = Deno.env.get('FRONTEND_BASE_URL') || Deno.env.get('APP_BASE_URL') || 'http://localhost:5173'
    const reqUrl = new URL(req.url)
    const queryParams = reqUrl.searchParams
    const formParams = new URLSearchParams()

    if (req.method === 'POST') {
      const form = await req.formData()
      form.forEach((value, key) => formParams.set(key, String(value)))
    }

    const params = formParams.get('tran_id') ? formParams : queryParams
    const redirectUrl = buildRedirect(appBaseUrl, '/pos/checkout/success', params)
    return Response.redirect(redirectUrl, 302)
  } catch {
    const appBaseUrl = Deno.env.get('FRONTEND_BASE_URL') || Deno.env.get('APP_BASE_URL') || 'http://localhost:5173'
    return Response.redirect(new URL('/pos/checkout/error', appBaseUrl).toString(), 302)
  }
})
