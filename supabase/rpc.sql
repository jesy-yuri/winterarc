-- Winter Arc — RPC helpers (Phase 2: account-bound data)
--
-- HOW TO APPLY
-- Supabase Dashboard > SQL Editor > paste this whole file > Run.
-- (Run AFTER supabase/schema.sql.)
--
-- WHY THIS EXISTS
-- RLS only lets members read a room, so a newcomer cannot look up a room
-- by invite code before joining. These SECURITY DEFINER functions perform
-- the lookup + join server-side with validation, without opening room
-- reads to every signed-in user.

-- Join a room by invite code. Idempotent: if this auth user already has a
-- member row in the room, it is returned instead of creating a duplicate.
-- Raises: 'Not signed in.' | 'Room code not found.' |
--         'Nickname is taken in this room.' | 'Please enter a nickname.'
create or replace function public.join_room(p_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_code, '')));
  v_name text := trim(coalesce(p_nickname, ''));
  v_room public.rooms%rowtype;
  v_existing public.members%rowtype;
  v_member public.members%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;
  if v_name = '' then
    raise exception 'Please enter a nickname.';
  end if;

  select * into v_room from public.rooms where invite_code = v_code;
  if not found then
    raise exception 'Room code not found.';
  end if;

  -- Already a member with this account? Return it (re-join, new device…).
  select * into v_existing from public.members
    where room_id = v_room.id and user_id = v_uid;
  if found then
    return to_jsonb(v_existing);
  end if;

  -- Nickname taken by someone else?
  if exists (
    select 1 from public.members
    where room_id = v_room.id and lower(nickname) = lower(v_name)
  ) then
    raise exception 'Nickname is taken in this room.';
  end if;

  insert into public.members (room_id, user_id, nickname, role)
  values (v_room.id, v_uid, v_name, 'member')
  returning * into v_member;
  return to_jsonb(v_member);
end;
$$;

grant execute on function public.join_room(text, text) to authenticated;
