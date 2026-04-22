export type CheckoutStatus = 'success' | 'fail' | 'cancelled' | 'error'

export interface CheckoutOutcome {
  status: CheckoutStatus
  tranId?: string | null
  receiptNumber?: string | null
  error?: string | null
}

export function mapPathToCheckoutStatus(pathname: string): CheckoutStatus {
  if (pathname.endsWith('/success')) return 'success'
  if (pathname.endsWith('/fail')) return 'fail'
  if (pathname.endsWith('/cancelled')) return 'cancelled'
  return 'error'
}

export function buildCheckoutOutcomeRoute(outcome: CheckoutOutcome): string {
  const params = new URLSearchParams()
  if (outcome.tranId) params.set('tran_id', outcome.tranId)
  if (outcome.receiptNumber) params.set('receipt', outcome.receiptNumber)
  if (outcome.error) params.set('error', outcome.error)

  const query = params.toString()
  return query ? `/pos/checkout/${outcome.status}?${query}` : `/pos/checkout/${outcome.status}`
}
