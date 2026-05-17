import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env or .env.local in the current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_REMOTE_EMAIL || 'admin@local.dev';
const testPassword = process.env.TEST_REMOTE_PASSWORD || 'localdev123';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSmokeTest() {
  console.log(`🔄 Authenticating with remote Supabase at ${supabaseUrl}...`);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error(`❌ Authentication Failed: ${authError.message}`);
    return;
  }

  console.log(`✅ Authenticated successfully as ${authData.user?.email}\n`);
  
  // 1. Retrieve the authenticated user's store_id from public.users
  console.log('🔍 Querying public.users to resolve store_id...');
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('store_id')
    .eq('email', authData.user?.email)
    .single();

  if (profileError || !userProfile?.store_id) {
    console.error(`❌ Failed to resolve store_id for authenticated user: ${profileError?.message || 'store_id is null'}`);
    return;
  }

  const storeId = userProfile.store_id;
  console.log(`✅ Resolved store_id: ${storeId}\n`);

  // 2. Retrieve the latest sale record to resolve a valid sale_id
  console.log('🔍 Querying latest sale to resolve sale_id...');
  const { data: latestSale, error: saleError } = await supabase
    .from('sales')
    .select('id')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const saleId = latestSale?.id || '00000000-0000-0000-0000-000000000000';
  if (latestSale?.id) {
    console.log(`✅ Resolved sale_id: ${saleId}\n`);
  } else {
    console.log(`⚠️ No sales found for store. Defaulting to dummy UUID: ${saleId}\n`);
  }

  // 3. Define the RPCs to test with correct, dynamically resolved parameters
  const rpcsToTest = [
    { name: 'get_manager_dashboard_stats', args: { p_store_id: storeId } },
    { name: 'get_low_stock_items', args: { p_store_id: storeId } },
    { name: 'get_inventory_list', args: { p_store_id: storeId } },
    { name: 'get_sales_history', args: { p_store_id: storeId } },
    { name: 'get_upcoming_reminders', args: { p_store_id: storeId } },
    { name: 'get_sale_details', args: { p_sale_id: saleId } }
  ];

  console.log('🚀 Starting RPC Permission & Execution Audit...\n');

  for (const rpc of rpcsToTest) {
    const { data, error } = await supabase.rpc(rpc.name, rpc.args);
    
    if (error) {
      if (error.code === '42501') {
        console.log(`🔴 [FAIL] ${rpc.name}: Permission Denied (42501) - Needs GRANT EXECUTE`);
      } else if (error.code === 'PGRST202') {
         console.log(`🟠 [WARN] ${rpc.name}: Function not found or parameter mismatch. Check remote schema signature.`);
      } else {
        console.log(`🟡 [INFO] ${rpc.name}: Execution allowed, but threw PostgreSQL error ${error.code} (${error.message}).`);
      }
    } else {
      const recordsCount = Array.isArray(data) ? data.length : (data ? '1 object' : '0');
      console.log(`🟢 [PASS] ${rpc.name}: Execution allowed. Returned: ${recordsCount}`);
    }
  }
  
  console.log('\n✅ Audit complete.');
}

runSmokeTest();
