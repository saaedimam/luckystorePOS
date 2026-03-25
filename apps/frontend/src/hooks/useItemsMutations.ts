import { useQueryClient } from '@tanstack/react-query'
import { inventoryQueryKeys } from './useInventoryQueries'
import { clearStoreStock, createItem, deleteItem, type Item, type ItemFormData, updateItem } from '../services/items'

type UseItemsMutationsArgs = {
  setError: (message: string | null) => void
  setSuccess: (message: string | null) => void
  setShowForm: (show: boolean) => void
  setEditingItem: (item: Item | null) => void
  setClearingStock: (value: boolean) => void
}

export function useItemsMutations({
  setError,
  setSuccess,
  setShowForm,
  setEditingItem,
  setClearingStock,
}: UseItemsMutationsArgs) {
  const queryClient = useQueryClient()

  const refreshItems = async () => {
    setError(null)
    setSuccess(null)
    await queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.itemsRoot })
  }

  const handleSave = async (data: ItemFormData, editingItem: Item | null) => {
    if (editingItem) {
      await updateItem(editingItem.id, data)
    } else {
      await createItem(data)
    }
    setShowForm(false)
    setEditingItem(null)
    await refreshItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteItem(id)
      await refreshItems()
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to delete item'
      setError(errorMessage)
    }
  }

  const handleClearStoreStock = async (currentStore: { id: string; code: string; name: string } | null) => {
    if (!currentStore) {
      setError('Please select a store first')
      return
    }

    const confirmed = confirm(
      `Clear all stock levels for ${currentStore.code} (${currentStore.name})? This only affects current quantities for this store.`
    )
    if (!confirmed) return

    try {
      setClearingStock(true)
      setError(null)
      setSuccess(null)
      await clearStoreStock(currentStore.id)
      setSuccess(`Stock cleared for ${currentStore.code}`)
      await refreshItems()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear store stock'
      setError(errorMessage)
    } finally {
      setClearingStock(false)
    }
  }

  return {
    refreshItems,
    handleSave,
    handleDelete,
    handleClearStoreStock,
  }
}

