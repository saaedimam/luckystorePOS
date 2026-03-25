import { db, type OfflineSale } from './db'
import { invokeEdgeFunction } from './edgeFunctions'

export async function addToQueue(saleData: Omit<OfflineSale, 'id' | 'created_at' | 'synced'>) {
    try {
        const id = await db.offlineSales.add({
            ...saleData,
            created_at: Date.now(),
            synced: false,
        })
        console.log('✅ Sale saved offline with ID:', id)
        return id
    } catch (error) {
        console.error('❌ Failed to save sale offline:', error)
        throw error
    }
}

export async function getPendingSalesCount() {
    return await db.offlineSales.where('synced').equals(0).count()
}

export async function processQueue() {
    const pendingSales = await db.offlineSales.where('synced').equals(0).toArray()

    if (pendingSales.length === 0) {
        return { processed: 0, errors: 0 }
    }

    console.log(`🔄 Processing ${pendingSales.length} offline sales...`)
    let processed = 0
    let errors = 0

    for (const sale of pendingSales) {
        try {
            // Transform offline sale data to match Edge Function body
            const body = {
                store_id: sale.store_id,
                items: sale.items.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                discount: sale.discount,
                payment_method: sale.payment_method,
                payment_meta: sale.payment_meta
            }

            await invokeEdgeFunction<{ success: boolean }>(
                'create-sale',
                body,
                'Offline sale sync failed',
            )

            // Mark as synced or delete
            await db.offlineSales.update(sale.id!, { synced: true })
            // Optional: Delete after sync to keep DB small
            await db.offlineSales.delete(sale.id!)

            processed++
        } catch (err) {
            console.error(`❌ Failed to sync sale ${sale.id}:`, err)
            errors++
        }
    }

    console.log(`✅ Queue processed: ${processed} synced, ${errors} failed`)
    return { processed, errors }
}
