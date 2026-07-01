# Deploying Origin to GitHub Pages

Origin is a static Vite + React SPA, so it deploys cleanly to **GitHub Pages**. The app
works fully as a guest with no backend; the optional Supabase login needs a couple of extra
settings (section 4).

**The deployment is already wired up** — the workflow file and the supporting config are
committed. To ship, you mostly just enable Pages and push (section 3). The plumbing is
described in sections 1–2 so you understand it and can adjust the repo name / hosting model.

> Two things make a Vite SPA on Pages non-trivial: (1) a **project page** is served from a
> sub-path (`https://<user>.github.io/<repo>/`), so the build needs a matching `base`; and
> (2) **client-side routes** (`/account`, `/learn/spanish`, …) 404 on refresh unless Pages
> is told to fall back to the app. Both are handled for you.

---

## 1. The Vite `base` (already set)

[`vite.config.ts`](../vite.config.ts) serves from the project sub-path only during the Pages
build, so local dev/preview stay at `/`:

```ts
base: process.env.GITHUB_PAGES ? '/Origin/' : '/',
```

The deploy workflow sets `GITHUB_PAGES=true`, so the built bundle references `/Origin/…`.

- **If your repo is not named `Origin`**, change `'/Origin/'` to `'/<your-repo>/'` (the base
  must match the repo name exactly, case-sensitive).
- **User/org page** (`<user>.github.io` repo) or a **custom domain** → set `base: '/'` and
  drop the `GITHUB_PAGES` env from the workflow; then skip the sub-path notes throughout.

## 2. Client-side routing on refresh (already handled)

The app uses `BrowserRouter`, and two pieces make deep links survive a hard refresh:

- **Router base path** — [`src/main.tsx`](../src/main.tsx) passes
  `basename={import.meta.env.BASE_URL}`, which is `/Origin/` in the Pages build and `/`
  everywhere else (no hardcoding).
- **404 fallback** — GitHub Pages serves `404.html` for any unknown path. The workflow copies
  the built `index.html` to `404.html`, so Pages hands every deep link to the SPA and the
  router renders the right route. (No redirect script needed — the copy loads the same
  absolute `/Origin/assets/…` bundles and the router reads `location.pathname`.)

## 3. Deploy with GitHub Actions

The workflow lives at [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). It
installs deps, builds with `GITHUB_PAGES=true`, writes the `404.html` fallback, and publishes
via `actions/deploy-pages`. To ship:

1. **Enable Pages:** repo → **Settings → Pages → Build and deployment → Source = GitHub
   Actions**.
2. **Push to `main`** (or run the workflow manually via **Actions → Deploy to GitHub Pages →
   Run workflow**).

The site publishes to `https://<user>.github.io/Origin/`. That's it for guest mode.

## 4. Optional: enable login/sync on the deployed site

Guest mode needs nothing here. To turn on Supabase accounts for the Pages build:

1. **Provide the env at build time.** GitHub Pages is static, so `VITE_*` values are baked in
   during the Actions build (see the `env:` block above). Add them under **repo → Settings →
   Secrets and variables → Actions → Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   The anon key is a **public** client key (data is protected by Row Level Security, see
   [`supabase/README.md`](../supabase/README.md)), so a repository *Variable* is fine; a
   *Secret* works too — just switch `${{ vars.* }}` to `${{ secrets.* }}` in the workflow.

2. **Add the Pages URL to Supabase Auth** (Authentication → URL Configuration):
   - **Site URL:** `https://<user>.github.io/Origin/`
   - **Redirect URLs:** add `https://<user>.github.io/Origin/` (and keep
     `http://localhost:5173` for local dev).

3. **Sub-path redirect (already handled in code).** Magic-link / signup emails must return to
   the app *including* the `/Origin/` sub-path. [`src/lib/auth.tsx`](../src/lib/auth.tsx)
   already builds `redirectTo` as `window.location.origin + import.meta.env.BASE_URL`, so this
   works under a sub-path with no further changes (and stays correct at `/` for a user/org
   page or custom domain).

## 5. Verify after deploy

- Open `https://<user>.github.io/Origin/` → the home screen loads.
- Hard-refresh a deep link, e.g. `.../Origin/learn/spanish` → still loads (404 fallback works).
- As a guest, complete a lesson, reload → progress persists (localStorage). No account needed.
- If Supabase is configured: the account button appears, sign-in works, and a magic link
  returns you to the app (confirms the redirect URL + sub-path handling).

## Notes

- Content and progress are unaffected by hosting: content is bundled JSON, guest state is
  localStorage, and signed-in state syncs to Supabase exactly as it does locally.
- A **custom domain** (repo → Settings → Pages → Custom domain) removes the sub-path
  entirely: set `base: '/'`, drop the `GITHUB_PAGES` flag from the workflow, and skip the
  sub-path caveats. Add a `public/CNAME` file with your domain so it survives redeploys.
