-- ============================================================
-- ALREADY APPLIED to project kqcbmpkjoafxhqtbhyov on 2026-08-07
-- (migration name: leads_unique_call_id).
-- ============================================================

-- One lead per source call — makes webhook redelivery and double-clicks safe.
create unique index if not exists leads_call_id_unique
  on public.leads (call_id)
  where call_id is not null;
