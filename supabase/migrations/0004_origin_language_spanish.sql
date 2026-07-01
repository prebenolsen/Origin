-- 0004_origin_language_spanish.sql
-- Per-user Spanish learning state. Language content stays in versioned JSON
-- under src/content/languages/spanish/** — the database only holds per-user
-- *state*. Language tables are per-language and prefixed
-- `origin_language_spanish_`.
--
-- Mirrors:
--   origin:lang:spanish:profile:v1  -> origin_language_spanish_profile
--   origin:lang:spanish:vocab:v1    -> origin_language_spanish_vocab_state
--   review_history[] (per word)     -> origin_language_spanish_review_event

-- One row per learner: chosen chapter, learner details, personalization picks,
-- and completion/checkpoint progress.
create table if not exists origin_language_spanish_profile (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  chapter     text,                          -- e.g. 'visiting-spain'
  learner     jsonb,                          -- { name, city, country, countryEs, age }
  selections  jsonb  not null default '{}',   -- { moduleSlug: VocabOption[] }
  completed   text[] not null default '{}',   -- completed module slugs
  checkpoints text[] not null default '{}',   -- e.g. 'visiting-spain:4'
  updated_at  timestamptz not null default now()
);

-- One row per (learner, word). `id` is the normalized Spanish word (vocabId()).
create table if not exists origin_language_spanish_vocab_state (
  user_id           uuid not null references auth.users (id) on delete cascade,
  id                text not null,             -- normalized es, e.g. 'pepino'
  es                text not null,
  en                text not null,
  category          text,
  module            text not null,             -- e.g. 'spanish/supermarket'
  introduced_at     timestamptz not null default now(),
  times_seen        int  not null default 0,   -- shown/introduced count
  attempts          int  not null default 0,   -- times tested
  correct           int  not null default 0,
  incorrect         int  not null default 0,
  streak            int  not null default 0,
  max_correct_level int  not null default 0,   -- highest level recalled (gates "strong")
  interval_days     real not null default 0,   -- SM-2 interval (fractional days)
  ease              real not null default 2.5, -- SM-2 ease factor
  last_review       timestamptz,
  last_correct      timestamptz,
  next_review       timestamptz not null default now(),
  review_history    jsonb not null default '[]', -- client working copy, capped ~50
  updated_at        timestamptz not null default now(),
  primary key (user_id, id)
);

-- Append-only review attempts (kept inline as review_history[] on the client).
-- This log powers "skills measured over time".
do $$
begin
  if not exists (select 1 from pg_type where typname = 'origin_language_spanish_question_type') then
    create type origin_language_spanish_question_type as enum (
      'spanish_to_english',  -- choose-meaning (level 1)
      'english_to_spanish',  -- choose-word / produce (level 2/4)
      'multiple_choice',
      'context'              -- fill-blank (level 3)
    );
  end if;
end$$;

create table if not exists origin_language_spanish_review_event (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  vocab_id      text not null,
  question_type origin_language_spanish_question_type,
  level         int,                           -- 1=recognise … 4=produce
  correct       boolean not null,
  at            timestamptz not null default now()
);

create index if not exists origin_language_spanish_vocab_state_due_idx
  on origin_language_spanish_vocab_state (user_id, next_review);
create index if not exists origin_language_spanish_review_event_vocab_idx
  on origin_language_spanish_review_event (user_id, vocab_id);
create index if not exists origin_language_spanish_review_event_at_idx
  on origin_language_spanish_review_event (user_id, at);
-- Dedupe guard so re-pushing the same answer (same device or across devices) is a no-op.
create unique index if not exists origin_language_spanish_review_event_uniq
  on origin_language_spanish_review_event (user_id, vocab_id, at);

-- Row Level Security: owner-only on all three tables.
alter table origin_language_spanish_profile      enable row level security;
alter table origin_language_spanish_vocab_state  enable row level security;
alter table origin_language_spanish_review_event enable row level security;

drop policy if exists own_rows on origin_language_spanish_profile;
create policy own_rows on origin_language_spanish_profile
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_rows on origin_language_spanish_vocab_state;
create policy own_rows on origin_language_spanish_vocab_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_rows on origin_language_spanish_review_event;
create policy own_rows on origin_language_spanish_review_event
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
