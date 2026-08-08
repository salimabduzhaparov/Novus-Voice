-- ============================================================
-- ALREADY APPLIED to project kqcbmpkjoafxhqtbhyov on 2026-08-08
-- (migration name: assistant_plans_numbers_logos).
-- Assistant personalization, plan tiers, number requests, logos.
-- ============================================================

alter table public.businesses
  add column if not exists logo_url text,
  add column if not exists plan_key text not null default 'trial',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists assistant_config jsonb not null default '{}'::jsonb;

update public.businesses
  set trial_ends_at = now() + interval '14 days'
  where trial_ends_at is null;

create table public.number_requests (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  kind          text not null check (kind in ('new','port')),
  country       text not null default 'US',
  area_code     text,
  existing_e164 text,
  status        text not null default 'requested'
                check (status in ('requested','provisioning','live','cancelled')),
  notes         text,
  created_at    timestamptz not null default now()
);
create index number_requests_business_idx on public.number_requests (business_id, created_at desc);

alter table public.number_requests enable row level security;

create policy "number_requests_all" on public.number_requests
  for all to authenticated
  using ((select private.owns_business(business_id)))
  with check ((select private.owns_business(business_id)));

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (select private.owns_business(((storage.foldername(name))[1])::uuid))
  );

create policy "logos_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (select private.owns_business(((storage.foldername(name))[1])::uuid))
  )
  with check (
    bucket_id = 'logos'
    and (select private.owns_business(((storage.foldername(name))[1])::uuid))
  );

create policy "logos_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and (select private.owns_business(((storage.foldername(name))[1])::uuid))
  );
