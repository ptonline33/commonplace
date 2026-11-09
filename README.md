# Chalk & Cue

A small, offline-first **blog PWA** about playing pool in the Greater Toronto Area. Issue 01 is a full field guide to seven GTA pool halls — addresses, hours, table rates, transit, etiquette and three buildable pool crawls.

The visual language is lifted from the **Readalong** project: self-hosted **Atkinson Hyperlegible**, a `#0b0820` indigo base, yellow → pink → cyan gradients, pill buttons, glassy sticky header and soft glows — with a modern editorial layout on top.

## What's inside

```
index.html               app shell (hash router: #/, #/post/:slug, #/about)
styles.css               Readalong theme + editorial article styles
app.js                   router, block renderer, reader prefs, claps, install prompt
config.js                public Supabase URL/anon key (safe to ship)
manifest.webmanifest     install metadata + shortcut to the field guide
sw.js                    offline-first service worker (precaches the whole guide)
fonts/                   Atkinson, Literata, Lexend, Lora (woff2, from Readalong)
icons/                   192 / 512 / maskable / apple-touch (generated)
posts/index.json         post catalog (metadata)
posts/*.json             post bodies as typed content blocks
supabase/schema.sql      blog_posts + blog_reactions tables with RLS
supabase/seed.sql        optional seed for issue 01
api/posts.js             Vercel function: published posts from Supabase
api/reactions.js         Vercel function: clap counts + inserts
tools/make-icons.py      dependency-free PNG icon generator
```

## Run it locally

No build step, no dependencies:

```bash
cd chalk-and-cue
python3 -m http.server 8080
# open http://localhost:8080
```

The `/api/*` routes only exist on Vercel. Locally the app uses the bundled posts and keeps claps in `localStorage`, so everything still works.

## PWA features

- Installable (`beforeinstallprompt` + manifest shortcuts), standalone display.
- Full offline support: the shell, fonts, icons, catalog and all post JSON are precached on install; navigation falls back to `index.html` when offline.
- Network-first shell so new posts appear without a hard refresh; `/api/*` is network-only so cloud data never goes stale.
- Reader controls like Readalong: font family (Atkinson / Literata / Lexend / Lora), reading theme (night / sepia / light / high contrast), and A− / A+ text size. Preferences persist.
- Reading progress bar, sticky table of contents with scroll spy, clap reactions, share, offline badge.

## Adding a post

1. Create `posts/<slug>.json` with a `blocks` array. Supported block types: `h2` (with `id`), `h3`, `lead`, `p`, `ul`, `ol`, `checklist`, `quote`, `callout`, `divider`, `stats`, `route`, `venue`, `sources`. Inline text supports `**bold**`, `*em*`, `` `code` `` and `[label](url)`.
2. Add an entry to `posts/index.json`.
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
5. Redeploy. `/api/health` isn't needed — `/api/posts` returns `{"ok":true,"source":"supabase",...}` once connected, and `{"ok":false,"source":"unconfigured"}` otherwise.

Until the tables exist the site is fully functional with bundled posts and local claps.

## GitHub + Vercel

- Repository: `github.com/ptonline33/chalk-and-cue`
- Deployment: Vercel (team `omarchy1`), static site + zero-config Node functions in `api/`.
- Deploy manually with `vercel --prod`, or connect the GitHub repo for automatic deploys on push.

## Content note

Venue hours, rates and addresses were researched from the rooms' own websites and published listings in November 2026 (sources are listed at the bottom of the guide). **They change.** Call ahead before a long trip — the guide says so too.

## Fonts

Atkinson Hyperlegible, Literata, Lexend and Lora `.woff2` files are self-hosted from the Readalong project so the PWA has no external font dependency and works offline.
