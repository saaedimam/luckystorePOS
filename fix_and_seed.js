const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD || 'qejwux-peQjyc-7hyxpi';
  const client = new Client({
    connectionString: 'postgresql://postgres.hvmyxyccfnkrbxqbhlnm:' + password + '@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('--- Fixing delivery_zones table ---');
  await client.query('DROP TABLE IF EXISTS public.delivery_zones CASCADE');
  await client.query(`
    CREATE TABLE public.delivery_zones (
      id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    UUID          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      store_id     UUID          REFERENCES public.stores(id) ON DELETE CASCADE,
      store_lat    DECIMAL(10,8) NOT NULL,
      store_lng    DECIMAL(11,8) NOT NULL,
      radius_km    DECIMAL(5,2)  NOT NULL DEFAULT 5.0,
      delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 40,
      is_active    BOOLEAN       NOT NULL DEFAULT true,
      UNIQUE(tenant_id)
    );
  `);
  await client.query('ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;');
  await client.query('CREATE POLICY public_delivery_zones_read ON public.delivery_zones FOR SELECT TO anon USING (is_active = true);');
  await client.query('GRANT SELECT ON public.delivery_zones TO anon;');

  console.log('--- Applying Stock Reservation Trigger ---');
  const triggerSql = fs.readFileSync('supabase/migrations/20260525000000_stock_reservation_trigger.sql', 'utf8');
  await client.query(triggerSql);

  console.log('--- Seeding ---');
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const storeId = '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd';
  
  await client.query({
    text: 'INSERT INTO public.delivery_zones (tenant_id, store_id, store_lat, store_lng, radius_km, delivery_fee) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id) DO UPDATE SET store_lat = EXCLUDED.store_lat, store_lng = EXCLUDED.store_lng, radius_km = EXCLUDED.radius_km, delivery_fee = EXCLUDED.delivery_fee',
    values: [tenantId, storeId, 22.3569, 91.7832, 5.0, 40]
  });

  console.log('--- Updating store location ---');
  await client.query({
    text: 'UPDATE public.stores SET location = ST_SetSRID(ST_MakePoint(91.7832, 22.3569), 4326)::geography WHERE id = $1',
    values: [storeId]
  });

  await client.end();
  console.log('--- Success ---');
}
run().catch(console.error);
