import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { product_id, store_id } = await req.json();

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const db = createServerClient();

    // Fetch from products table (central stock)
    const { data: product, error: productError } = await db
      .from('products')
      .select('stock_qty, reserved_online')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Optionally check stock_levels if store_id is provided
    let store_available = null;
    if (store_id) {
      const { data: level } = await db
        .from('stock_levels')
        .select('qty, qty_reserved_online')
        .eq('item_id', product_id)
        .eq('store_id', store_id)
        .single();
      
      if (level) {
        store_available = {
          qty: level.qty,
          reserved: level.qty_reserved_online || 0,
          sellable: level.qty - (level.qty_reserved_online || 0)
        };
      }
    }

    return NextResponse.json({
      available: product.stock_qty,
      reserved_online: product.reserved_online || 0,
      sellable: product.stock_qty - (product.reserved_online || 0),
      store_specific: store_available
    });
  } catch (err) {
    logger.error('[/api/stock-check POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
