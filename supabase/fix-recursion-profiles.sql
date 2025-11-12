-- ========================================
-- FIX INFINITE RECURSION IN PROFILES RLS
-- ========================================

-- 1. Drop all existing policies on profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- 2. Recreate policies with simple, non-recursive conditions

-- SELECT: Users can only view their own profile
-- Using direct UUID comparison to avoid any recursion
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING ( id = auth.uid() );

-- INSERT: Users can only create their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK ( id = auth.uid() );

-- UPDATE: Users can only update their own profile
-- Split into separate USING and WITH CHECK to avoid recursion
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING ( id = auth.uid() )
  WITH CHECK ( id = auth.uid() );

-- DELETE: Users can only delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING ( id = auth.uid() );

-- 3. Verify policies are correct
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

