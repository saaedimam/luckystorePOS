import Dexie, { type Table } from 'dexie'

export interface OfflineSale {
    id?: number
    store_id: string
    items: {
        item_id: string
        quantity: number
        price: number
        name: string // Store name for display in offline queue
    }[]
    discount: number
    payment_method: string
    payment_meta: Record<string, unknown>
    created_at: number
    synced: boolean
}

export interface OfflineStockUpdate {
    id?: number
    item_id: string
    store_id: string
    quantity_change: number // Negative for sales
    created_at: number
}

export interface CachedItem {
    id: string
    barcode: string | null
    sku: string | null
    name: string
    price: number
    cost: number
    category_id: string | null
    image_url: string | null
    active: boolean
    stock_levels?: { qty: number; store_id?: string }[]
    updated_at: string
}

export class LuckyPOSDatabase extends Dexie {
    offlineSales!: Table<OfflineSale>
    offlineStockUpdates!: Table<OfflineStockUpdate>
    itemsCache!: Table<CachedItem>

    constructor() {
        super('LuckyPOSDatabase')
        this.version(1).stores({
            offlineSales: '++id, store_id, created_at, synced',
            offlineStockUpdates: '++id, item_id, store_id, created_at',
            itemsCache: 'id, barcode, name, category_id', // Indexes for search
        })
    }
}

export const db = new LuckyPOSDatabase()
