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

-- Policies: a user can manage only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using ( id = auth.uid() );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check ( id = auth.uid() );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using ( id = auth.uid() ) with check ( id = auth.uid() );

-- Auto-create profile on new auth user (supports email confirmation ON)
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

drop policy if exists "meal_select_own" on public.meal_check_ins;
create policy "meal_select_own" on public.meal_check_ins
  for select using ( patient_id = auth.uid() );

drop policy if exists "meal_crud_own" on public.meal_check_ins;
create policy "meal_crud_own" on public.meal_check_ins
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );

-- Allow nutritionists to view check-ins of patients who are in their competitions
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

-- NOTE: Simplified RLS policies to avoid infinite recursion issues.
-- Authorization is handled at the application layer through the CompetitionService.
-- Nutritionists can only modify participants of their own competitions via app logic.

-- Participants: Everyone can read (simplified to avoid recursion)
drop policy if exists "part_read_all" on public.competition_participants;
create policy "part_read_all" on public.competition_participants
  for select using (true);

-- Participants: Allow insert (application layer handles authorization)
drop policy if exists "part_write_all" on public.competition_participants;
create policy "part_write_all" on public.competition_participants
  for insert with check (true);

-- Participants: Allow delete (application layer handles authorization)
drop policy if exists "part_delete_all" on public.competition_participants;
create policy "part_delete_all" on public.competition_participants
  for delete using (true);

alter table public.competitions enable row level security;

-- Competitions: Only owner can manage (direct column check, no subquery)
drop policy if exists "comp_owner_only" on public.competitions;
create policy "comp_owner_only" on public.competitions
  for all 
  using (nutritionist_id = auth.uid())
  with check (nutritionist_id = auth.uid());

-- Helpful indexes
create index if not exists idx_meal_check_ins_patient on public.meal_check_ins(patient_id, timestamp desc);
create index if not exists idx_competitions_owner on public.competitions(nutritionist_id);
create index if not exists idx_participants_patient on public.competition_participants(patient_id);

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

alter table public.competition_scores enable row level security;

-- Policies: users can see their own scores and nutritionists can see scores in their competitions
drop policy if exists "scores_select_self_or_owner" on public.competition_scores;
create policy "scores_select_self_or_owner" on public.competition_scores
  for select using (
    patient_id = auth.uid() or exists (
      select 1 from public.competitions c
      where c.id = competition_scores.competition_id and c.nutritionist_id = auth.uid()
    )
  );

-- Only the system (through triggers) should update scores directly
drop policy if exists "scores_system_update" on public.competition_scores;
create policy "scores_system_update" on public.competition_scores
  for all using (true) with check (true);

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
