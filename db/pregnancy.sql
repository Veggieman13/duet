-- Duet pregnancy module schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> paste -> Run).
-- Requires db/schema.sql to have been run first (it references public.couples).
--
-- Safe to run more than once: every statement is create-if-not-exists or
-- create-or-replace, and each policy is dropped before being recreated. If a
-- run fails halfway — a dropped phone connection, a mistyped paste — just run
-- the whole thing again.
--
-- Unlike cycle data, both partners write here: either of them can tick an item
-- off or leave a note. That rules out the single-blob snapshot the cycle uses —
-- two people editing one JSON document overwrite each other silently. One row
-- per item instead, so concurrent edits to different items don't collide, and a
-- write that fails to reach the server costs only that write.

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
create table if not exists public.pregnancy_config (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  active boolean not null default false,
  lmp date not null,
  edd date not null,
  updated_at timestamptz not null default now(),
  updated_by uuid not null
);

-- Per-item status. item_id is a plan id from src/lib/pregnancy-plan.ts and is
-- deliberately not a foreign key — the plan ships in the app, not the database.
create table if not exists public.pregnancy_items (
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
create table if not exists public.pregnancy_notes (
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
drop policy if exists "members read pregnancy config" on public.pregnancy_config;
create policy "members read pregnancy config" on public.pregnancy_config
  for select using (public.is_couple_member(couple_id));

drop policy if exists "members insert pregnancy config" on public.pregnancy_config;
create policy "members insert pregnancy config" on public.pregnancy_config
  for insert with check (public.is_couple_member(couple_id) and updated_by = auth.uid());

drop policy if exists "members update pregnancy config" on public.pregnancy_config;
create policy "members update pregnancy config" on public.pregnancy_config
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());

-- Items: both members read and write. The updated_by check stops either side
-- writing a row attributed to the other.
drop policy if exists "members read pregnancy items" on public.pregnancy_items;
create policy "members read pregnancy items" on public.pregnancy_items
  for select using (public.is_couple_member(couple_id));

drop policy if exists "members insert pregnancy items" on public.pregnancy_items;
create policy "members insert pregnancy items" on public.pregnancy_items
  for insert with check (public.is_couple_member(couple_id) and updated_by = auth.uid());

drop policy if exists "members update pregnancy items" on public.pregnancy_items;
create policy "members update pregnancy items" on public.pregnancy_items
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());

drop policy if exists "members delete pregnancy items" on public.pregnancy_items;
create policy "members delete pregnancy items" on public.pregnancy_items
  for delete using (public.is_couple_member(couple_id));

-- Notes: same shape, with authorship pinned to the writer.
drop policy if exists "members read pregnancy notes" on public.pregnancy_notes;
create policy "members read pregnancy notes" on public.pregnancy_notes
  for select using (public.is_couple_member(couple_id));

drop policy if exists "members insert pregnancy notes" on public.pregnancy_notes;
create policy "members insert pregnancy notes" on public.pregnancy_notes
  for insert with check (public.is_couple_member(couple_id) and author_id = auth.uid());

drop policy if exists "members update pregnancy notes" on public.pregnancy_notes;
create policy "members update pregnancy notes" on public.pregnancy_notes
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and author_id = auth.uid());

drop policy if exists "members delete pregnancy notes" on public.pregnancy_notes;
create policy "members delete pregnancy notes" on public.pregnancy_notes
  for delete using (public.is_couple_member(couple_id));

-- Did it work? This should return three rows, each with rls = true.
select tablename, rowsecurity as rls
from pg_tables
where schemaname = 'public'
  and tablename like 'pregnancy%'
order by tablename;
