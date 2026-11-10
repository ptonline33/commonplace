# Commonplace

**Live:** [commonplace-notes.vercel.app](https://commonplace-notes.vercel.app) · **Source:** [github.com/ptonline33/commonplace](https://github.com/ptonline33/commonplace)

A small, offline-first **general blog PWA**. The journal has no niche: essays, field guides, city notes, how-tos and detours. Issue 01 happens to be a fully researched guide to the best pool halls in the Greater Toronto Area — that's a post, not the theme.

## Visual language

A fresh editorial light/dark theme with a single oxide-red accent:

- **Light** warm paper `#f7f5f0` / ink `#1b1c20`; **dark** charcoal `#141518` / cream `#f5f3ee`.
- One accent colour (`#b23a2b` light, `#f08068` dark) used for links, rules, buttons and active states.
- **Atkinson Hyperlegible** for UI + **Literata** for display headings, with Lexend/Lora as reader options. All fonts are self-hosted `.woff2` files from the Readalong project, so the PWA works with no network.
- Follows the OS light/dark preference, with a manual toggle in the header that persists.

## What's inside

```
index.html               app shell (hash router: #/, #/post/:slug, #/about)
styles.css               editorial light/dark theme
app.js                   router, block renderer, appearance + reader prefs, claps, install
config.js                public Supabase URL/anon key (safe to ship)
manifest.webmanifest     install metadata + shortcut to the first post
sw.js                    offline-first service worker (precaches the whole journal)
fonts/                   Atkinson, Literata, Lexend, Lora (woff2, from Readalong)
icons/                   192 / 512 / maskable / apple-touch (generated C monogram)
posts/index.json         post catalog (metadata)
posts/*.json             post bodies as typed content blocks
supabase/schema.sql      blog_posts + blog_reactions tables with RLS
supabase/seed.sql        optional seeds for the bundled posts
api/posts.js             Vercel function: published posts from Supabase
api/reactions.js         Vercel function: clap counts + inserts
tools/make-icons.py      dependency-free PNG icon generator
```

## Run it locally

No build step, no dependencies:

```bash
cd commonplace
python3 -m http.server 8080
# open http://localhost:8080
```

The `/api/*` routes only exist on Vercel. Locally the app uses the bundled posts and keeps claps in `localStorage`, so everything still works.

## PWA features

- Installable (`beforeinstallprompt` + manifest shortcuts), standalone display.
- Full offline support: the shell, fonts, icons, catalog and all post JSON are precached on install; navigation falls back to `index.html` when offline.
- Network-first shell so new posts appear without a hard refresh; `/api/*` is network-only so cloud data never goes stale.
- Reader controls: font family (Atkinson / Literata / Lexend / Lora) and A− / A+ text size, all persisted. Appearance (system / light / dark) is controlled from the header.
- Reading progress bar, sticky table of contents with scroll spy, clap reactions, share, offline badge.
- Shareable deep links into a post: `#/post/<slug>/<section-id>` (e.g. `#/post/best-pool-halls-gta/corner-bank`).

## Adding a post

1. Create `posts/<slug>.json` with a `blocks` array. Supported block types: `h2` (with `id`), `h3`, `lead`, `p`, `ul`, `ol`, `checklist`, `quote`, `callout`, `divider`, `stats`, `route`, `venue`, `sources`. Inline text supports `**bold**`, `*em*`, `` `code` `` and `[label](url)`.
2. Add an entry to `posts/index.json` (`accent` is an array with one colour).
3. Add the new file to the `SHELL` array in `sw.js` and bump `VERSION` so it works offline immediately.

Or, once Supabase is connected, insert a row into `blog_posts` with the full block array in `body` (no repo file and no redeploy needed). The client merges cloud posts over the bundled catalog.

## Supabase setup

The project is wired to the Supabase project whose public URL/anon key is in `config.js`. That key is **public by design** — anon can only read published posts, read clap counts and insert a clap (see `supabase/schema.sql`).

1. Open your Supabase project → **SQL Editor**.
2. Run `supabase/schema.sql` (creates `blog_posts` and `blog_reactions` with RLS, then reloads PostgREST).
3. Optionally run `supabase/seed.sql` to publish issue 01's metadata.
4. In Vercel → Project Settings → Environment Variables, add:
   - `SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY` = the anon/publishable key
   - (optional) `SUPABASE_SERVICE_ROLE_KEY`
5. Redeploy. `/api/posts` returns `{"ok":true,"source":"supabase",...}` once connected, and `{"ok":false,"source":"unconfigured"}` otherwise.

Until the tables exist the site is fully functional with bundled posts and local claps.

## GitHub + Vercel

- Repository: `github.com/ptonline33/commonplace` (branch `main`).
- Deployment: Vercel project `commonplace` in team `omarchy1`, static site + zero-config Node functions in `api/`.
- The project is linked to the GitHub repo: every push to `main` deploys production automatically (this avoids the account's CLI email-OTP challenge on manual deploys).
- Production URLs: `commonplace-notes.vercel.app` (canonical) and the automatic `commonplace-omarchy1.vercel.app`. The short `commonplace.vercel.app` belongs to someone else, so the `*-notes` alias was added. Deployment SSO protection was disabled for this project so the public blog is reachable without a Vercel login.

## Content note

Venue hours, rates and addresses in issue 01 were researched from the rooms' own websites and published listings in November 2026 (sources are listed at the bottom of the guide). **They change.** Call ahead before a long trip — the guide says so too.
