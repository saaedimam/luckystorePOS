import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-static';
export const revalidate = false;

// Haversine (duplicated here to keep route self-contained — no shared dep needed)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderRequestBody {
  items: OrderItem[];
  customer: {
    name: string;
    whatsapp: string;
    address: string;
  };
  lat?: number;
  lng?: number;
  store_id?: string;
}

export async function POST(req: Request) {
  try {
    const body: OrderRequestBody = await req.json();
    const { items, customer, lat, lng, store_id } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    if (!customer?.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!customer?.whatsapp?.trim()) return NextResponse.json({ error: 'WhatsApp is required' }, { status: 400 });
    if (!customer?.address?.trim()) return NextResponse.json({ error: 'Address is required' }, { status: 400 });

    // Basic WhatsApp / phone format check
    const phone = customer.whatsapp.replace(/\s/g, '');
    if (!/^\+?880\d{10}$/.test(phone) && !/^01\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'WhatsApp number must be a valid Bangladeshi number (e.g. 01712345678 or +8801712345678)' },
        { status: 400 }
      );
    }

    const db = createClient();

    // ── Delivery zone + distance check ────────────────────────────────────────
    let deliveryFee = 40;
    let tenantId: string | null = null;

    {
      let zoneQuery = db
        .from('delivery_zones')
        .select('tenant_id, store_lat, store_lng, radius_km, delivery_fee')
        .eq('is_active', true);
      if (store_id) zoneQuery = zoneQuery.eq('store_id', store_id);
      const { data: zones } = await zoneQuery.limit(1);

      if (zones && zones.length > 0) {
        const zone = zones[0];
        tenantId = zone.tenant_id;
        deliveryFee = Number(zone.delivery_fee);

        if (lat !== undefined && lng !== undefined) {
          const dist = haversineKm(lat, lng, Number(zone.store_lat), Number(zone.store_lng));
          if (dist > Number(zone.radius_km)) {
            return NextResponse.json(
              { error: `Delivery not available — you are ${dist.toFixed(1)} km away (limit ${zone.radius_km} km)` },
              { status: 422 }
            );
          }
        }
      }
    }

    // ── Resolve tenant_id if still unknown ───────────────────────────────────
    if (!tenantId && store_id) {
      const { data: store } = await db
        .from('stores')
        .select('tenant_id')
        .eq('id', store_id)
        .single();
      tenantId = store?.tenant_id ?? null;
    }

    if (!tenantId) {
      // Last resort: grab first tenant (single-tenant MVP)
      const { data: firstStore } = await db
        .from('stores')
        .select('id, tenant_id')
        .limit(1)
        .single();
      tenantId = firstStore?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Store not configured — contact support' }, { status: 503 });
    }

    // ── Calculate totals ──────────────────────────────────────────────────────
    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const total = subtotal + deliveryFee;

    // ── Place order via RPC (handles order number + stock reservation) ─────────
    const { data: rpcResult, error: rpcError } = await db.rpc('place_online_order', {
      p_store_id: store_id ?? (await db.from('stores').select('id').limit(1).single()).data?.id,
      p_customer_name: customer.name.trim(),
      p_whatsapp: phone,
      p_address: customer.address.trim(),
      p_items: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: Math.round(i.unit_price * 100), // RPC stores in paisa
      })),
      p_subtotal: Math.round(subtotal * 100),
      p_delivery_fee: Math.round(deliveryFee * 100),
      p_total: Math.round(total * 100),
    });

    if (rpcError) {
      // RPC may not exist in all envs — fall back to direct insert
      console.warn('[order] RPC failed, using direct insert:', rpcError.message);

      // Generate order number manually (matches trigger logic)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const seq = Math.floor(Math.random() * 900) + 100;
      const order_number = `LSO-${today}-${String(seq).padStart(3, '0')}`;

      const { data: order, error: insertError } = await db
        .from('online_orders')
        .insert({
          tenant_id: tenantId,
          order_number,
          customer_name: customer.name.trim(),
          customer_whatsapp: phone,
          customer_address: customer.address.trim(),
          customer_lat: lat ?? null,
          customer_lng: lng ?? null,
          subtotal,
          delivery_fee: deliveryFee,
          discount: 0,
          total,
          status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending',
        })
        .select('id, order_number')
        .single();

      if (insertError || !order) {
        logger.error('[order] Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
      }

      // Insert items
      const { error: itemsError } = await db.from('online_order_items').insert(
        items.map(i => ({
          order_id: order.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.unit_price * i.quantity,
        }))
      );

      if (itemsError) {
        logger.error('[order] Items insert error:', itemsError);
        // Order created but items failed — still return order number
      }

      return NextResponse.json({
        orderNumber: order.order_number,
        total,
        estimatedTime: '30–45 min',
      });
    }

    // RPC succeeded
    return NextResponse.json({
      orderNumber: rpcResult.order_number,
      total,
      estimatedTime: '30–45 min',
    });
  } catch (err) {
    logger.error('[/api/order POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('orderNumber');

  if (!orderNumber) {
    return NextResponse.json({ error: 'orderNumber query param required' }, { status: 400 });
  }

  const db = createClient();
  const { data: order, error } = await db
    .from('online_orders')
    .select(`
      id, order_number, status, customer_name, customer_whatsapp, customer_address,
      subtotal, delivery_fee, discount, total, payment_method, payment_status,
      created_at, updated_at,
      online_order_items (
        id, quantity, unit_price, total_price,
        products ( name_en, name_bn, image_url )
      )
    `)
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order);
}
