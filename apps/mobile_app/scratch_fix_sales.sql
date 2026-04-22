ALTER TABLE public.sales RENAME COLUMN receipt_number TO sale_number;
ALTER TABLE public.sales RENAME COLUMN total TO total_amount;
ALTER TABLE public.sales RENAME COLUMN discount TO discount_amount;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_tendered numeric(12,2);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS change_due numeric(12,2);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes text;
