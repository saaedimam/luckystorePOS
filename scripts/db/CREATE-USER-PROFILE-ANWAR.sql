-- Create user profile for anwar@ktlbd.com
-- Run this in Supabase SQL Editor

INSERT INTO public.users (auth_id, email, full_name, role)
VALUES (
  '5b533cba-fbae-44ec-903b-6b2139968582',  -- Your auth user ID
  'anwar@ktlbd.com',                        -- Your email
  'Anwar User',                             -- Your full name (change if needed)
  'admin'                                   -- Role: admin, manager, cashier, or stock
)
ON CONFLICT (auth_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Verify the profile was created
SELECT * FROM public.users WHERE auth_id = '5b533cba-fbae-44ec-903b-6b2139968582';

