import { supabase } from './supabase'

export type PosSaleItemInput = {
  itemId: string
  name: string
  qty: number
  price: number
}

export type PosPaymentInput = {
  method: string
  tendered: number
  change: number
  notes?: string
}

export type CreateSalePayload = {
  storeId: string
  cashierId: string
  items: PosSaleItemInput[]
  discount: number
  subtotal: number
  total: number
  payment: PosPaymentInput
  clientReference?: string
}

export type SaleSummary = {
  id: string
  storeId: string
  receiptNumber: string
  subtotal: number
  discount: number
  total: number
  change: number
  createdAt: string
  payment: PosPaymentInput
  items: Array<{
    itemId: string
    name: string
    qty: number
    price: number
    lineTotal: number
  }>
}

export async function createSale(payload: CreateSalePayload): Promise<SaleSummary> {
  const serverPayload = {
    store_id: payload.storeId,
    cashier_id: payload.cashierId,
    items: payload.items.map((item) => ({
      item_id: item.itemId,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    discount: payload.discount,
    totals: {
      subtotal: payload.subtotal,
      total: payload.total,
    },
    payment: payload.payment,
    client_reference: payload.clientReference ?? null,
  }

  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    sale?: SaleSummary
    error?: string
    code?: string
  }>('create-sale', {
    body: serverPayload,
  })

  if (error) {
    throw new Error(error.message || 'Checkout failed')
  }

  if (!data?.success || !data.sale) {
    throw new Error(data?.error || 'Checkout failed')
  }

  return data.sale
}


