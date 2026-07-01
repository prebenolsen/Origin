-- 0001_origin_profile.sql
-- App-level profile row, one per authenticated user.
-- Identity itself lives in Supabase Auth (auth.users); this table only holds
-- app-facing profile fields. All Origin tables are prefixed `origin_`.

create table if not exists origin_profile (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Row Level Security: a user can only see/modify their own row.
alter table origin_profile enable row level security;

drop policy if exists own_rows on origin_profile;
create policy own_rows on origin_profile
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
