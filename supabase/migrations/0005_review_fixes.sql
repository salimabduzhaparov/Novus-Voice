-- ============================================================
-- ALREADY APPLIED to project kqcbmpkjoafxhqtbhyov on 2026-08-08
-- (migration name: review_fixes_trial_default_constraints).
-- Fixes from the adversarial review pass.
-- ============================================================

-- New signups get a real trial countdown (Onboarding also sets it explicitly)
alter table public.businesses
  alter column trial_ends_at set default (now() + interval '14 days');

-- Only sane plan keys
alter table public.businesses
  add constraint businesses_plan_key_check
  check (plan_key in ('trial','solo','crew','fleet'));

-- One open number request per business at a time
create unique index if not exists number_requests_one_open
  on public.number_requests (business_id)
  where status in ('requested','provisioning');

-- Month-to-date minutes, summed in the database (no row cap).
-- SECURITY INVOKER: RLS on calls applies, callers only sum their own rows.
create or replace function public.minutes_this_month(bid uuid, sample boolean)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(round(sum(duration_seconds) / 60.0), 0)::int
  from public.calls
  where business_id = bid
    and is_sample = sample
    and started_at >= date_trunc('month', now());
$$;

revoke execute on function public.minutes_this_month(uuid, boolean) from public, anon;
grant execute on function public.minutes_this_month(uuid, boolean) to authenticated;
