export const CARD_CHECKOUT_SESSION_KEY = 'lucky-pos-card-checkout'

export interface PendingCardCheckoutItem {
  item_id: string
  quantity: number
  price: number
  name: string
}

export interface PendingCardCheckout {
  store_id: string
  items: PendingCardCheckoutItem[]
  discount: number
  subtotal: number
  total: number
  created_at: number
}

export function savePendingCardCheckout(data: PendingCardCheckout) {
  sessionStorage.setItem(CARD_CHECKOUT_SESSION_KEY, JSON.stringify(data))
}

export function getPendingCardCheckout(): PendingCardCheckout | null {
  const raw = sessionStorage.getItem(CARD_CHECKOUT_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingCardCheckout
  } catch {
    return null
  }
}

export function clearPendingCardCheckout() {
  sessionStorage.removeItem(CARD_CHECKOUT_SESSION_KEY)
}
