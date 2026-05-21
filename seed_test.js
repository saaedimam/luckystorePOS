const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD || 'qejwux-peQjyc-7hyxpi';
  const client = new Client({
    connectionString: 'postgresql://postgres.hvmyxyccfnkrbxqbhlnm:' + password + '@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('--- Seeding ---');
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const storeId = '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd';
  
  const query = {
    text: 'INSERT INTO public.delivery_zones (tenant_id, store_id, store_lat, store_lng, radius_km, delivery_fee) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id) DO UPDATE SET store_lat = EXCLUDED.store_lat, store_lng = EXCLUDED.store_lng, radius_km = EXCLUDED.radius_km, delivery_fee = EXCLUDED.delivery_fee',
    values: [tenantId, storeId, 22.3569, 91.7832, 5.0, 40]
  };

  try {
    await client.query(query);
    console.log('Seed success');
  } catch (e) {
    console.error('Seed failed:', e);
  }

  await client.end();
}
run();
