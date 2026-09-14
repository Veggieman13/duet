-- Duet partner-sharing schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> paste -> Run).

-- A couple links the tracker (who logs) with a partner (who follows along).
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid not null,
  partner_id uuid,
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

-- One snapshot of the tracker's cycle data per couple (full-state sync).
create table public.snapshots (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.couples enable row level security;
alter table public.snapshots enable row level security;

-- Couples: members can see their own couple row.
create policy "members read couple" on public.couples
  for select using (auth.uid() = tracker_id or auth.uid() = partner_id);

-- Couples: a tracker can create a couple for themselves (partner joins later).
create policy "tracker creates couple" on public.couples
  for insert with check (auth.uid() = tracker_id and partner_id is null);

-- Couples: either member can dissolve the couple (stop sharing).
create policy "members delete couple" on public.couples
  for delete using (auth.uid() = tracker_id or auth.uid() = partner_id);

-- Snapshots: only the tracker writes.
create policy "tracker inserts snapshot" on public.snapshots
  for insert with check (
    exists (select 1 from public.couples c
            where c.id = couple_id and c.tracker_id = auth.uid()));

create policy "tracker updates snapshot" on public.snapshots
  for update using (
    exists (select 1 from public.couples c
            where c.id = couple_id and c.tracker_id = auth.uid()));

-- Snapshots: both members read.
create policy "members read snapshot" on public.snapshots
  for select using (
    exists (select 1 from public.couples c
            where c.id = couple_id
              and (c.tracker_id = auth.uid() or c.partner_id = auth.uid())));

-- Invite redemption runs with elevated rights so a stranger-to-the-row can
-- claim the partner seat, but only via a valid unused code.
create or replace function public.redeem_invite(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  update public.couples
     set partner_id = auth.uid()
   where invite_code = upper(trim(code))
     and partner_id is null
     and tracker_id <> auth.uid()
  returning id into cid;
  if cid is null then
    raise exception 'invalid_or_used_code';
  end if;
  return cid;
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Pregnancy module
-- ---------------------------------------------------------------------------
-- Unlike cycle data, both partners write here: either of them can tick an item
-- off or leave a note. That rules out the single-blob snapshot used above — two
-- people editing one JSON document overwrite each other silently. One row per
-- item instead, so concurrent edits to different items simply don't collide,
-- and a write that fails to reach the server costs only that write.

-- Membership test shared by every policy below. security definer so it reads
-- couples directly rather than recursing through that table's own RLS; stable
-- so the planner evaluates it once per statement instead of once per row.
create or replace function public.is_couple_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.couples c
    where c.id = cid
      and (c.tracker_id = auth.uid() or c.partner_id = auth.uid())
  );
$$;

revoke all on function public.is_couple_member(uuid) from public;
grant execute on function public.is_couple_member(uuid) to authenticated;

-- Which pregnancy is being followed, and whether the module is switched on.
-- Either partner may correct the dates: the LMP shifts every derived week, and
-- a dating scan often revises it.
create table public.pregnancy_config (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  active boolean not null default false,
  lmp date not null,
  edd date not null,
  updated_at timestamptz not null default now(),
  updated_by uuid not null
);

-- Per-item status. item_id is a plan id from src/lib/pregnancy-plan.ts and is
-- deliberately not a foreign key — the plan ships in the app, not the database.
create table public.pregnancy_items (
  couple_id uuid not null references public.couples (id) on delete cascade,
  item_id text not null,
  status text not null check (status in ('none', 'scheduled', 'done')),
  scheduled_date date,
  place text,
  updated_at timestamptz not null default now(),
  updated_by uuid not null,
  primary key (couple_id, item_id)
);

-- One note per key, last-write-wins, not a thread. note_key is either a plan
-- item id or 'trimester-1' | 'trimester-2' | 'trimester-3'.
create table public.pregnancy_notes (
  couple_id uuid not null references public.couples (id) on delete cascade,
  note_key text not null,
  body text not null,
  author_id uuid not null,
  -- Snapshotted at write time so a later rename doesn't rewrite history.
  author_name text,
  updated_at timestamptz not null default now(),
  primary key (couple_id, note_key)
);

alter table public.pregnancy_config enable row level security;
alter table public.pregnancy_items enable row level security;
alter table public.pregnancy_notes enable row level security;

-- Config: both members read and write.
create policy "members read pregnancy config" on public.pregnancy_config
  for select using (public.is_couple_member(couple_id));
create policy "members insert pregnancy config" on public.pregnancy_config
  for insert with check (public.is_couple_member(couple_id) and updated_by = auth.uid());
create policy "members update pregnancy config" on public.pregnancy_config
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());

-- Items: both members read and write. The updated_by check stops either side
-- writing a row attributed to the other.
create policy "members read pregnancy items" on public.pregnancy_items
  for select using (public.is_couple_member(couple_id));
create policy "members insert pregnancy items" on public.pregnancy_items
  for insert with check (public.is_couple_member(couple_id) and updated_by = auth.uid());
create policy "members update pregnancy items" on public.pregnancy_items
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());
create policy "members delete pregnancy items" on public.pregnancy_items
  for delete using (public.is_couple_member(couple_id));

-- Notes: same shape, with authorship pinned to the writer.
create policy "members read pregnancy notes" on public.pregnancy_notes
  for select using (public.is_couple_member(couple_id));
create policy "members insert pregnancy notes" on public.pregnancy_notes
  for insert with check (public.is_couple_member(couple_id) and author_id = auth.uid());
create policy "members update pregnancy notes" on public.pregnancy_notes
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and author_id = auth.uid());
create policy "members delete pregnancy notes" on public.pregnancy_notes
  for delete using (public.is_couple_member(couple_id));
