-- =============================================================================
-- Migration: Invoice Storage Infrastructure
-- =============================================================================

-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS for Invoices
-- Public can read invoices (to allow customers to view them via link)
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'invoices');

-- Authenticated users (like the Edge Function via service_role or regular users) can upload
-- Note: Service Role Key bypasses RLS, but we add this for safety and local testing.
CREATE POLICY "Authenticated Upload Access" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

-- 3. Cleanup Trigger (Optional: delete invoice file when sale is deleted)
CREATE OR REPLACE FUNCTION public.handle_sale_deletion_cleanup()
RETURNS TRIGGER AS $$
BEGIN
    -- We can't directly call storage API from SQL easily without extensions, 
    -- but we can log a cleanup task or just let it persist as historical record.
    -- For POS, persistence is usually preferred.
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
