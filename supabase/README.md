# Supabase (Origin backend)

Origin works fully offline as a guest with **no** backend. Supabase is the
**optional** sync layer: when a user signs in, their learner state is mirrored to
these tables so it follows them across devices, and every Spanish answer is logged
so skill/mastery can be tracked over time.

All tables are prefixed `origin_`. Language tables are per-language
(`origin_language_spanish_*`). Every table has Row Level Security enabled and an
owner-only policy (`user_id = auth.uid()`), so the public anon key is safe in the
client — RLS is what protects the data.

## What you need

1. A Supabase project (https://supabase.com).
2. The project **URL** and **anon key** (Project Settings → API). Put them in the
   app's `.env` (see `.env.example` in the repo root):

   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

   If these are absent the app runs in pure guest/local mode (no network).

## Running the migrations

Apply the files under `migrations/` **in numeric order**.

### Option A — SQL editor (simplest)

Open the Supabase dashboard → SQL editor, then paste and run each file in order:

1. `0001_origin_profile.sql`
2. `0002_origin_module_progress.sql`
3. `0003_origin_geo_progress.sql`
4. `0004_origin_language_spanish.sql`

Each file is idempotent (`if not exists` / `drop policy if exists`), so re-running
is safe.

### Option B — Supabase CLI

```bash
supabase link --project-ref <ref>
supabase db push
```

## Tables created

| Table | Mirrors (localStorage) |
|-------|------------------------|
| `origin_profile` | app-level profile (display name) |
| `origin_module_progress` | `origin:progress:v1` |
| `origin_geo_progress` | `origin:geo:v1` |
| `origin_language_spanish_profile` | `origin:lang:spanish:profile:v1` |
| `origin_language_spanish_vocab_state` | `origin:lang:spanish:vocab:v1` (per word) |
| `origin_language_spanish_review_event` | `review_history[]` (append-only, per answer) |

## Auth

Email/password and magic-link are enabled by default in Supabase. For magic link
and signup confirmation emails to work, set the **Site URL** and any additional
**Redirect URLs** under Authentication → URL Configuration (e.g. `http://localhost:5173`
for dev and your production URL).

Deploying to GitHub Pages? See [`docs/deployment.md`](../docs/deployment.md) for the
Pages-specific redirect URL, sub-path, and build-time env details.

## Adding a new persisted store later

1. Add an `origin_`-prefixed table + owner-only RLS here (new numbered migration).
2. Add a mapper (local shape ↔ row) and a merge function in `src/lib/sync/`.
3. Make the local store emit a change event and register it in `syncManager.ts`.
