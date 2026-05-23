/**
 * Production Harden: Seed Script
 * Seeds realistic grocery products and dummy online orders
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Starting production seed...\n');

  // Tenant and Store data
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const storeId = '00000000-0000-0000-0000-00000000000a';

  // Categories
  const categories = [
    { id: 'cat-001-0000-0000-000000000000', name_en: 'Rice & Grains', name_bn: 'চাল ও শস্য', sort_order: 1 },
    { id: 'cat-002-0000-0000-000000000000', name_en: 'Fresh Vegetables', name_bn: 'তাজা সবজি', sort_order: 2 },
    { id: 'cat-003-0000-0000-000000000000', name_en: 'Fresh Fruits', name_bn: 'তাজা ফল', sort_order: 3 },
    { id: 'cat-004-0000-0000-000000000000', name_en: 'Dairy & Eggs', name_bn: 'দুগ্ধ ও ডিম', sort_order: 4 },
    { id: 'cat-005-0000-0000-000000000000', name_en: 'Cooking Oil', name_bn: 'রান্নার তেল', sort_order: 5 },
  ];

  // Products
  const products = [
    // Rice & Grains
    { id: 'prod-001-0000-0000-000000000000', category_id: 'cat-001-0000-0000-000000000000', sku: 'RICE-MIN-5KG', name_en: 'Miniket Rice 5kg', name_bn: 'মিনিকেট চাল ৫ কেজি', price: 320.00, cost: 280.00, stock: 150 },
    { id: 'prod-002-0000-0000-000000000000', category_id: 'cat-001-0000-0000-000000000000', sku: 'RICE-NAJ-5KG', name_en: 'Najirshail Rice 5kg', name_bn: 'নাজিরশৈল চাল ৫ কেজি', price: 340.00, cost: 295.00, stock: 120 },
    { id: 'prod-003-0000-0000-000000000000', category_id: 'cat-001-0000-0000-000000000000', sku: 'RICE-BAS-1KG', name_en: 'Basmati Rice 1kg', name_bn: 'বাসমতি চাল ১ কেজি', price: 180.00, cost: 145.00, stock: 80 },
    { id: 'prod-004-0000-0000-000000000000', category_id: 'cat-001-0000-0000-000000000000', sku: 'DAL-MUS-1KG', name_en: 'Mosur Dal 1kg', name_bn: 'মশুর ডাল ১ কেজি', price: 120.00, cost: 95.00, stock: 200 },
    { id: 'prod-005-0000-0000-000000000000', category_id: 'cat-001-0000-0000-000000000000', sku: 'DAL-CHOLA-1KG', name_en: 'Chola Dal 1kg', name_bn: 'ছোলার ডাল ১ কেজি', price: 90.00, cost: 70.00, stock: 180 },
    // Vegetables
    { id: 'prod-006-0000-0000-000000000000', category_id: 'cat-002-0000-0000-000000000000', sku: 'VEG-POT-1KG', name_en: 'Potato (Aloo) 1kg', name_bn: 'আলু ১ কেজি', price: 40.00, cost: 28.00, stock: 300 },
    { id: 'prod-007-0000-0000-000000000000', category_id: 'cat-002-0000-0000-000000000000', sku: 'VEG-ONI-1KG', name_en: 'Onion (Peyaj) 1kg', name_bn: 'পেঁয়াজ ১ কেজি', price: 55.00, cost: 38.00, stock: 250 },
    { id: 'prod-008-0000-0000-000000000000', category_id: 'cat-002-0000-0000-000000000000', sku: 'VEG-TOM-500G', name_en: 'Tomato 500g', name_bn: 'টমেটো ৫০০ গ্রাম', price: 35.00, cost: 22.00, stock: 150 },
    { id: 'prod-009-0000-0000-000000000000', category_id: 'cat-002-0000-0000-000000000000', sku: 'VEG-CAP-500G', name_en: 'Capsicum 500g', name_bn: 'ক্যাপসিকাম ৫০০ গ্রাম', price: 45.00, cost: 32.00, stock: 100 },
    { id: 'prod-010-0000-0000-000000000000', category_id: 'cat-002-0000-0000-000000000000', sku: 'VEG-CAR-500G', name_en: 'Carrot (Gajor) 500g', name_bn: 'গাজর ৫০০ গ্রাম', price: 30.00, cost: 20.00, stock: 120 },
    // Fruits
    { id: 'prod-011-0000-0000-000000000000', category_id: 'cat-003-0000-0000-000000000000', sku: 'FRU-APP-1KG', name_en: 'Apple 1kg', name_bn: 'আপেল ১ কেজি', price: 180.00, cost: 135.00, stock: 80 },
    { id: 'prod-012-0000-0000-000000000000', category_id: 'cat-003-0000-0000-000000000000', sku: 'FRU-BAN-12PC', name_en: 'Banana 12pcs', name_bn: 'কলা ১২ পিস', price: 60.00, cost: 42.00, stock: 200 },
    { id: 'prod-013-0000-0000-000000000000', category_id: 'cat-003-0000-0000-000000000000', sku: 'FRU-ORG-1KG', name_en: 'Orange 1kg', name_bn: 'মাল্টা ১ কেজি', price: 140.00, cost: 105.00, stock: 90 },
    { id: 'prod-014-0000-0000-000000000000', category_id: 'cat-003-0000-0000-000000000000', sku: 'FRU-GRA-500G', name_en: 'Grapes 500g', name_bn: 'আঙ্গুর ৫০০ গ্রাম', price: 120.00, cost: 85.00, stock: 70 },
    // Dairy
    { id: 'prod-015-0000-0000-000000000000', category_id: 'cat-004-0000-0000-000000000000', sku: 'DAIRY-MILK-1L', name_en: 'Fresh Milk 1L', name_bn: 'তাজা দুধ ১ লিটার', price: 85.00, cost: 65.00, stock: 100 },
    { id: 'prod-016-0000-0000-000000000000', category_id: 'cat-004-0000-0000-000000000000', sku: 'DAIRY-EGG-12PC', name_en: 'Eggs 12pcs', name_bn: 'দেশি ডিম ১২ পিস', price: 160.00, cost: 125.00, stock: 150 },
    { id: 'prod-017-0000-0000-000000000000', category_id: 'cat-004-0000-0000-000000000000', sku: 'DAIRY-BUT-200G', name_en: 'Butter 200g', name_bn: 'বাটার ২০০ গ্রাম', price: 220.00, cost: 175.00, stock: 60 },
    // Oil
    { id: 'prod-018-0000-0000-000000000000', category_id: 'cat-005-0000-0000-000000000000', sku: 'OIL-SOY-5L', name_en: 'Soybean Oil 5L', name_bn: 'সয়াবিন তেল ৫ লিটার', price: 650.00, cost: 580.00, stock: 80 },
    { id: 'prod-019-0000-0000-000000000000', category_id: 'cat-005-0000-0000-000000000000', sku: 'OIL-MUS-1L', name_en: 'Mustard Oil 1L', name_bn: 'সরিষার তেল ১ লিটার', price: 280.00, cost: 220.00, stock: 90 },
    { id: 'prod-020-0000-0000-000000000000', category_id: 'cat-005-0000-0000-000000000000', sku: 'OIL-OLI-500ML', name_en: 'Olive Oil 500ml', name_bn: 'অলিভ তেল ৫০০ মিলি', price: 450.00, cost: 380.00, stock: 40 },
  ];

  try {
    // Seed Categories
    console.log('📦 Seeding categories...');
    for (const cat of categories) {
      const { error } = await supabase.from('categories').upsert({
        ...cat,
        tenant_id: tenantId,
      });
      if (error) console.error('Category error:', error.message);
    }

    // Seed Products
    console.log('🥬 Seeding 20 realistic grocery products...');
    for (const prod of products) {
      const { error } = await supabase.from('products').upsert({
        ...prod,
        tenant_id: tenantId,
        reorder_point: Math.floor(prod.stock * 0.2),
        reserved_online: Math.floor(Math.random() * 10),
        is_active: true,
        image_url: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1586201375761-83865001e31c' : '1615485290382-441e4d049cb5'}?w=400`,
      });
      if (error) console.error('Product error:', prod.sku, error.message);
    }

    // Seed Online Orders
    console.log('📋 Seeding 3 dummy online orders...');
    const orders = [
      {
        id: 'order-001-0000-0000-000000000000',
        customer_name: 'Rahim Ahmed',
        customer_whatsapp: '+8801712345678',
        customer_address: '12/A Rampura Road, Dhanmondi, Dhaka',
        customer_lat: 23.7461,
        customer_lng: 90.3742,
        order_number: 'LS-240601-001',
        status: 'pending',
        subtotal: 520.00,
        delivery_fee: 40.00,
        discount: 0,
        total: 560.00,
      },
      {
        id: 'order-002-0000-0000-000000000000',
        customer_name: 'Fatima Begum',
        customer_whatsapp: '+8801812345678',
        customer_address: '45/2 Bashundhara R/A, Block C, Dhaka',
        customer_lat: 23.8195,
        customer_lng: 90.4376,
        order_number: 'LS-240601-002',
        status: 'confirmed',
        subtotal: 395.00,
        delivery_fee: 40.00,
        discount: 20.00,
        total: 415.00,
      },
      {
        id: 'order-003-0000-0000-000000000000',
        customer_name: 'Karim Hossain',
        customer_whatsapp: '+8801912345678',
        customer_address: '78 Mirpur Road, Mohammadpur, Dhaka',
        customer_lat: 23.7625,
        customer_lng: 90.3528,
        order_number: 'LS-240601-003',
        status: 'preparing',
        subtotal: 680.00,
        delivery_fee: 40.00,
        discount: 0,
        total: 720.00,
      },
    ];

    for (const order of orders) {
      const { error } = await supabase.from('online_orders').upsert({
        ...order,
        tenant_id: tenantId,
        payment_method: 'cod',
        payment_status: 'pending',
        created_at: new Date(Date.now() - Math.random() * 36000000).toISOString(),
      });
      if (error) console.error('Order error:', order.order_number, error.message);
    }

    // Seed Order Items
    const orderItems = [
      { order_id: 'order-001-0000-0000-000000000000', item_id: 'prod-001-0000-0000-000000000000', quantity: 1, unit_price: 320.00, total_price: 320.00 },
      { order_id: 'order-001-0000-0000-000000000000', item_id: 'prod-008-0000-0000-000000000000', quantity: 2, unit_price: 35.00, total_price: 70.00 },
      { order_id: 'order-001-0000-0000-000000000000', item_id: 'prod-016-0000-0000-000000000000', quantity: 1, unit_price: 160.00, total_price: 160.00 },
      { order_id: 'order-002-0000-0000-000000000000', item_id: 'prod-002-0000-0000-000000000000', quantity: 1, unit_price: 340.00, total_price: 340.00 },
      { order_id: 'order-002-0000-0000-000000000000', item_id: 'prod-007-0000-0000-000000000000', quantity: 1, unit_price: 55.00, total_price: 55.00 },
      { order_id: 'order-003-0000-0000-000000000000', item_id: 'prod-018-0000-0000-000000000000', quantity: 1, unit_price: 650.00, total_price: 650.00 },
      { order_id: 'order-003-0000-0000-000000000000', item_id: 'prod-006-0000-0000-000000000000', quantity: 1, unit_price: 40.00, total_price: 40.00 },
    ];

    for (const item of orderItems) {
      const { error } = await supabase.from('online_order_items').upsert(item);
      if (error) console.error('Order item error:', error.message);
    }

    console.log('\n✅ Production seed completed successfully!');
    console.log(`📊 Summary: ${products.length} products, 5 categories, ${orders.length} orders`);

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
