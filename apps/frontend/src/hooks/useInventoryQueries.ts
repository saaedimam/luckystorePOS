import { useQuery } from '@tanstack/react-query'
import { getCategories, getItems, getItemsPage } from '../services/items'
import { trackMetric } from '../services/metrics'

export const inventoryQueryKeys = {
  itemsRoot: ['items'] as const,
  itemsPage: (params: {
    searchTerm: string
    selectedCategory: string
    activeFilter: boolean | undefined
    currentStoreId: string | undefined
    page: number
    pageSize: number
  }) => ['items', 'page', params] as const,
  categories: ['categories'] as const,
  posItemsRoot: ['pos-items'] as const,
  posItems: (currentStoreId: string | undefined) => ['pos-items', currentStoreId ?? 'all'] as const,
}

type ItemsPageParams = {
  searchTerm: string
  selectedCategory: string
  activeFilter: boolean | undefined
  currentStoreId: string | undefined
  page: number
  pageSize: number
}

export function useItemsPageQuery(params: ItemsPageParams) {
  const { searchTerm, selectedCategory, activeFilter, currentStoreId, page, pageSize } = params
  return useQuery({
    queryKey: inventoryQueryKeys.itemsPage(params),
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const startedAt = performance.now()
      try {
        const filters: {
          search?: string
          categoryId?: string
          active?: boolean
          storeId?: string
        } = {}
        if (searchTerm) filters.search = searchTerm
        if (selectedCategory) filters.categoryId = selectedCategory
        if (activeFilter !== undefined) filters.active = activeFilter
        if (currentStoreId) filters.storeId = currentStoreId

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
        })

        const dataPromise = getItemsPage(filters, page, pageSize)
        const data = await Promise.race([dataPromise, timeoutPromise])
        trackMetric('items.list.load', performance.now() - startedAt, {
          page,
          pageSize,
          total: data.total,
          silent: false,
        })
        return data
      } catch (err) {
        const message = err instanceof Error
          ? err.message
          : 'Failed to load items from Supabase. Please check your connection.'
        trackMetric('items.list.load.error', performance.now() - startedAt, {
          page,
          pageSize,
          message,
        })
        throw err
      }
    },
  })
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: inventoryQueryKeys.categories,
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
}

export function usePosItemsQuery(currentStoreId: string | undefined) {
  return useQuery({
    queryKey: inventoryQueryKeys.posItems(currentStoreId),
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const data = await getItems({
        active: true,
        storeId: currentStoreId
      })
      return data || []
    }
  })
}

