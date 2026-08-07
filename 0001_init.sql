-- ============================================================
-- Novus Voice — initial schema
--
-- ALREADY APPLIED to project kqcbmpkjoafxhqtbhyov on 2026-08-07.
-- Kept here as the source of truth / for recreating the project elsewhere.
-- Re-running against the same project will error on existing objects.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- businesses: one row per client (a roofer, plumber, HVAC co.)
-- owner_id links to the Supabase auth user who logs in.
-- ------------------------------------------------------------
create table public.businesses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  trade         text,
  timezone      text not null default 'America/New_York',
  forward_to    text,               -- number to warm-transfer to
  sms_from      text,               -- Twilio number used for follow-up SMS
  created_at    timestamptz not null default now()
);
create index on public.businesses (owner_id);

-- ------------------------------------------------------------
-- phone_numbers: the Twilio/Vapi numbers pointed at a business
-- ------------------------------------------------------------
create table public.phone_numbers (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  e164          text not null unique,     -- '+15551234567'
  vapi_number_id text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on public.phone_numbers (business_id);

-- ------------------------------------------------------------
-- calls: one row per inbound call
-- ------------------------------------------------------------
create type call_status as enum ('ringing','in_progress','completed','missed','failed');
create type call_outcome as enum ('booked','quote_requested','message_taken','spam','transferred','no_outcome');

create table public.calls (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  vapi_call_id    text unique,
  from_number     text,
  to_number       text,
  status          call_status not null default 'ringing',
  outcome         call_outcome not null default 'no_outcome',
  duration_seconds integer,
  recording_url   text,               -- store the URL, not the audio
  summary         text,
  cost_usd        numeric(10,4),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz
);
create index on public.calls (business_id, started_at desc);
create index on public.calls (vapi_call_id);

-- ------------------------------------------------------------
-- transcripts: turn-by-turn, one row per utterance
-- ------------------------------------------------------------
create table public.transcripts (
  id            bigserial primary key,
  call_id       uuid not null references public.calls(id) on delete cascade,
  role          text not null check (role in ('assistant','user','system')),
  content       text not null,
  seconds_in    numeric(8,2),
  created_at    timestamptz not null default now()
);
create index on public.transcripts (call_id, id);

-- ------------------------------------------------------------
-- leads: the thing the client actually cares about
-- ------------------------------------------------------------
create type lead_status as enum ('new','contacted','quoted','won','lost');

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  call_id       uuid references public.calls(id) on delete set null,
  name          text,
  phone         text,
  email         text,
  address       text,
  job_type      text,               -- 'roof leak', 'water heater'
  urgency       text,               -- 'emergency' | 'this week' | 'flexible'
  notes         text,
  status        lead_status not null default 'new',
  est_value_usd numeric(10,2),
  created_at    timestamptz not null default now()
);
create index on public.leads (business_id, created_at desc);

-- ------------------------------------------------------------
-- appointments
-- ------------------------------------------------------------
create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  lead_id       uuid references public.leads(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  address       text,
  confirmed     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index on public.appointments (business_id, starts_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- Without this, the public anon key can read every client's data.
-- ============================================================

alter table public.businesses   enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.calls        enable row level security;
alter table public.transcripts  enable row level security;
alter table public.leads        enable row level security;
alter table public.appointments enable row level security;

-- Helper lives in a PRIVATE schema so it is not callable via /rest/v1/rpc.
create schema if not exists private;

-- Helper: does the current user own this business?
create or replace function private.owns_business(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = bid and b.owner_id = (select auth.uid())
  );
$$;

revoke all on function private.owns_business(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.owns_business(uuid) to authenticated;

-- businesses: you see and edit only your own
create policy "own businesses: select" on public.businesses
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "own businesses: insert" on public.businesses
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "own businesses: update" on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "own businesses: delete" on public.businesses
  for delete to authenticated using (owner_id = (select auth.uid()));

-- everything else: scoped through the owning business
create policy "own phone_numbers" on public.phone_numbers
  for all to authenticated
  using (private.owns_business(business_id))
  with check (private.owns_business(business_id));

create policy "own calls" on public.calls
  for all to authenticated
  using (private.owns_business(business_id))
  with check (private.owns_business(business_id));

create policy "own leads" on public.leads
  for all to authenticated
  using (private.owns_business(business_id))
  with check (private.owns_business(business_id));

create policy "own appointments" on public.appointments
  for all to authenticated
  using (private.owns_business(business_id))
  with check (private.owns_business(business_id));

-- transcripts hang off calls, so join through
create policy "own transcripts" on public.transcripts
  for all to authenticated
  using (
    exists (
      select 1 from public.calls c
      where c.id = transcripts.call_id and private.owns_business(c.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.calls c
      where c.id = transcripts.call_id and private.owns_business(c.business_id)
    )
  );

-- ============================================================
-- Convenience view for the dashboard stats tiles
-- ============================================================
create or replace view public.call_stats
with (security_invoker = true) as
select
  business_id,
  count(*)                                            as total_calls,
  count(*) filter (where outcome = 'booked')          as booked,
  count(*) filter (where status  = 'missed')          as missed,
  coalesce(sum(duration_seconds), 0)                  as total_seconds
from public.calls
group by business_id;
