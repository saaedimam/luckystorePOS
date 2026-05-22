import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(req: Request) {
  try {
    const { product_id } = await req.json();

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const db = createClient();

    // Fetch from products table with stock data
    const { data: product, error: productError } = await db
      .from('products')
      .select('id, stock_qty, reserved_online')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const stock_qty = product.stock_qty || 0;
    const reserved_online = product.reserved_online || 0;
    const sellable = stock_qty - reserved_online;

    return NextResponse.json({
      available: stock_qty,
      reserved_online: reserved_online,
      sellable: sellable
    });
  } catch (err) {
    logger.error('[/api/stock-check POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
