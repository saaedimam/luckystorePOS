-- Create user profile for mac@luckystore.com
-- Run this in Supabase SQL Editor

INSERT INTO public.users (auth_id, email, full_name, role)
VALUES (
  'e1a15e1f-a3dc-48df-b992-f1da6befe32d',  -- Your auth user ID
  'mac@luckystore.com',                     -- Your email
  'Admin User',                             -- Your full name (change if needed)
  'admin'                                   -- Role: admin, manager, cashier, or stock
)
ON CONFLICT (auth_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Verify the profile was created
SELECT * FROM public.users WHERE auth_id = 'e1a15e1f-a3dc-48df-b992-f1da6befe32d';

