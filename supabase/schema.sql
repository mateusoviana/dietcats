-- ============================================================================
-- DIETCATS DATABASE SCHEMA
-- ============================================================================
-- This file defines the complete database structure for the DietCats app.
-- 
-- ⚠️ IMPORTANTE: Se a tabela profiles JÁ EXISTE no seu banco
-- NÃO rode este CREATE TABLE - ele não vai adicionar as novas colunas!
-- Em vez disso, use a migração: supabase/migrations/add_association_columns.sql
-- Veja instruções em: MIGRACAO_ASSOCIACAO.md
-- ============================================================================

-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- ============================================================================
-- USER PROFILES SYSTEM
-- ============================================================================

-- Profiles table: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  user_type text check (user_type in ('patient','nutritionist')) not null default 'patient',
  avatar_url text,
  nutritionist_id uuid references public.profiles(id) on delete set null, -- For patients: their associated nutritionist
  association_code text unique, -- For nutritionists: code to share with patients
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: allow patients to self-join when enabled by owner
alter table public.competitions
  add column if not exists allow_self_join boolean not null default false;

-- ============================================================================
-- RLS DESABILITADO - Configuração para Projeto Acadêmico
-- ============================================================================
-- NOTA: Em produção, seria necessário habilitar RLS e implementar policies
-- adequadas para garantir isolamento e segurança dos dados entre usuários.
-- ============================================================================

alter table public.profiles DISABLE row level security;

-- Policies mantidas comentadas para referência futura:
/*
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (auth.uid() is not null);

-- INSERT: Users can create their own profile (used by trigger)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- UPDATE: Users can update their own profile
-- Simplified to avoid any potential recursion
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
*/

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

-- ============================================================================
-- ASSOCIATION SYSTEM: Nutritionist-Patient relationship via codes
-- ============================================================================

-- Function to generate unique association code for nutritionists
-- Usage: SELECT generate_association_code();
-- Returns: 6-character unique code (e.g., 'A3F5D2')
create or replace function public.generate_association_code()
returns text
language plpgsql
security definer
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    -- Generate 6-character code
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    select exists(select 1 from public.profiles where association_code = v_code) into v_exists;
    
    exit when not v_exists;
  end loop;
  
  return v_code;
end;
$$;

