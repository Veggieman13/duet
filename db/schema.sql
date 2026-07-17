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
