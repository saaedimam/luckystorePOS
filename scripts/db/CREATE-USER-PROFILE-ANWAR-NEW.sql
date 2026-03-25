-- Create user profile for anwar@ktlbd.com (NEW account)
-- Run this in Supabase SQL Editor

INSERT INTO public.users (auth_id, email, full_name, role)
VALUES (
  '52f76bb6-b9b8-4d51-9972-3f767ea1c2d5',  -- Your NEW auth user ID
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
SELECT * FROM public.users WHERE auth_id = '52f76bb6-b9b8-4d51-9972-3f767ea1c2d5';

