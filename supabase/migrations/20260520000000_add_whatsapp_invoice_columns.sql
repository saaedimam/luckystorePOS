-- Add WhatsApp invoice columns to sales table
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_whatsapp text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url text,
  ADD COLUMN IF NOT EXISTS invoice_sent_via text,
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz;

-- Create invoices storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'invoices' bucket
-- 1. Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');

-- 2. Authenticated Upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- 3. Authenticated Update (optional, for replacing invoices)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');
