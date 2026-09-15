-- Stripe billing, additional minutes, and server-only Google Calendar OAuth.

alter table public.businesses
  add column if not exists vapi_assistant_id text;

create table if not exists public.billing_accounts (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_plan_key text,
  billing_period text,
  purchased_minutes integer not null default 0 check (purchased_minutes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.billing_accounts enable row level security;
create policy "billing_accounts_select" on public.billing_accounts
  for select to authenticated using ((select private.owns_business(business_id)));

create or replace function public.add_purchased_minutes(bid uuid, additional_minutes integer)
returns void language sql security definer set search_path = public as $$
  insert into billing_accounts (business_id, purchased_minutes, updated_at)
  values (bid, greatest(additional_minutes, 0), now())
  on conflict (business_id) do update
    set purchased_minutes = billing_accounts.purchased_minutes + greatest(additional_minutes, 0),
        updated_at = now();
$$;
revoke execute on function public.add_purchased_minutes(uuid, integer) from public, anon, authenticated;

create table if not exists public.stripe_events (
  id text primary key,
  event_type text not null,
  business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

create table if not exists public.calendar_connections (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  provider text not null default 'google',
  calendar_id text not null default 'primary',
  calendar_email text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calendar_connections enable row level security;
-- Deliberately no client policy: OAuth tokens are service-role only.

alter table public.appointments
  add column if not exists external_calendar_event_id text,
  add column if not exists calendar_sync_status text not null default 'not_connected'
    check (calendar_sync_status in ('not_connected','pending','synced','failed'));

create unique index if not exists appointments_external_event_unique
  on public.appointments (business_id, external_calendar_event_id)
  where external_calendar_event_id is not null;
