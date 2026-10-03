-- Layer 2: background push subscriptions (Step 3: paste + Run in Supabase SQL Editor)
--
-- Stores one Web Push subscription per member per device.
-- member_id -> public.members(id). endpoint is globally unique per browser.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (member_id, endpoint)
);

create index if not exists push_subscriptions_member_idx
  on public.push_subscriptions (member_id);

-- RLS: a signed-in user manages only subscriptions for their own member rows.
alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (
    exists (
      select 1 from public.members m
      where m.id = push_subscriptions.member_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (
    exists (
      select 1 from public.members m
      where m.id = push_subscriptions.member_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (
    exists (
      select 1 from public.members m
      where m.id = push_subscriptions.member_id
        and m.user_id = auth.uid()
    )
  );
