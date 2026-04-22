import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStockTransfers, updateStockTransferStatus, type StockTransferStatus } from '../services/stockTransfers'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import { CreateTransferModal } from '../components/CreateTransferModal'

export function StockTransfers() {
  const { currentStore } = useStore()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfers', currentStore?.id],
    queryFn: () => getStockTransfers(currentStore?.id, 100, 0),
    enabled: !!currentStore
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: StockTransferStatus, notes?: string }) => 
      updateStockTransferStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['items'] }) // Invalidate stock levels globally
      setActionError(null)
    },
    onError: (err: Error) => {
      setActionError(err.message)
    }
  })

  // Role booleans
  const isManagerOrAdmin = profile?.role === 'manager' || profile?.role === 'admin'

  const handleStatusChange = (transferId: string, newStatus: StockTransferStatus, fromStoreId: string, toStoreId: string) => {
    if (!currentStore) return
    
    // Auth logic mapping
    // Can I approve a pending transfer? 
    // Usually, source store manager approves sending it (moves it to in_transit)
    // Destination store manager receives it (moves it to completed)
    // Anyone from either store can cancel it if it's pending. If in transit, maybe only admin or source can cancel.
    
    if (newStatus === 'in_transit' && currentStore.id !== fromStoreId && profile?.role !== 'admin') {
      setActionError("Only the source store or an admin can approve sending a transfer.")
      return
    }

    if (newStatus === 'completed' && currentStore.id !== toStoreId && profile?.role !== 'admin') {
      setActionError("Only the destination store or an admin can mark a transfer as received.")
      return
    }

    if (confirm(`Are you sure you want to change this transfer status to ${newStatus.toUpperCase()}?`)) {
      updateStatusMutation.mutate({ id: transferId, status: newStatus })
    }
  }

  if (!currentStore) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Please select a store to manage stock transfers.
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: StockTransferStatus) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case 'in_transit': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">In Transit</span>
      case 'completed': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
      case 'cancelled': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Stock Transfers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage incoming and outgoing inventory transfers for {currentStore.name}.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          New Transfer
        </button>
      </div>

      {actionError && (
        <div className="mb-6 p-4 bg-red-50 rounded-md border border-red-200 text-red-700">
          <strong>Error:</strong> {actionError}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading transfers...</div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No stock transfers found for this store.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {data.data.map((transfer) => {
              const direction = transfer.from_store_id === currentStore.id ? 'OUTGOING' : 'INCOMING'
              const  isExpanded = expandedTransferId === transfer.id

              return (
                <li key={transfer.id}>
                  <div className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 ${direction === 'OUTGOING' ? 'bg-orange-100 text-orange-800' : 'bg-teal-100 text-teal-800'}`}>
                            {direction}
                          </span>
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {direction === 'OUTGOING' ? 'To ' : 'From '} 
                            {direction === 'OUTGOING' ? transfer.to_store?.name : transfer.from_store?.name}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
                          {getStatusBadge(transfer.status)}
                          <button 
                            onClick={() => setExpandedTransferId(isExpanded ? null : transfer.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? 'Hide Items' : 'View Items'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Created by {transfer.created_by_user?.full_name || 'System'}
                          </p>
                          {transfer.notes && (
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Note: {transfer.notes}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {new Date(transfer.created_at).toLocaleDateString()} {new Date(transfer.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* Expanded View for Actions & Items */}
                      {isExpanded && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Items in Transfer</h4>
                          <div className="bg-white border rounded-md overflow-hidden mb-4">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {transfer.items?.map(ti => (
                                  <tr key={ti.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{ti.item?.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{ti.item?.sku}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{ti.qty}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Approval / Workflow Actions */}
                          {isManagerOrAdmin && (
                            <div className="flex gap-3 justify-end bg-gray-50 p-3 rounded border">
                              {transfer.status === 'pending' && direction === 'OUTGOING' && (
                                <>
                                  <button onClick={() => handleStatusChange(transfer.id, 'cancelled', transfer.from_store_id, transfer.to_store_id)} className="px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50">Cancel Transfer</button>
                                  <button onClick={() => handleStatusChange(transfer.id, 'in_transit', transfer.from_store_id, transfer.to_store_id)} className="px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700">Approve & Send Stock</button>
                                </>
                              )}

                              {transfer.status === 'pending' && direction === 'INCOMING' && (
                                <div className="text-xs text-blue-600 flex items-center">
                                  Waiting for {transfer.from_store?.name} to approve and send...
                                </div>
                              )}

                              {transfer.status === 'in_transit' && direction === 'INCOMING' && (
                                <button onClick={() => handleStatusChange(transfer.id, 'completed', transfer.from_store_id, transfer.to_store_id)} className="px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700">Receive Stock</button>
                              )}

                              {transfer.status === 'in_transit' && direction === 'OUTGOING' && (
                                <div className="text-xs text-blue-600 flex items-center">
                                  Waiting for {transfer.to_store?.name} to receive...
                                </div>
                              )}
                              
                              {/* Admins can force-cancel in-transit items if needed */}
                              {transfer.status === 'in_transit' && profile?.role === 'admin' && (
                                <button onClick={() => handleStatusChange(transfer.id, 'cancelled', transfer.from_store_id, transfer.to_store_id)} className="px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-red-600 bg-white hover:bg-gray-50 ml-2">Force Cancel (Admin)</button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showCreateModal && (
        <CreateTransferModal
          currentStoreId={currentStore.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
          }}
        />
      )}
    </div>
  )
}