-- Function to associate patient with nutritionist using code
-- Usage: SELECT associate_with_nutritionist('A3F5D2');
-- Returns: JSON with success status and nutritionist info
create or replace function public.associate_with_nutritionist(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nutritionist_id uuid;
  v_nutritionist_name text;
  v_patient_id uuid;
begin
  -- Get current user ID
  v_patient_id := auth.uid();
  
  if v_patient_id is null then
    return json_build_object('success', false, 'error', 'Não autenticado');
  end if;
  
  -- Find nutritionist with this code
  select id, name into v_nutritionist_id, v_nutritionist_name
  from public.profiles
  where association_code = upper(p_code)
    and user_type = 'nutritionist';
  
  if v_nutritionist_id is null then
    return json_build_object('success', false, 'error', 'Código inválido');
  end if;
  
  -- Associate patient with nutritionist
  update public.profiles
  set nutritionist_id = v_nutritionist_id,
      updated_at = now()
  where id = v_patient_id
    and user_type = 'patient';
  
  return json_build_object(
    'success', true,
    'nutritionistId', v_nutritionist_id,
    'nutritionistName', v_nutritionist_name
  );
end;
$$;

-- Indexes for association system (performance optimization)
create index if not exists idx_profiles_nutritionist_id on public.profiles(nutritionist_id);
create index if not exists idx_profiles_association_code on public.profiles(association_code) where association_code is not null;

-- Add descriptive comments to the database (visible in Supabase dashboard)
comment on column public.profiles.nutritionist_id is 'For patients: UUID of their associated nutritionist. NULL if no association.';
comment on column public.profiles.association_code is 'For nutritionists: Unique 6-char code to share with patients for association.';
comment on function public.generate_association_code is 'Generates a unique 6-character association code for nutritionists';
comment on function public.associate_with_nutritionist is 'Associates a patient with a nutritionist using the nutritionist''s code. Returns JSON with success status.';

-- ============================================================================
-- MEAL CHECK-INS SYSTEM
-- ============================================================================

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

alter table public.meal_check_ins DISABLE row level security;

-- Policies mantidas comentadas para referência futura:
/*
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

drop policy if exists "meal_select_owner_competitions" on public.meal_check_ins;
create policy "meal_select_owner_competitions" on public.meal_check_ins
  for select using (
    exists (
      select 1
      from public.competition_participants cp
      join public.competitions c on c.id = cp.competition_id
      where cp.patient_id = meal_check_ins.patient_id
        and c.nutritionist_id = auth.uid()
    )
  );

drop policy if exists "meal_select_associated_patients" on public.meal_check_ins;
create policy "meal_select_associated_patients" on public.meal_check_ins
  for select using (
    exists (
      select 1
      from public.profiles p
      where p.id = meal_check_ins.patient_id
        and p.nutritionist_id = auth.uid()
    )
  );
*/

-- ============================================================================
-- COMPETITIONS SYSTEM
-- ============================================================================

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

alter table public.competition_participants DISABLE row level security;
alter table public.competitions DISABLE row level security;

-- NOTE: RLS desabilitado para desenvolvimento acadêmico.
-- Em produção, seria necessário implementar policies adequadas.

-- Policies mantidas comentadas para referência futura:
/*
alter table public.competition_participants enable row level security;

drop policy if exists "part_read_all" on public.competition_participants;
create policy "part_read_all" on public.competition_participants
  for select using (true);

drop policy if exists "part_write_all" on public.competition_participants;
create policy "part_write_all" on public.competition_participants
  for insert with check (true);

drop policy if exists "part_delete_all" on public.competition_participants;
create policy "part_delete_all" on public.competition_participants
  for delete using (true);

alter table public.competitions enable row level security;

drop policy if exists "comp_owner_only" on public.competitions;
create policy "comp_owner_only" on public.competitions
  for all 
  using (nutritionist_id = auth.uid())
  with check (nutritionist_id = auth.uid());
*/

-- Helpful indexes
create index if not exists idx_meal_check_ins_patient on public.meal_check_ins(patient_id, timestamp desc);
create index if not exists idx_competitions_owner on public.competitions(nutritionist_id);
create index if not exists idx_participants_patient on public.competition_participants(patient_id);

-- ============================================================================
-- COMPETITION SCORING SYSTEM
-- ============================================================================

-- Competition scores: tracks points for each participant in each competition
create table if not exists public.competition_scores (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  score int not null default 0,
  check_in_count int not null default 0,
  last_check_in_date date,
  updated_at timestamptz not null default now(),
  primary key (competition_id, patient_id)
);

alter table public.competition_scores DISABLE row level security;

-- Policies mantidas comentadas para referência futura:
/*
alter table public.competition_scores enable row level security;

drop policy if exists "scores_select_self_or_owner" on public.competition_scores;
create policy "scores_select_self_or_owner" on public.competition_scores
  for select using (
    patient_id = auth.uid() or exists (
      select 1 from public.competitions c
      where c.id = competition_scores.competition_id and c.nutritionist_id = auth.uid()
    )
  );

drop policy if exists "scores_system_update" on public.competition_scores;
create policy "scores_system_update" on public.competition_scores
  for all using (true) with check (true);
*/

create index if not exists idx_competition_scores on public.competition_scores(competition_id, score desc);

-- Function to calculate points based on scoring criteria
create or replace function public.calculate_check_in_points(
  p_competition_id uuid,
  p_hunger_rating int,
  p_satiety_rating int,
  p_satisfaction_rating int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_criteria jsonb;
  v_points int := 0;
  v_check_in_points int := 0;
  v_rating_bonus int := 0;
  v_avg_rating numeric;
begin
  -- Get scoring criteria for the competition
  select scoring_criteria into v_criteria
  from public.competitions
  where id = p_competition_id;

  if v_criteria is null then
    -- Default scoring if no criteria defined
    return 10;
  end if;

  -- Extract scoring values (with defaults)
  v_check_in_points := coalesce((v_criteria->>'checkInPoints')::int, 10);
  v_rating_bonus := coalesce((v_criteria->>'ratingBonus')::int, 0);

  -- Base points for completing check-in
  v_points := v_check_in_points;

  -- Bonus for ratings (if all ratings are provided and average is good)
  if p_hunger_rating is not null and p_satiety_rating is not null and p_satisfaction_rating is not null then
    v_avg_rating := (p_hunger_rating + p_satiety_rating + p_satisfaction_rating) / 3.0;
    if v_avg_rating >= 4.0 then
      v_points := v_points + v_rating_bonus;
    end if;
  end if;

  return v_points;
end;
$$;

-- Trigger function to update competition scores when a meal check-in is created
create or replace function public.update_competition_scores_on_check_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competition record;
  v_points int;
  v_check_in_date date;
begin
  v_check_in_date := date(new.timestamp);

  -- Find all active competitions that the patient is participating in
  for v_competition in
    select c.id, c.start_date, c.end_date
    from public.competitions c
    inner join public.competition_participants cp on cp.competition_id = c.id
    where cp.patient_id = new.patient_id
      and c.start_date <= v_check_in_date
      and c.end_date >= v_check_in_date
  loop
    -- Calculate points for this check-in
    v_points := public.calculate_check_in_points(
      v_competition.id,
      new.hunger_rating,
      new.satiety_rating,
      new.satisfaction_rating
    );

    -- Update or insert score record
    insert into public.competition_scores (
      competition_id,
      patient_id,
      score,
      check_in_count,
      last_check_in_date,
      updated_at
    )
    values (
      v_competition.id,
      new.patient_id,
      v_points,
      1,
      v_check_in_date,
      now()
    )
    on conflict (competition_id, patient_id)
    do update set
      score = competition_scores.score + v_points,
      check_in_count = competition_scores.check_in_count + 1,
      last_check_in_date = v_check_in_date,
      updated_at = now();
  end loop;

  return new;
end;
$$;

-- Create trigger on meal_check_ins
drop trigger if exists on_meal_check_in_created on public.meal_check_ins;
create trigger on_meal_check_in_created
  after insert on public.meal_check_ins
  for each row execute procedure public.update_competition_scores_on_check_in();

-- ============================================================================
-- STORAGE BUCKET FOR MEAL PHOTOS
-- ============================================================================
-- This section configures Supabase Storage for meal check-in photos.
-- Photos are organized by user ID: meal-photos/{user_id}/{filename}
-- 
-- ⚠️ STORAGE POLICIES DESABILITADAS - Projeto Acadêmico
-- Para habilitar upload de fotos sem complicações de permissão.
-- ============================================================================

-- Create the storage bucket for meal photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  true,  -- Public access for reading
  5242880, -- 5MB file size limit
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================================================
-- Storage Policies Comentadas (RLS Desabilitado para Projeto Acadêmico)
-- ============================================================================
-- Para projeto acadêmico, as políticas de storage não são necessárias.
-- Em produção, seria necessário habilitar estas policies para segurança.
--
-- NOTA: Para permitir uploads sem políticas, você pode:
-- 1. Desabilitar RLS no bucket via Dashboard: Storage → meal-photos → Policies
-- 2. Ou criar policies permissivas conforme comentado abaixo:
/*

-- Public read access to all meal photos
drop policy if exists "Public read access" on storage.objects;
create policy "Public read access"
on storage.objects for select
using ( bucket_id = 'meal-photos' );

-- Authenticated users can upload meal photos
drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'meal-photos'
  and auth.role() = 'authenticated'
);

-- Users can update their own photos
drop policy if exists "Users can update own photos" on storage.objects;
create policy "Users can update own photos"
on storage.objects for update
using (
  bucket_id = 'meal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos"
on storage.objects for delete
using (
  bucket_id = 'meal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

*/
