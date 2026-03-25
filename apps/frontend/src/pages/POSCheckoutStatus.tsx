import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { mapPathToCheckoutStatus, type CheckoutStatus } from '../services/checkoutOutcome'
import { invokeEdgeFunction } from '../services/edgeFunctions'
import { clearPendingCardCheckout, getPendingCardCheckout } from '../services/checkoutSession'

const statusContent: Record<
  CheckoutStatus,
  {
    title: string
    description: string
    panelClass: string
    titleClass: string
  }
> = {
  success: {
    title: 'Payment Successful',
    description: 'The payment was completed and your transaction has been recorded.',
    panelClass: 'border-green-200 bg-green-50',
    titleClass: 'text-green-700',
  },
  fail: {
    title: 'Payment Failed',
    description: 'The payment could not be completed. Please try again.',
    panelClass: 'border-red-200 bg-red-50',
    titleClass: 'text-red-700',
  },
  cancelled: {
    title: 'Payment Cancelled',
    description: 'The checkout was cancelled before payment completion.',
    panelClass: 'border-amber-200 bg-amber-50',
    titleClass: 'text-amber-700',
  },
  error: {
    title: 'Checkout Error',
    description: 'Something went wrong while processing checkout.',
    panelClass: 'border-gray-300 bg-gray-50',
    titleClass: 'text-gray-800',
  },
}

export function POSCheckoutStatus() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const status = mapPathToCheckoutStatus(location.pathname)
  const content = statusContent[status]
  const tranId = searchParams.get('tran_id')
  const queryReceiptNumber = searchParams.get('receipt')
  const errorText = searchParams.get('error')
  const [receiptNumber, setReceiptNumber] = useState<string | null>(queryReceiptNumber)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const finalizeCardSale = async () => {
      if (status !== 'success') {
        if (status === 'fail' || status === 'cancelled' || status === 'error') {
          clearPendingCardCheckout()
        }
        return
      }

      if (queryReceiptNumber) return

      const pending = getPendingCardCheckout()
      if (!pending) {
        setFinalizeError('No pending checkout session was found. Please verify payment status.')
        return
      }

      setIsFinalizing(true)
      setFinalizeError(null)

      try {
        const data = await invokeEdgeFunction<{ receipt_number?: string }>(
          'create-sale',
          {
            store_id: pending.store_id,
            items: pending.items.map((item) => ({
              item_id: item.item_id,
              quantity: item.quantity,
              price: item.price,
            })),
            discount: pending.discount,
            payment_method: 'card',
            payment_meta: {
              gateway: 'sslcommerz',
              tran_id: tranId,
              status: 'completed',
            },
          },
          'Failed to finalize sale after payment success',
        )

        if (!cancelled) {
          const nextReceipt = data?.receipt_number ?? null
          setReceiptNumber(nextReceipt)
          clearPendingCardCheckout()
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to finalize sale after payment success'
        if (!cancelled) {
          setFinalizeError(message)
        }
      } finally {
        if (!cancelled) {
          setIsFinalizing(false)
        }
      }
    }

    void finalizeCardSale()
    return () => {
      cancelled = true
    }
  }, [queryReceiptNumber, status, tranId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className={`w-full max-w-lg rounded-lg border p-8 shadow-sm ${content.panelClass}`}>
        <h1 className={`text-3xl font-black tracking-tight mb-3 ${content.titleClass}`}>{content.title}</h1>
        <p className="text-sm text-gray-700 mb-6">{content.description}</p>

        {tranId && (
          <div className="mb-3 rounded-md bg-white border border-gray-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Transaction ID</p>
            <p className="font-mono text-sm font-semibold text-gray-900 mt-1">{tranId}</p>
          </div>
        )}

        {receiptNumber && (
          <div className="mb-3 rounded-md bg-white border border-gray-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Receipt Number</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{receiptNumber}</p>
          </div>
        )}

        {errorText && (
          <div className="mb-4 rounded-md bg-white border border-red-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-red-500">Error</p>
            <p className="text-sm text-red-700 mt-1">{errorText}</p>
          </div>
        )}

        {isFinalizing && (
          <div className="mb-4 rounded-md bg-white border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-700">Finalizing sale...</p>
          </div>
        )}

        {finalizeError && (
          <div className="mb-4 rounded-md bg-white border border-red-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-red-500">Finalize Error</p>
            <p className="text-sm text-red-700 mt-1">{finalizeError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/pos"
            className="flex-1 text-center bg-black text-white py-3 rounded-md text-sm font-semibold hover:bg-gray-900 transition"
          >
            Back to POS
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 text-center bg-white border border-gray-300 text-gray-800 py-3 rounded-md text-sm font-semibold hover:bg-gray-100 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
