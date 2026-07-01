-- 0002_origin_module_progress.sql
-- Per-user progress for the non-language modules (history/science/politics/…).
-- Mirrors the localStorage store `origin:progress:v1` (see src/lib/progress.ts):
--   Record<path, { stages: Stage[], quizScore?: number, updated: number }>
-- One row per (user, module path), where `path` is `category/subcategory/module`.

create table if not exists origin_module_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  path       text not null,                 -- e.g. 'history/ancient-rome/caesar'
  stages     text[] not null default '{}',  -- subset of intro|story|quiz|flashcards
  quiz_score real,                           -- best score as a 0..1 fraction
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

alter table origin_module_progress enable row level security;

drop policy if exists own_rows on origin_module_progress;
create policy own_rows on origin_module_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
