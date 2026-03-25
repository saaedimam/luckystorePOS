-- Create user profile for admin@luckystore.com
-- Run this in Supabase SQL Editor

INSERT INTO public.users (auth_id, email, full_name, role)
VALUES (
  'e88beffc-f0a0-4857-9426-77d509321bc7',  -- Your auth user ID
  'admin@luckystore.com',                   -- Your email
  'Admin User',                             -- Your full name (change if needed)
  'admin'                                   -- Role: admin, manager, cashier, or stock
)
ON CONFLICT (auth_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Verify the profile was created
SELECT 
  id,
  auth_id,
  email,
  full_name,
  role,
  created_at
FROM public.users 
WHERE auth_id = 'e88beffc-f0a0-4857-9426-77d509321bc7';

