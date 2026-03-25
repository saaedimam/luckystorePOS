-- Fix RLS Policy for Users Table
-- The profile fetch is hanging because RLS is blocking the query
-- Run this in Supabase SQL Editor

-- Step 1: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 2: Drop existing policies if any (optional, only if you want to recreate)
-- DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
-- DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;

-- Step 3: Create policy to allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT
USING (auth_id = auth.uid());

-- Step 4: Also allow reading all users for profile lookup (needed for admin features)
-- This allows the app to fetch any user's profile for role checking
CREATE POLICY "Authenticated users can read users" ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Step 5: Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- If policies already exist, you'll get an error. That's OK - the policies are already there.

