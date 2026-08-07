-- ============================================================
-- Novus Voice — global readiness + demo-data flags
--
-- ALREADY APPLIED to project kqcbmpkjoafxhqtbhyov on 2026-08-07
-- (migration name: global_ready_and_samples). Kept as source of
-- truth for recreating the project elsewhere.
-- ============================================================

alter table public.businesses
  add column if not exists country text,                          -- ISO 3166-1 alpha-2
  add column if not exists currency text not null default 'USD',  -- ISO 4217
  add column if not exists language text not null default 'en',   -- BCP-47
  add column if not exists avg_job_value numeric(12,2);           -- in `currency`

alter table public.calls        add column if not exists is_sample boolean not null default false;
alter table public.leads        add column if not exists is_sample boolean not null default false;
alter table public.appointments add column if not exists is_sample boolean not null default false;
