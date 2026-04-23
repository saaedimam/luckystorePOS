-- Fix search_path_mutable warnings
ALTER FUNCTION public.close_pos_session(uuid, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_session_summary(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_session_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_sale_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_current_timestamp_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_po_number() SET search_path = public, pg_temp;

-- Fix "Extension in Public": move pg_trgm to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Fix rls_policy_always_true warnings for sale_items and sale_payments
DROP POLICY IF EXISTS "si_insert" ON public.sale_items;
CREATE POLICY "si_insert" ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = (SELECT auth.uid()) AND u.role IN ('admin','manager','cashier')));

DROP POLICY IF EXISTS "sp_insert" ON public.sale_payments;
CREATE POLICY "sp_insert" ON public.sale_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = (SELECT auth.uid()) AND u.role IN ('admin','manager','cashier')));
