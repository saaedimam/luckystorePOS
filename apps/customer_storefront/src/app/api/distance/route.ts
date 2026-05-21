import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Haversine formula — returns distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lng, store_id } = body as { lat: number; lng: number; store_id?: string };

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng are required numbers' }, { status: 400 });
    }

    const db = createServerClient();

    // Fetch the active delivery zone (first active zone if no store_id given)
    let query = db
      .from('delivery_zones')
      .select('store_lat, store_lng, radius_km, delivery_fee')
      .eq('is_active', true);

    if (store_id) query = query.eq('store_id', store_id);

    const { data: zones, error } = await query.limit(1);

    if (error || !zones || zones.length === 0) {
      // Fallback: assume Dhaka city centre if no zone is configured yet
      const fallbackLat = 23.8103;
      const fallbackLng = 90.4125;
      const distance_km = haversineKm(lat, lng, fallbackLat, fallbackLng);
      const is_within_zone = distance_km <= 5;
      return NextResponse.json({
        distance_km: Math.round(distance_km * 100) / 100,
        is_within_zone,
        delivery_fee: is_within_zone ? 40 : null,
        note: 'Using fallback store location — configure delivery_zones in Supabase.',
      });
    }

    const zone = zones[0];
    const distance_km = haversineKm(lat, lng, Number(zone.store_lat), Number(zone.store_lng));
    const is_within_zone = distance_km <= Number(zone.radius_km);

    return NextResponse.json({
      distance_km: Math.round(distance_km * 100) / 100,
      is_within_zone,
      delivery_fee: is_within_zone ? Number(zone.delivery_fee) : null,
    });
  } catch (err) {
    logger.error('[/api/distance]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
