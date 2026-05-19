-- =============================================================================
-- Migration: Storefront RLS & Guest Checkout Permissions
-- =============================================================================

-- 1. Products (Items) visibility for guests
-- We allow anonymous users to view products so they can shop online.
-- In a multi-tenant system, we might restrict this by a public store slug/id.
CREATE POLICY "products_guest_read" ON public.products
    FOR SELECT TO anon USING (true);

-- 2. Categories visibility for guests
CREATE POLICY "categories_guest_read" ON public.categories
    FOR SELECT TO anon USING (true);

-- 3. Stores visibility for guests
CREATE POLICY "stores_guest_read" ON public.stores
    FOR SELECT TO anon USING (true);

-- 4. Online Orders submission for guests
CREATE POLICY "online_orders_guest_insert" ON public.online_orders
    FOR INSERT TO anon WITH CHECK (status = 'pending');

-- 5. Online Order Items submission for guests
CREATE POLICY "online_order_items_guest_insert" ON public.online_order_items
    FOR INSERT TO anon WITH CHECK (true);

-- 6. Delivery Zones visibility for guests
CREATE POLICY "delivery_zones_guest_read" ON public.delivery_zones
    FOR SELECT TO anon USING (is_active = true);
