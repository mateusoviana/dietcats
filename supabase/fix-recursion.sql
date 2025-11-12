-- Fix: Remove recursive policy and create a simpler one
-- This script fixes the infinite recursion error in meal_check_ins policies

-- Drop the problematic policy
drop policy if exists "meal_select_owner_competitions" on public.meal_check_ins;

-- Recreate without recursion - using security definer function
-- This allows nutritionists to see meal check-ins of their patients
create or replace function public.user_is_nutritionist_of_patient(patient_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.competition_participants cp
    join public.competitions c on c.id = cp.competition_id
    where cp.patient_id = patient_uuid
      and c.nutritionist_id = auth.uid()
  );
$$;

-- Now create the policy using the function (avoids recursion)
create policy "meal_select_nutritionist_patients" on public.meal_check_ins
  for select using (
    patient_id = auth.uid() 
    or public.user_is_nutritionist_of_patient(patient_id)
  );



