import { supabase } from './supabase'

export type Item = {
  id: string
  sku: string | null
  barcode: string | null
  name: string
  category_id: string | null
  description: string | null
  cost: number
  price: number
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
  }
}

export type ItemWithStock = Item & {
  stock_levels?: { qty: number; store_id?: string }[]
}

export type Category = {
  id: string
  name: string
}

export type ItemFormData = {
  sku?: string
  barcode?: string
  name: string
  category_id?: string
  description?: string
  cost: number
  price: number
  image_url?: string
  active: boolean
}

import { db, type CachedItem } from './db'

export type ItemFilters = {
  search?: string
  categoryId?: string
  active?: boolean
  storeId?: string
}

export type ItemPageResult = {
  items: ItemWithStock[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Items CRUD
export async function getItems(filters?: {
  search?: string
  categoryId?: string
  active?: boolean
  storeId?: string
}) {
  try {
    // Try to fetch from network first
    if (navigator.onLine) {
      let selectQuery = `
        *,
        category:categories(id, name)
      `

      if (filters?.storeId) {
        selectQuery += `, stock_levels(qty, store_id)`
      }

      let query = supabase
        .from('items')
        .select(selectQuery)
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        )
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      // Do not filter parent items by stock relation here; we want to show full catalog
      // and render per-store stock as 0 when no stock row exists for selected store.

      const { data, error } = await query

      if (error) throw error

      // Cache items if we are fetching all active items (no specific search/category)
      // This is a simple caching strategy; for production, might want more robust logic
      if (!filters?.search && !filters?.categoryId && filters?.active === true) {
        syncItemsToCache((data || []) as unknown as ItemWithStock[])
      }

      return (data || []) as unknown as ItemWithStock[]
    } else {
      // Offline: Fetch from Dexie
      console.log('📴 Offline: Fetching items from cache')

      let items = await db.itemsCache.toArray()

      // Apply filters in memory for offline
      if (filters?.active !== undefined) {
        items = items.filter(i => i.active === filters.active)
      }

      if (filters?.categoryId) {
        items = items.filter(i => i.category_id === filters.categoryId)
      }

      if (filters?.search) {
        const lowerSearch = filters.search.toLowerCase()
        items = items.filter(i =>
          i.name.toLowerCase().includes(lowerSearch) ||
          (i.barcode && i.barcode.includes(lowerSearch)) ||
          (i.sku && i.sku?.toLowerCase().includes(lowerSearch))
        )
      }

      return items
    }
  } catch (error) {
    console.error('❌ Failed to load items:', error)
    // Fallback to cache on error even if online
    try {
      console.log('⚠️ Network error, falling back to cache')
      return await db.itemsCache.toArray()
    } catch (cacheError) {
      console.error('❌ Failed to load from cache:', cacheError)
      throw error
    }
  }
}

export async function getItemsPage(
  filters: ItemFilters = {},
  page = 1,
  pageSize = 200
): Promise<ItemPageResult> {
  const safePage = Math.max(1, Math.floor(page))
  const safePageSize = Math.min(300, Math.max(10, Math.floor(pageSize)))
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1

  try {
    if (navigator.onLine) {
      let selectQuery = `
        *,
        category:categories(id, name)
      `
      if (filters.storeId) {
        selectQuery += `, stock_levels(qty, store_id)`
      }

      let query = supabase
        .from('items')
        .select(selectQuery, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      const normalizedSearch = filters.search?.trim()
      if (normalizedSearch) {
        const isLikelyCode = /^[A-Za-z0-9\-_]{5,}$/.test(normalizedSearch)
        query = isLikelyCode
          ? query.or(
            `barcode.eq.${normalizedSearch},sku.eq.${normalizedSearch},name.ilike.%${normalizedSearch}%`
          )
          : query.or(
            `name.ilike.%${normalizedSearch}%,barcode.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%`
          )
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      const { data, count, error } = await query
      if (error) throw error

      const items = (data || []) as unknown as ItemWithStock[]
      const total = count ?? items.length
      return {
        items,
        total,
        page: safePage,
        pageSize: safePageSize,
        hasMore: from + items.length < total,
      }
    }

    // Offline fallback: use cache and paginate in-memory.
    let items = await db.itemsCache.toArray()
    if (filters.active !== undefined) items = items.filter((i) => i.active === filters.active)
    if (filters.categoryId) items = items.filter((i) => i.category_id === filters.categoryId)
    if (filters.search) {
      const lower = filters.search.toLowerCase()
      items = items.filter((i) =>
        i.name.toLowerCase().includes(lower) ||
        (i.barcode && i.barcode.includes(lower)) ||
        (i.sku && i.sku.toLowerCase().includes(lower))
      )
    }

    const paged = items.slice(from, from + safePageSize) as unknown as ItemWithStock[]
    return {
      items: paged,
      total: items.length,
      page: safePage,
      pageSize: safePageSize,
      hasMore: from + paged.length < items.length,
    }
  } catch (error) {
    console.error('❌ Failed to load paged items:', error)
    throw error
  }
}

export async function syncItemsToCache(items: ItemWithStock[]) {
  try {
    // Map to CachedItem structure
    const cachedItems: CachedItem[] = items.map(item => ({
      id: item.id,
      barcode: item.barcode,
      sku: item.sku,
      name: item.name,
      price: item.price,
      cost: item.cost,
      category_id: item.category_id,
      image_url: item.image_url,
      active: item.active,
      stock_levels: item.stock_levels, // Cache stock levels too!
      updated_at: new Date().toISOString()
    }))

    await db.itemsCache.bulkPut(cachedItems)
    console.log(`💾 Cached ${cachedItems.length} items`)
  } catch (error) {
    console.error('❌ Failed to cache items:', error)
  }
}

export async function getItem(id: string) {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Item
}

export async function createItem(item: ItemFormData) {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select(`
      *,
      category:categories(id, name)
    `)
    .single()

  if (error) throw error
  return data as Item
}

export async function updateItem(id: string, item: Partial<ItemFormData>) {
  const { data, error } = await supabase
    .from('items')
    .update(item)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name)
    `)
    .single()

  if (error) throw error
  return data as Item
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}

export async function clearStoreStock(storeId: string) {
  const { error } = await supabase.from('stock_levels').delete().eq('store_id', storeId)
  if (error) throw error
}

export async function checkBarcodeUnique(barcode: string, excludeId?: string) {
  let query = supabase.from('items').select('id').eq('barcode', barcode)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error
  return data.length === 0
}

export async function checkSkuUnique(sku: string, excludeId?: string) {
  let query = supabase.from('items').select('id').eq('sku', sku)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error
  return data.length === 0
}

// Categories CRUD
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Category[]
}

export async function createCategory(name: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, name: string) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// Image upload
export async function uploadItemImage(file: File, itemName: string): Promise<string> {
  const bucket = 'item-images'
  const ext = file.name.split('.').pop() || 'jpg'
  const sanitizedName = itemName
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .substring(0, 50)
  const fileName = `${sanitizedName}-${Date.now()}.${ext}`
  const filePath = `items/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type || `image/${ext}`,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return publicUrl
}

