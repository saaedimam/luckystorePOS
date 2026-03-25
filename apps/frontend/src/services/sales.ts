export type SaleItemInput = {
  item_id: string
  qty: number
  price: number
  cost?: number
  batch_id?: string | null
}

export type CreateSalePayload = {
  store_id: string
  cashier_id: string
  subtotal: number
  discount: number
  total: number
  payment_method: string
  payment_meta?: Record<string, unknown>
  tendered?: number
  items: SaleItemInput[]
}

export type CreateSaleResponse = {
  sale_id: string
  receipt_number: string
  created_at: string
  store: {
    id: string
    code: string
    name: string
  }
  totals: {
    subtotal: number
    discount: number
    total: number
    tendered: number | null
    change_due: number | null
  }
  items: Array<{
    item_id: string
    name: string
    qty: number
    price: number
    line_total: number
  }>
}

const getCreateSaleUrl = () =>
  import.meta.env.VITE_CREATE_SALE_EDGE_URL ||
  import.meta.env.VITE_PROCESS_SALE_EDGE_URL ||
  ''

export async function createSale(
  payload: CreateSalePayload,
  accessToken: string
): Promise<CreateSaleResponse> {
  const endpoint = getCreateSaleUrl()
  if (!endpoint) {
    throw new Error('Missing VITE_CREATE_SALE_EDGE_URL or VITE_PROCESS_SALE_EDGE_URL')
  }
  if (!accessToken) {
    throw new Error('Missing Supabase access token')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error || 'Failed to create sale'
    throw new Error(message)
  }

  return data as CreateSaleResponse
}


