const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.hvmyxyccfnkrbxqbhlnm:RJbgX9JwcVNFv0q9@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  console.log("Applying core POS schema...");
  const sql1 = fs.readFileSync('supabase/migrations/20260521000000_core_pos_schema.sql', 'utf8');
  await client.query(sql1);
  
  console.log("Applying complete sale RPC...");
  const sql2 = fs.readFileSync('supabase/migrations/20260521000001_complete_sale_rpc_v2.sql', 'utf8');
  await client.query(sql2);

  console.log("Applying safe online orders schema...");
  const sql3 = fs.readFileSync('supabase/migrations/20260521000003_safe_online_orders.sql', 'utf8');
  await client.query(sql3);

  console.log("Applying storefront RLS...");
  const sql4 = fs.readFileSync('supabase/migrations/20260522000000_storefront_rls.sql', 'utf8');
  await client.query(sql4);
  
  await client.end();
  console.log("All migrations applied successfully!");
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
