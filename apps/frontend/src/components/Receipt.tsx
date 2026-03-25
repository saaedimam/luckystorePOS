import { useEffect } from 'react'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface ReceiptProps {
  receiptNumber: string
  date: Date
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  cashPaid: number
  change: number
  onClose: () => void
}

export function Receipt({
  receiptNumber,
  date,
  items,
  subtotal,
  discount,
  total,
  cashPaid,
  change,
  onClose
}: ReceiptProps) {
  useEffect(() => {
    // Auto-print on mount
    const timer = setTimeout(() => {
      window.print()
      // Close after print dialog
      setTimeout(onClose, 1000)
    }, 100)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:relative print:bg-white">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 print:shadow-none print:max-w-full">
        <div className="p-8 print:p-4">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">LUCKY STORE</h1>
            <p className="text-sm text-gray-600 mt-1">Thank you for shopping with us</p>
            <p className="text-xs text-gray-500 mt-2">Receipt #{receiptNumber}</p>
            <p className="text-xs text-gray-500">{date.toLocaleString()}</p>
          </div>

          {/* Items */}
          <div className="mb-4">
            {items.map((item, index) => (
              <div key={index} className="mb-3 border-b border-dotted border-gray-200 pb-2">
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>{item.name}</span>
                  <span>৳{item.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Qty: {item.quantity} × ৳{item.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-900 pt-3 mb-4">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Subtotal:</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Discount:</span>
              <span>৳{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 mb-3">
              <span>Total:</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Cash Paid:</span>
              <span>৳{cashPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Change:</span>
              <span>৳{change.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-gray-300 pt-4 text-center">
            <p className="text-sm text-gray-600">Thank you for your purchase!</p>
            <p className="text-xs text-gray-500 mt-2">Please come again</p>
          </div>

          {/* Close button (hidden when printing) */}
          <div className="mt-6 print:hidden">
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

