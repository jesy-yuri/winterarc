-- Winter Arc — Supabase schema (Phase 1: schema + Google OAuth auth)
--
-- HOW TO APPLY
-- 1. Supabase Dashboard > New project > copy Project URL + anon key
--    into .env.local as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
-- 2. Supabase Dashboard > SQL Editor > paste this whole file > Run.
-- 3. Authentication > Providers > enable Google > set Client ID/Secret
--    (Google Cloud Console > Credentials > OAuth client, authorized
--    redirect URI = https://<project-ref>.supabase.co/auth/v1/callback).
-- 4. Authentication > URL Configuration > Site URL = your Vercel URL,
--    Redirect URLs += http://localhost:5173/** for local dev.
-- 5. Storage > create bucket `avatars` (public) — or run the
--    storage insert at the bottom of this file.
--
-- NOTES
-- - Mirrors src/types/index.ts + src/lib/localStore.ts.
-- - members.user_id links a room member to auth.users.id (Google login).
--   One auth user can hold one member row per room.
-- - "Viewing as" (localStorage currentMemberByRoom) is NOT migrated:
--   prod resolves current member via (room_id, user_id) instead.
--   Local data stays on-device until the Phase-2 data migration lands.

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============ TABLES ============

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  -- Set after the owner member row is created (avoids circular FK on insert).
  owner_member_id uuid
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  nickname text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  avatar_url text,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, nickname)
);
create index if not exists members_room_idx on public.members (room_id);
create index if not exists members_user_idx on public.members (user_id);

-- Back-reference: room owner must be a member of that room.
alter table public.rooms
  drop constraint if exists rooms_owner_member_id_fkey;
alter table public.rooms
  add constraint rooms_owner_member_id_fkey
  foreign key (owner_member_id) references public.members (id) on delete set null;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  title text not null,
  icon text not null default '',
  target_count int,
  created_at timestamptz not null default now()
);
create index if not exists goals_room_idx on public.goals (room_id);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  goal_id text not null,
  date date not null,
  created_at timestamptz not null default now(),
  unique (member_id, goal_id, date)
);
create index if not exists check_ins_room_date_idx on public.check_ins (room_id, date);
create index if not exists check_ins_member_idx on public.check_ins (member_id);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  author_member_id uuid not null references public.members (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists announcements_room_idx on public.announcements (room_id);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  selections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (room_id, member_id)
);

create table if not exists public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  title text not null,
  description text,
  icon text,
  target_count int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists personal_goals_member_idx on public.personal_goals (member_id);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  title text not null,
  description text not null default '',
  start_date date not null,
  end_date date not null,
  created_by_member_id uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists challenges_room_idx on public.challenges (room_id);

create table if not exists public.challenge_joins (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, member_id)
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  week_key date not null,
  went_well text not null default '',
  improve text not null default '',
  updated_at timestamptz not null default now(),
  unique (member_id, week_key)
);

create table if not exists public.achievement_unlocks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (member_id, achievement_id)
);

-- Platform admins replace localStore platform.systemAdminMemberIds.
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now()
);

-- ============ HELPERS (RLS) ============

-- Is the caller a member of this room?
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
  );
$$;

