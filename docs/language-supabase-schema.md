# Languages (Spanish) — Supabase schema

> **Status: implemented.** The canonical, runnable DDL now lives in
> [`supabase/migrations/0004_origin_language_spanish.sql`](../supabase/migrations/0004_origin_language_spanish.sql)
> (see also `supabase/README.md`). This document is the design reference and is kept in
> sync with those migrations.

The Spanish learning domain keeps localStorage as its source of truth (offline-first). When
a learner signs in, the optional sync layer (`src/lib/sync/**`) mirrors this state to the
`origin_language_spanish_*` tables. The shapes map 1:1 onto the tables below.

> Content (languages, chapters, modules, vocabulary, lessons) stays in versioned JSON under
> `src/content/languages/**` — it is *not* in the database. The database only holds
> per-user *state*.

## Mapping

| In-app (localStorage)                         | Supabase table                          |
|-----------------------------------------------|------------------------------------------|
| `origin:lang:spanish:profile:v1`              | `origin_language_spanish_profile`        |
| `origin:lang:spanish:vocab:v1` (per word)     | `origin_language_spanish_vocab_state`    |
| (derived from `review_history`)               | `origin_language_spanish_review_event`   |

`user_id` comes from Supabase Auth (`auth.uid()`), which replaces today's
device-local store. Until auth is added, the app keys everything to the browser.

## DDL

```sql
-- One row per learner: chosen chapter + personalized picks + their own details.
create table origin_language_spanish_profile (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  chapter      text,                       -- e.g. 'visiting-spain'
  learner      jsonb,                       -- { name, city, country, countryEs, age } (onboarding)
  selections   jsonb not null default '{}',-- { moduleSlug: VocabOption[] }
  completed    text[] not null default '{}',
  checkpoints  text[] not null default '{}',-- e.g. 'visiting-spain:4'
  updated_at   timestamptz not null default now()
);

-- One row per (learner, word). `id` is the normalized Spanish word (see vocabId()).
create table origin_language_spanish_vocab_state (
  user_id        uuid not null references auth.users (id) on delete cascade,
  id             text not null,            -- normalized es, e.g. 'pepino'
  es             text not null,
  en             text not null,
  category       text,
  module         text not null,            -- e.g. 'spanish/supermarket'
  introduced_at  timestamptz not null default now(),
  times_seen     int  not null default 0,  -- batches/cards the word was shown in
  attempts       int  not null default 0,  -- times_tested
  correct        int  not null default 0,
  incorrect      int  not null default 0,
  streak         int  not null default 0,
  max_correct_level int not null default 0, -- highest level recalled (gates "strong")
  interval_days  int  not null default 0,  -- SM-2 interval
  ease           real not null default 2.5,-- SM-2 ease factor
  last_review    timestamptz,
  last_correct   timestamptz,
  next_review    timestamptz not null default now(),
  review_history jsonb not null default '[]', -- client working copy (capped ~50)
  updated_at     timestamptz not null default now(),
  primary key (user_id, id)
);

-- Append-only review attempts (today kept inline as review_history[]).
create type origin_language_spanish_question_type as enum (
  'spanish_to_english',  -- choose-meaning
  'english_to_spanish',  -- choose-word / produce
  'multiple_choice',
  'context'              -- fill-blank
);

create table origin_language_spanish_review_event (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  vocab_id      text not null,
  question_type origin_language_spanish_question_type,
  correct       boolean not null,
  at            timestamptz not null default now()
);

create index on origin_language_spanish_vocab_state (user_id, next_review);
create index on origin_language_spanish_review_event (user_id, vocab_id);
```

## Row Level Security

Every table is per-user; enable RLS and restrict to the owner:

```sql
alter table origin_language_spanish_profile      enable row level security;
alter table origin_language_spanish_vocab_state  enable row level security;
alter table origin_language_spanish_review_event enable row level security;

create policy own_rows on origin_language_spanish_profile
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- repeat the same policy for the other two tables.
```

## How it is wired (implemented)

`src/lib/language/srs.ts` and `profile.ts` remain the only modules that touch storage, and
they are **unchanged** — localStorage stays the source of truth. Instead of rewriting their
`read`/`write` helpers, an offline-first sync layer (`src/lib/sync/**`) listens to the
`origin:lang` change event they already dispatch and, when a user is signed in and online,
mirrors the state to the tables above (pull + union-merge on sign-in, debounced upsert on
change, manual "Save now"). See the **Backend / Auth / Sync** section in
[`docs/architecture.md`](architecture.md). No UI/learning-screen changes were required.
