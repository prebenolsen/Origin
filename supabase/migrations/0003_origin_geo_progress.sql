-- 0003_origin_geo_progress.sql
-- Per-user Geography Challenge progress: which region/country ids the learner
-- has already named, per board. Mirrors localStorage `origin:geo:v1`
-- (see src/lib/geoProgress.ts): Record<board, string[]>.

create table if not exists origin_geo_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  board      text not null,                 -- e.g. 'europe'
  solved     text[] not null default '{}',  -- region/country ids already named
  updated_at timestamptz not null default now(),
  primary key (user_id, board)
);

alter table origin_geo_progress enable row level security;

drop policy if exists own_rows on origin_geo_progress;
create policy own_rows on origin_geo_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
