-- =============================================================================
-- PRODUCTION HARDEN: Realistic Seed Data
-- 20 Grocery Products + 3 Dummy Online Orders
-- =============================================================================

-- Ensure we have a tenant and store first
INSERT INTO public.tenants (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Lucky Store Chittagong')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, code, name, tenant_id, lat, lng)
VALUES (
    '00000000-0000-0000-0000-00000000000a',
    'LST-CTG-001',
    'Lucky Store - Chittagong Main',
    '00000000-0000-0000-0000-000000000001',
    22.3569,  -- Chittagong lat
    91.7832   -- Chittagong lng
)
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO public.categories (id, tenant_id, name_en, name_bn, sort_order) VALUES
    ('cat-001-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Rice & Grains', 'চাল ও শস্য', 1),
    ('cat-002-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Fresh Vegetables', 'তাজা সবজি', 2),
    ('cat-003-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Fresh Fruits', 'তাজা ফল', 3),
    ('cat-004-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'দুগ্ধ ও ডিম', 4),
    ('cat-005-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Cooking Oil', 'রান্নার তেল', 5)
ON CONFLICT (id) DO NOTHING;

-- Insert 20 Realistic Grocery Products
INSERT INTO public.products (
    id, tenant_id, category_id, sku, name_en, name_bn, price, cost,
    stock_qty, reorder_point, reserved_online, is_active, image_url
) VALUES
    -- Rice & Grains (5 products)
    ('prod-001-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-001-0000-0000-000000000000', 'RICE-MIN-5KG', 'Miniket Rice 5kg', 'মিনিকেট চাল ৫ কেজি', 320.00, 280.00, 150, 30, 5, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'),
    ('prod-002-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-001-0000-0000-000000000000', 'RICE-NAJ-5KG', 'Najirshail Rice 5kg', 'নাজিরশৈল চাল ৫ কেজি', 340.00, 295.00, 120, 25, 3, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'),
    ('prod-003-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-001-0000-0000-000000000000', 'RICE-BAS-1KG', 'Basmati Rice 1kg', 'বাসমতি চাল ১ কেজি', 180.00, 145.00, 80, 15, 2, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'),
    ('prod-004-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-001-0000-0000-000000000000', 'DAL-MUS-1KG', 'Mosur Dal 1kg', 'মশুর ডাল ১ কেজি', 120.00, 95.00, 200, 40, 8, true, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'),
    ('prod-005-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-001-0000-0000-000000000000', 'DAL-CHOLA-1KG', 'Chola Dal 1kg', 'ছোলার ডাল ১ কেজি', 90.00, 70.00, 180, 35, 6, true, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'),

    -- Fresh Vegetables (5 products)
    ('prod-006-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-002-0000-0000-000000000000', 'VEG-POT-1KG', 'Potato (Aloo) 1kg', 'আলু ১ কেজি', 40.00, 28.00, 300, 50, 10, true, 'https://images.unsplash.com/photo-1518977676601-b53f82ber40d?w=400'),
    ('prod-007-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-002-0000-0000-000000000000', 'VEG-ONI-1KG', 'Onion (Peyaj) 1kg', 'পেঁয়াজ ১ কেজি', 55.00, 38.00, 250, 45, 12, true, 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400'),
    ('prod-008-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-002-0000-0000-000000000000', 'VEG-TOM-500G', 'Tomato (Tomato) 500g', 'টমেটো ৫০০ গ্রাম', 35.00, 22.00, 150, 30, 8, true, 'https://images.unsplash.com/photo-1592924357228-91a46daadc56?w=400'),
    ('prod-009-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-002-0000-0000-000000000000', 'VEG-CAP-500G', 'Capsicum (Shimla Morich) 500g', 'ক্যাপসিকাম ৫০০ গ্রাম', 45.00, 32.00, 100, 20, 5, true, 'https://images.unsplash.com/photo-1563565375-f3fdf5e71f87?w=400'),
    ('prod-010-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-002-0000-0000-000000000000', 'VEG-CAR-500G', 'Carrot (Gajor) 500g', 'গাজর ৫০০ গ্রাম', 30.00, 20.00, 120, 25, 4, true, 'https://images.unsplash.com/photo-1598170845058-32b0d41530b4?w=400'),

    -- Fresh Fruits (4 products)
    ('prod-011-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-003-0000-0000-000000000000', 'FRU-APP-1KG', 'Apple (Apple) 1kg', 'আপেল ১ কেজি', 180.00, 135.00, 80, 15, 3, true, 'https://images.unsplash.com/photo-1560806887-1e4cd0b935bd?w=400'),
    ('prod-012-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-003-0000-0000-000000000000', 'FRU-BAN-12PC', 'Banana (Kola) 12pcs', 'কলা ১২ পিস', 60.00, 42.00, 200, 40, 10, true, 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400'),
    ('prod-013-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-003-0000-0000-000000000000', 'FRU-ORG-1KG', 'Orange (Malta) 1kg', 'মাল্টা ১ কেজি', 140.00, 105.00, 90, 20, 4, true, 'https://images.unsplash.com/photo-1547514701-42782104795f?w=400'),
    ('prod-014-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-003-0000-0000-000000000000', 'FRU-GRA-500G', 'Grapes (Angur) 500g', 'আঙ্গুর ৫০০ গ্রাম', 120.00, 85.00, 70, 15, 2, true, 'https://images.unsplash.com/photo-1537640538965-17508cca5b85?w=400'),

    -- Dairy & Eggs (3 products)
    ('prod-015-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-004-0000-0000-000000000000', 'DAIRY-MILK-1L', 'Fresh Milk 1L', 'তাজা দুধ ১ লিটার', 85.00, 65.00, 100, 25, 6, true, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'),
    ('prod-016-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-004-0000-0000-000000000000', 'DAIRY-EGG-12PC', 'Eggs 12pcs (Deshi)', 'দেশি ডিম ১২ পিস', 160.00, 125.00, 150, 30, 8, true, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'),
    ('prod-017-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-004-0000-0000-000000000000', 'DAIRY-BUT-200G', 'Butter 200g', 'বাটার ২০০ গ্রাম', 220.00, 175.00, 60, 12, 2, true, 'https://images.unsplash.com/photo-1589985270826-4b552c5c8c0c?w=400'),

    -- Cooking Oil (3 products)
    ('prod-018-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-005-0000-0000-000000000000', 'OIL-SOY-5L', 'Soybean Oil 5L', 'সয়াবিন তেল ৫ লিটার', 650.00, 580.00, 80, 15, 3, true, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
    ('prod-019-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-005-0000-0000-000000000000', 'OIL-MUS-1L', 'Mustard Oil 1L', 'সরিষার তেল ১ লিটার', 280.00, 220.00, 90, 20, 4, true, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
    ('prod-020-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'cat-005-0000-0000-000000000000', 'OIL-OLI-500ML', 'Olive Oil 500ml', 'অলিভ তেল ৫০০ মিলি', 450.00, 380.00, 40, 10, 1, true, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400')
ON CONFLICT (id) DO NOTHING;

-- Create 3 Dummy Online Orders
-- Order 1: Pending order
INSERT INTO public.online_orders (
    id, tenant_id, customer_name, customer_whatsapp, customer_address,
    customer_lat, customer_lng, order_number, status, subtotal, delivery_fee, discount, total,
    payment_method, payment_status, created_at
) VALUES (
    'order-001-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'Rahim Ahmed',
    '+8801712345678',
    '12/A Rampura Road, Dhanmondi, Dhaka',
    23.7461, 90.3742,
    'LS-240601-001',
    'pending',
    520.00, 40.00, 0, 560.00,
    'cod', 'pending',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.online_order_items (order_id, item_id, quantity, unit_price, total_price) VALUES
    ('order-001-0000-0000-000000000000', 'prod-001-0000-0000-000000000000', 1, 320.00, 320.00),
    ('order-001-0000-0000-000000000000', 'prod-008-0000-0000-000000000000', 2, 35.00, 70.00),
    ('order-001-0000-0000-000000000000', 'prod-016-0000-0000-000000000000', 1, 160.00, 160.00)
ON CONFLICT DO NOTHING;

-- Order 2: Confirmed order
INSERT INTO public.online_orders (
    id, tenant_id, customer_name, customer_whatsapp, customer_address,
    customer_lat, customer_lng, order_number, status, subtotal, delivery_fee, discount, total,
    payment_method, payment_status, created_at
) VALUES (
    'order-002-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'Fatima Begum',
    '+8801812345678',
    '45/2 Bashundhara R/A, Block C, Dhaka',
    23.8195, 90.4376,
    'LS-240601-002',
    'confirmed',
    395.00, 40.00, 20, 415.00,
    'cod', 'pending',
    NOW() - INTERVAL '5 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.online_order_items (order_id, item_id, quantity, unit_price, total_price) VALUES
    ('order-002-0000-0000-000000000000', 'prod-002-0000-0000-000000000000', 1, 340.00, 340.00),
    ('order-002-0000-0000-000000000000', 'prod-007-0000-0000-000000000000', 1, 55.00, 55.00)
ON CONFLICT DO NOTHING;

-- Order 3: Preparing order
INSERT INTO public.online_orders (
    id, tenant_id, customer_name, customer_whatsapp, customer_address,
    customer_lat, customer_lng, order_number, status, subtotal, delivery_fee, discount, total,
    payment_method, payment_status, created_at
) VALUES (
    'order-003-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'Karim Hossain',
    '+8801912345678',
    '78 Mirpur Road, Mohammadpur, Dhaka',
    23.7625, 90.3528,
    'LS-240601-003',
    'preparing',
    680.00, 40.00, 0, 720.00,
    'cod', 'pending',
    NOW() - INTERVAL '8 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.online_order_items (order_id, item_id, quantity, unit_price, total_price) VALUES
    ('order-003-0000-0000-000000000000', 'prod-018-0000-0000-000000000000', 1, 650.00, 650.00),
    ('order-003-0000-0000-000000000000', 'prod-006-0000-0000-000000000000', 1, 40.00, 40.00)
ON CONFLICT DO NOTHING;

-- Update sequence counter for order numbers
INSERT INTO public.online_order_number_seq (tenant_id, seq_date, last_val) VALUES
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 3)
ON CONFLICT (tenant_id, seq_date) DO UPDATE SET last_val = GREATEST(public.online_order_number_seq.last_val, 3);

-- =============================================================================
-- PRODUCTION HARDEN: Complete
-- =============================================================================