-- Is the caller the owner (or an admin) of this room?
create or replace function public.is_room_owner(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

create or replace function public.is_room_admin(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

-- Does this member row belong to the caller?
create or replace function public.is_own_member(p_member_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.members m
    where m.id = p_member_id
      and m.user_id = auth.uid()
  );
$$;

-- ============ RLS ============

alter table public.rooms enable row level security;
alter table public.members enable row level security;
alter table public.goals enable row level security;
alter table public.check_ins enable row level security;
alter table public.announcements enable row level security;
alter table public.workout_plans enable row level security;
alter table public.personal_goals enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_joins enable row level security;
alter table public.reflections enable row level security;
alter table public.achievement_unlocks enable row level security;
alter table public.platform_admins enable row level security;

-- Rooms: members can read; any signed-in user can create (becomes owner);
-- only the owner can update/delete.
drop policy if exists "rooms_select_member" on public.rooms;
create policy "rooms_select_member" on public.rooms
  for select to authenticated
  using (public.is_room_member(id));

drop policy if exists "rooms_insert_auth" on public.rooms;
create policy "rooms_insert_auth" on public.rooms
  for insert to authenticated
  with check (true);

drop policy if exists "rooms_update_owner" on public.rooms;
create policy "rooms_update_owner" on public.rooms
  for update to authenticated
  using (public.is_room_owner(id));

drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner" on public.rooms
  for delete to authenticated
  using (public.is_room_owner(id));

-- Members: readable by fellow room members; users can join (insert own row);
-- users can edit their own row; owners manage roles/removal.
drop policy if exists "members_select_fellow" on public.members;
create policy "members_select_fellow" on public.members
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "members_insert_self" on public.members;
create policy "members_insert_self" on public.members
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "members_update_self_or_owner" on public.members;
create policy "members_update_self_or_owner" on public.members
  for update to authenticated
  using (
    public.is_own_member(id)
    or public.is_room_owner(room_id)
  );

drop policy if exists "members_delete_owner" on public.members;
create policy "members_delete_owner" on public.members
  for delete to authenticated
  using (public.is_room_owner(room_id));

-- Goals: readable by members; admins manage.
drop policy if exists "goals_select_member" on public.goals;
create policy "goals_select_member" on public.goals
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "goals_write_admin" on public.goals;
create policy "goals_write_admin" on public.goals
  for all to authenticated
  using (public.is_room_admin(room_id))
  with check (public.is_room_admin(room_id));

-- Check-ins: readable by members; users write only their own rows.
drop policy if exists "check_ins_select_member" on public.check_ins;
create policy "check_ins_select_member" on public.check_ins
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "check_ins_insert_own" on public.check_ins;
create policy "check_ins_insert_own" on public.check_ins
  for insert to authenticated
  with check (public.is_own_member(member_id));

drop policy if exists "check_ins_delete_own" on public.check_ins;
create policy "check_ins_delete_own" on public.check_ins
  for delete to authenticated
  using (public.is_own_member(member_id));

-- Announcements: readable by members; admins send.
drop policy if exists "announcements_select_member" on public.announcements;
create policy "announcements_select_member" on public.announcements
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "announcements_write_admin" on public.announcements;
create policy "announcements_write_admin" on public.announcements
  for all to authenticated
  using (public.is_room_admin(room_id))
  with check (public.is_room_admin(room_id));

-- Workout plans: readable by members; users manage only their own.
drop policy if exists "workout_plans_select_member" on public.workout_plans;
create policy "workout_plans_select_member" on public.workout_plans
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "workout_plans_write_own" on public.workout_plans;
create policy "workout_plans_write_own" on public.workout_plans
  for all to authenticated
  using (public.is_own_member(member_id))
  with check (public.is_own_member(member_id));

-- Personal goals: users manage only their own.
drop policy if exists "personal_goals_own" on public.personal_goals;
create policy "personal_goals_own" on public.personal_goals
  for all to authenticated
  using (public.is_own_member(member_id))
  with check (public.is_own_member(member_id));

-- Challenges: readable by members; any member can create; creator/admin edits.
drop policy if exists "challenges_select_member" on public.challenges;
create policy "challenges_select_member" on public.challenges
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists "challenges_insert_member" on public.challenges;
create policy "challenges_insert_member" on public.challenges
  for insert to authenticated
  with check (
    public.is_room_member(room_id)
    and public.is_own_member(created_by_member_id)
  );

drop policy if exists "challenges_update_creator_admin" on public.challenges;
create policy "challenges_update_creator_admin" on public.challenges
  for update to authenticated
  using (
    public.is_own_member(created_by_member_id)
    or public.is_room_admin(room_id)
  );

drop policy if exists "challenges_delete_creator_admin" on public.challenges;
create policy "challenges_delete_creator_admin" on public.challenges
  for delete to authenticated
  using (
    public.is_own_member(created_by_member_id)
    or public.is_room_admin(room_id)
  );

-- Challenge joins: readable by members; users join/leave for themselves.
drop policy if exists "challenge_joins_select_member" on public.challenge_joins;
create policy "challenge_joins_select_member" on public.challenge_joins
  for select to authenticated
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_joins.challenge_id
        and public.is_room_member(c.room_id)
    )
  );

drop policy if exists "challenge_joins_write_own" on public.challenge_joins;
create policy "challenge_joins_write_own" on public.challenge_joins
  for all to authenticated
  using (public.is_own_member(member_id))
  with check (public.is_own_member(member_id));

-- Reflections: users manage only their own.
drop policy if exists "reflections_own" on public.reflections;
create policy "reflections_own" on public.reflections
  for all to authenticated
  using (public.is_own_member(member_id))
  with check (public.is_own_member(member_id));

-- Achievement unlocks: users manage only their own.
drop policy if exists "achievement_unlocks_own" on public.achievement_unlocks;
create policy "achievement_unlocks_own" on public.achievement_unlocks
  for all to authenticated
  using (public.is_own_member(member_id))
  with check (public.is_own_member(member_id));

-- Platform admins: anyone can read the list (needed for admin gates);
-- only existing admins can grant/revoke. Bootstrap the first admin
-- manually in the dashboard (insert your auth user id).
drop policy if exists "platform_admins_select" on public.platform_admins;
create policy "platform_admins_select" on public.platform_admins
  for select to authenticated
  using (true);

drop policy if exists "platform_admins_write_admin" on public.platform_admins;
create policy "platform_admins_write_admin" on public.platform_admins
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
  );

-- ============ AVATAR STORAGE ============
-- Run in SQL Editor (storage schema), or create via Dashboard > Storage.
-- insert into storage.buckets (id, name, public)
-- values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
--
-- Policy sketch (Storage > avatars > Policies):
-- - SELECT: public read (bucket is public).
-- - INSERT/UPDATE/DELETE: authenticated, path starts with auth.uid().
--   Suggested path: avatars/<auth.uid()>/<filename>.
