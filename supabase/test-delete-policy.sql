-- ========================================
-- TEST DELETE POLICY FOR MEAL CHECK-INS
-- ========================================

-- 1. Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'meal_check_ins';

-- 2. List all policies for meal_check_ins
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
WHERE tablename = 'meal_check_ins'
ORDER BY policyname;

-- 3. Test: Try to select your own check-ins (should work)
SELECT id, meal_type, patient_id, created_at
FROM public.meal_check_ins
WHERE patient_id = auth.uid()
LIMIT 5;

-- 4. Test: Try to delete one of your own check-ins
-- IMPORTANT: Replace 'YOUR_CHECK_IN_ID' with an actual ID from step 3
-- DELETE FROM public.meal_check_ins
-- WHERE id = 'YOUR_CHECK_IN_ID' AND patient_id = auth.uid();

-- 5. If delete fails, check if auth.uid() is working
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 6. Count your check-ins
SELECT COUNT(*) as my_check_ins_count
FROM public.meal_check_ins
WHERE patient_id = auth.uid();

