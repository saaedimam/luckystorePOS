-- Grant permission to anon (unauthenticated) users to search items and load categories.
-- This is necessary for the local-only POS Cashier PIN login to work since it 
-- does not establish a Supabase Auth session.

GRANT EXECUTE ON FUNCTION public.search_items_pos(uuid, text, uuid, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pos_categories(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_item_by_scan(text, uuid) TO anon;

-- Note: complete_sale remains restricted to 'authenticated' for security.
