-- ============================================
-- QUICK FIX: Create User Profile
-- ============================================
-- Copy and paste this ENTIRE block into Supabase SQL Editor
-- Then click "Run" (or press Cmd/Ctrl + Enter)
-- ============================================

-- Step 1: Create RLS Policy (if it doesn't exist)
-- This allows authenticated users to read the users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Authenticated users can read users'
  ) THEN
    CREATE POLICY "Authenticated users can read users" ON public.users
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Step 2: Create the user profile
-- Replace the auth_id below with YOUR actual auth user ID
-- You can find it in: Supabase Dashboard → Authentication → Users
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES (
  '52f76bb6-b9b8-4d51-9972-3f767ea1c2d5',  -- Your auth user ID
  'anwar@ktlbd.com',                        -- Your email
  'Anwar User',                             -- Your full name
  'admin'                                   -- Role: admin, manager, cashier, or stock
)
ON CONFLICT (auth_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Step 3: Verify the profile was created
SELECT 
  id,
  auth_id,
  email,
  full_name,
  role,
  created_at
FROM public.users 
WHERE auth_id = '52f76bb6-b9b8-4d51-9972-3f767ea1c2d5';

-- ============================================
-- After running this:
-- 1. Refresh your browser (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
-- 2. The app should now load properly
-- ============================================

