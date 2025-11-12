-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Profiles table: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  user_type text check (user_type in ('patient','nutritionist')) not null default 'patient',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: allow patients to self-join when enabled by owner
alter table public.competitions
  add column if not exists allow_self_join boolean not null default false;

alter table public.profiles enable row level security;

-- SELECT: Users can view their own profile
-- Using simple comparison to avoid recursion
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select 
  using ( id = auth.uid() );

-- INSERT: Users can create their own profile (used by trigger)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert 
  with check ( id = auth.uid() );

-- UPDATE: Users can update their own profile
-- Simplified to avoid any potential recursion
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update 
  using ( id = auth.uid() ) 
  with check ( id = auth.uid() );

-- DELETE: Users can delete their own profile
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete 
  using ( id = auth.uid() );

-- Auto-create profile on new auth user (supports email confirmation ON)
-- Note: SECURITY DEFINER allows the trigger to bypass RLS policies
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, user_type)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'name')::text,
             (new.raw_user_meta_data->>'full_name')::text,
             ''),
    coalesce((new.raw_user_meta_data->>'user_type')::text, 'patient')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    user_type = excluded.user_type,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep profile in sync when user metadata or email changes
-- Note: SECURITY DEFINER allows the trigger to bypass RLS policies
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set
    email = new.email,
    name = coalesce((new.raw_user_meta_data->>'name')::text,
                    (new.raw_user_meta_data->>'full_name')::text,
                    p.name),
    user_type = coalesce((new.raw_user_meta_data->>'user_type')::text, p.user_type),
    updated_at = now()
  where p.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_updated();

-- Meal check-ins by patients
create table if not exists public.meal_check_ins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  meal_type text not null,
  timestamp timestamptz not null default now(),
  photo_url text,
  hunger_rating int check (hunger_rating between 1 and 5),
  satiety_rating int check (satiety_rating between 1 and 5),
  satisfaction_rating int check (satisfaction_rating between 1 and 5),
  tag text,
  observations text,
  created_at timestamptz not null default now()
);

alter table public.meal_check_ins enable row level security;

-- SELECT: Patient can view their own check-ins
drop policy if exists "meal_select_own" on public.meal_check_ins;
create policy "meal_select_own" on public.meal_check_ins
  for select using ( patient_id = auth.uid() );

-- INSERT: Patient can create their own check-ins
drop policy if exists "meal_insert_own" on public.meal_check_ins;
create policy "meal_insert_own" on public.meal_check_ins
  for insert with check ( patient_id = auth.uid() );

-- UPDATE: Patient can update their own check-ins
drop policy if exists "meal_update_own" on public.meal_check_ins;
create policy "meal_update_own" on public.meal_check_ins
  for update using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );

-- DELETE: Patient can delete their own check-ins
drop policy if exists "meal_delete_own" on public.meal_check_ins;
create policy "meal_delete_own" on public.meal_check_ins
  for delete using ( patient_id = auth.uid() );

-- SELECT: Nutritionists can view check-ins of patients in their competitions
drop policy if exists "meal_select_nutritionist" on public.meal_check_ins;
create policy "meal_select_nutritionist" on public.meal_check_ins
  for select using (
    exists (
      select 1
      from public.competition_participants cp
      join public.competitions c on c.id = cp.competition_id
      where cp.patient_id = meal_check_ins.patient_id
        and c.nutritionist_id = auth.uid()
    )
  );

-- Competitions owned by a nutritionist
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  scoring_criteria jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Competition participants (patients)
create table if not exists public.competition_participants (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (competition_id, patient_id)
);

alter table public.competition_participants enable row level security;

drop policy if exists "participants_select_self_or_owner" on public.competition_participants;
create policy "participants_select_self_or_owner" on public.competition_participants
  for select using (
    patient_id = auth.uid() or exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id and c.nutritionist_id = auth.uid()
    )
  );

-- INSERT: Nutritionist can add participants to their competitions
drop policy if exists "participants_owner_insert" on public.competition_participants;
create policy "participants_owner_insert" on public.competition_participants
  for insert with check (
    exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id and c.nutritionist_id = auth.uid()
    )
  );

-- UPDATE: Nutritionist can update participants in their competitions
drop policy if exists "participants_owner_update" on public.competition_participants;
create policy "participants_owner_update" on public.competition_participants
  for update using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id and c.nutritionist_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id and c.nutritionist_id = auth.uid()
    )
  );

-- DELETE: Nutritionist can remove participants from their competitions
drop policy if exists "participants_owner_delete" on public.competition_participants;
create policy "participants_owner_delete" on public.competition_participants
  for delete using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id and c.nutritionist_id = auth.uid()
    )
  );

-- Allow patient self-join when the competition enables it
drop policy if exists "participants_self_insert" on public.competition_participants;
create policy "participants_self_insert" on public.competition_participants
  for insert with check (
    patient_id = auth.uid()
    and exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id
        and c.allow_self_join = true
    )
  );

-- Allow patient to leave competitions they are in
drop policy if exists "participants_self_delete" on public.competition_participants;
create policy "participants_self_delete" on public.competition_participants
  for delete using (
    patient_id = auth.uid()
  );

alter table public.competitions enable row level security;

-- SELECT: Nutritionist (owner) and participants can view competitions
drop policy if exists "competitions_select_members" on public.competitions;
create policy "competitions_select_members" on public.competitions
  for select using (
    nutritionist_id = auth.uid() or exists (
      select 1 from public.competition_participants cp
      where cp.competition_id = competitions.id and cp.patient_id = auth.uid()
    )
  );

-- INSERT: Nutritionist can create competitions
drop policy if exists "competitions_insert_owner" on public.competitions;
create policy "competitions_insert_owner" on public.competitions
  for insert with check ( nutritionist_id = auth.uid() );

-- UPDATE: Nutritionist can update their own competitions
drop policy if exists "competitions_update_owner" on public.competitions;
create policy "competitions_update_owner" on public.competitions
  for update using ( nutritionist_id = auth.uid() ) with check ( nutritionist_id = auth.uid() );

-- DELETE: Nutritionist can delete their own competitions
drop policy if exists "competitions_delete_owner" on public.competitions;
create policy "competitions_delete_owner" on public.competitions
  for delete using ( nutritionist_id = auth.uid() );

-- Helpful indexes
create index if not exists idx_meal_check_ins_patient on public.meal_check_ins(patient_id, timestamp desc);
create index if not exists idx_competitions_owner on public.competitions(nutritionist_id);
create index if not exists idx_participants_patient on public.competition_participants(patient_id);

-- ========================================
-- STORAGE BUCKET FOR MEAL PHOTOS
-- ========================================

-- Create the storage bucket (if not exists via dashboard)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policies for meal-photos bucket
drop policy if exists "Public read access" on storage.objects;
create policy "Public read access"
on storage.objects for select
using ( bucket_id = 'meal-photos' );

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'meal-photos'
  and auth.role() = 'authenticated'
);

drop policy if exists "Users can update own photos" on storage.objects;
create policy "Users can update own photos"
on storage.objects for update
using (
  bucket_id = 'meal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos"
on storage.objects for delete
using (
  bucket_id = 'meal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
